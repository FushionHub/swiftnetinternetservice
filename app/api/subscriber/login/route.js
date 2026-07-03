import { NextResponse } from 'next/server';
import { loginSubscriber } from '@/services/subscriberService';

export async function POST(request) {
  try {
    const { identifier, macAddress } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identifier (phone/email/username) is required' }, { status: 400 });
    }

    const { subscriber, active } = await loginSubscriber(identifier, macAddress);
    return NextResponse.json({ success: true, subscriber, active });
  } catch (error) {
    console.error('Subscriber login API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
