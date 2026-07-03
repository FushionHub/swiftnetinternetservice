import { NextResponse } from 'next/server';
import { signUpSubscriber } from '@/services/subscriberService';

export async function POST(request) {
  try {
    const { fullName, phone, email, username, macAddress } = await request.json();

    if (!fullName) {
      return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
    }

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone or Email is required' }, { status: 400 });
    }

    const subscriber = await signUpSubscriber({ fullName, phone, email, username, macAddress });
    return NextResponse.json({ success: true, subscriber }, { status: 201 });
  } catch (error) {
    console.error('Subscriber signup API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
