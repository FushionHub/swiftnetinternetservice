import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './encryption';

const prisma = new PrismaClient();

// Helper to get active payment settings
async function getPaymentSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'single-settings' }
  });
  if (!settings) throw new Error('Payment gateway not configured');
  return settings;
}

export async function initializePayment(plan, subscriber, provider, callbackUrl) {
  const settings = await getPaymentSettings();
  const amountInKobo = Math.round(plan.price * 100);
  const reference = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  if (provider.toUpperCase() === 'PAYSTACK') {
    if (!settings.paystackEnabled) throw new Error('Paystack is disabled');
    const secretKey = decrypt(settings.paystackSecretEnc);
    if (!secretKey) throw new Error('Paystack secret key is missing');

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: subscriber.email || `${subscriber.username}@swiftnet.com`,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
        metadata: {
          planId: plan.id,
          subscriberId: subscriber.id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      reference,
      checkoutUrl: response.data.data.authorization_url,
      provider: 'PAYSTACK'
    };
  } else if (provider.toUpperCase() === 'SQUAD') {
    if (!settings.squadEnabled) throw new Error('Squad is disabled');
    const secretKey = decrypt(settings.squadSecretEnc);
    if (!secretKey) throw new Error('Squad secret key is missing');

    // Squad sandbox URL vs production URL
    const isSandbox = secretKey.startsWith('sandbox_sk_');
    const baseUrl = isSandbox 
      ? 'https://sandbox-api-d.squadco.com' 
      : 'https://api-d.squadco.com';

    const response = await axios.post(
      `${baseUrl}/transaction/initiate`,
      {
        email: subscriber.email || `${subscriber.username}@swiftnet.com`,
        amount: amountInKobo,
        transaction_ref: reference,
        callback_url: callbackUrl,
        currency: 'NGN',
        pass_charge: true,
        metadata: {
          planId: plan.id,
          subscriberId: subscriber.id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      reference,
      checkoutUrl: response.data.data.checkout_url,
      provider: 'SQUAD'
    };
  } else {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

export async function verifyPayment(reference, provider) {
  const settings = await getPaymentSettings();

  if (provider.toUpperCase() === 'PAYSTACK') {
    const secretKey = decrypt(settings.paystackSecretEnc);
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` }
      }
    );

    const data = response.data.data;
    if (data.status === 'success') {
      return {
        success: true,
        amount: data.amount / 100,
        planId: data.metadata?.planId,
        subscriberId: data.metadata?.subscriberId,
        reference
      };
    }
  } else if (provider.toUpperCase() === 'SQUAD') {
    const secretKey = decrypt(settings.squadSecretEnc);
    const isSandbox = secretKey.startsWith('sandbox_sk_');
    const baseUrl = isSandbox 
      ? 'https://sandbox-api-d.squadco.com' 
      : 'https://api-d.squadco.com';

    const response = await axios.get(
      `${baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` }
      }
    );

    const data = response.data.data;
    // Squad verify response status can be 'success' or transaction status
    if (data && (data.transaction_status === 'success' || data.status === 'success')) {
      return {
        success: true,
        amount: data.amount / 100,
        planId: data.meta?.planId || data.metadata?.planId,
        subscriberId: data.meta?.subscriberId || data.metadata?.subscriberId,
        reference
      };
    }
  }

  return { success: false, reference };
}

export async function verifyWebhookSignature(rawBody, signature, provider) {
  try {
    const settings = await getPaymentSettings();
    let secretKey = '';

    if (provider.toUpperCase() === 'PAYSTACK') {
      secretKey = decrypt(settings.paystackSecretEnc);
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody)
        .digest('hex');
      return hash === signature;
    } else if (provider.toUpperCase() === 'SQUAD') {
      secretKey = decrypt(settings.squadSecretEnc);
      // Squad webhook HMAC is also SHA-512 (or SHA256) of raw body.
      // Usually Squad webhooks use SHA512 of body with secret key.
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(rawBody)
        .digest('hex').toUpperCase(); // Squad uses UPPERCASE hash
      return hash === signature.toUpperCase();
    }
  } catch (error) {
    console.error('Webhook signature verification error:', error);
  }
  return false;
}
