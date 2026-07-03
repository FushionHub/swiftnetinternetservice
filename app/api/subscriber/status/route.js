import { NextResponse } from 'next/server';
import { findSubscriberByIdentifier, runExpirationCheck } from '@/services/subscriberService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier query parameter is required' }, { status: 400 });
    }

    // Run expiration check first to keep DB clean
    await runExpirationCheck().catch(err => console.error('Cron check failed during status call:', err));

    const subscriber = await findSubscriberByIdentifier(identifier);
    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    const now = new Date();
    const active = subscriber.status === 'ACTIVE' && 
                   subscriber.subscriptionExpiry && 
                   subscriber.subscriptionExpiry > now;

    let remainingSeconds = 0;
    if (active) {
      remainingSeconds = Math.max(0, Math.floor((subscriber.subscriptionExpiry.getTime() - now.getTime()) / 1000));
    }

    return NextResponse.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        fullName: subscriber.fullName,
        username: subscriber.username,
        phone: subscriber.phone,
        email: subscriber.email,
        status: active ? 'ACTIVE' : 'EXPIRED',
        subscriptionStart: subscriber.subscriptionStart,
        subscriptionExpiry: subscriber.subscriptionExpiry
      },
      active,
      remainingSeconds
    });
  } catch (error) {
    console.error('Subscriber status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
