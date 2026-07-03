import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPayment } from '@/services/paymentService';
import { activateSubscription } from '@/services/subscriberService';
const { sendReceiptEmail } = require('@/services/emailService');

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { reference, provider } = await request.json();

    if (!reference || !provider) {
      return NextResponse.json({ error: 'Reference and provider are required' }, { status: 400 });
    }

    // Check if transaction is already successful in DB
    const tx = await prisma.transaction.findUnique({
      where: { providerRef: reference },
      include: { subscriber: true, plan: true }
    });

    if (tx && tx.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Transaction already completed successfully',
        subscriber: tx.subscriber
      });
    }

    // Call payment verification
    const result = await verifyPayment(reference, provider);

    if (result.success) {
      // Activate subscription and create user on router
      const updatedSubscriber = await activateSubscription(
        result.subscriberId,
        result.planId,
        reference,
        provider.toUpperCase()
      );

      // Fetch plan details for email
      const plan = await prisma.plan.findUnique({ where: { id: result.planId } });
      
      // Fetch transaction details for email
      const transaction = await prisma.transaction.findUnique({
        where: { providerRef: reference }
      });

      // Send receipt email asynchronously (don't block response)
      if (updatedSubscriber.email && !updatedSubscriber.email.includes('@temp.local')) {
        sendReceiptEmail(updatedSubscriber, transaction, plan).catch(err => {
          console.error('Failed to send receipt email:', err);
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and access activated',
        subscriber: {
          username: updatedSubscriber.username,
          status: updatedSubscriber.status,
          subscriptionExpiry: updatedSubscriber.subscriptionExpiry
        }
      });
    }

    return NextResponse.json({ success: false, message: 'Payment verification failed or pending' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
