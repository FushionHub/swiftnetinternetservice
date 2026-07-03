import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { initializePayment } from '@/services/paymentService';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { planId, subscriberId, provider, callbackUrl } = await request.json();

    if (!planId || !subscriberId || !provider || !callbackUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const result = await initializePayment(plan, subscriber, provider, callbackUrl);

    // Save pending transaction in database
    await prisma.transaction.create({
      data: {
        subscriberId,
        planId,
        provider: provider.toUpperCase(),
        providerRef: result.reference,
        amount: plan.price,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
