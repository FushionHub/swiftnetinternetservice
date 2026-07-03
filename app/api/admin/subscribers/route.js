import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { disconnectHotspotUser, addHotspotUser } from '@/services/mikrotikService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

function verifyAdmin(request) {
  const token = request.cookies.get('admin_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.username === 'admin';
  } catch (e) {
    return false;
  }
}

export async function GET(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
      include: { currentPlan: { select: { name: true, mikrotikProfile: true } } }
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error('Failed to fetch subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, subscriberId, extendSeconds } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: { currentPlan: true }
    });

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    if (action === 'disconnect') {
      try {
        await disconnectHotspotUser(subscriber.username);
      } catch (err) {
        console.warn('Failed to disconnect user on MikroTik (may not be active):', err.message);
      }

      const updated = await prisma.subscriber.update({
        where: { id: subscriberId },
        data: { status: 'EXPIRED', subscriptionExpiry: new Date() }
      });

      return NextResponse.json({ success: true, subscriber: updated, message: 'Subscriber disconnected successfully' });
    }

    if (action === 'extend') {
      if (!extendSeconds || isNaN(extendSeconds)) {
        return NextResponse.json({ error: 'Valid extend duration in seconds is required' }, { status: 400 });
      }

      if (!subscriber.currentPlan) {
        return NextResponse.json({ error: 'Subscriber does not have a plan to extend' }, { status: 400 });
      }

      const now = new Date();
      let currentExpiry = subscriber.subscriptionExpiry && subscriber.subscriptionExpiry > now
        ? subscriber.subscriptionExpiry
        : now;

      const newExpiry = new Date(currentExpiry.getTime() + parseInt(extendSeconds) * 1000);
      const remainingSec = Math.max(0, Math.floor((newExpiry.getTime() - now.getTime()) / 1000));

      const updated = await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          subscriptionExpiry: newExpiry,
          status: 'ACTIVE'
        }
      });

      // Update MikroTik user session limit
      try {
        await addHotspotUser(
          subscriber.username,
          subscriber.username, // Using username as password
          subscriber.currentPlan.mikrotikProfile,
          remainingSec,
          subscriber.macAddress
        );
      } catch (err) {
        console.warn('Failed to update session timeout on MikroTik router:', err.message);
      }

      return NextResponse.json({ success: true, subscriber: updated, message: 'Subscription extended successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscribers administration failed:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
