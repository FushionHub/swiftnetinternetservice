import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/services/paymentService';
import { activateSubscription } from '@/services/subscriberService';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const isValid = await verifyWebhookSignature(rawBody, signature, 'PAYSTACK');
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const amount = data.amount / 100;
      const planId = data.metadata?.planId;
      const subscriberId = data.metadata?.subscriberId;

      if (planId && subscriberId) {
        await activateSubscription(subscriberId, planId, reference, 'PAYSTACK');
        console.log(`Paystack Webhook Success: Activated subscriber ${subscriberId} for plan ${planId}`);
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Paystack webhook handling error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
