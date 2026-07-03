import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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
  // Public GET to fetch plans for captive portal, no auth required
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, price, duration, mikrotikProfile, rateLimit, sessionTimeout } = await request.json();

    if (!name || price === undefined || !duration || !mikrotikProfile) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const newPlan = await prisma.plan.create({
      data: {
        name,
        price: parseFloat(price),
        duration: parseInt(duration),
        mikrotikProfile,
        rateLimit: rateLimit || '5M/5M',
        sessionTimeout: parseInt(sessionTimeout || duration)
      }
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    if (data.price !== undefined) data.price = parseFloat(data.price);
    if (data.duration !== undefined) data.duration = parseInt(data.duration);
    if (data.sessionTimeout !== undefined) data.sessionTimeout = parseInt(data.sessionTimeout);

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Failed to update plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing plan ID' }, { status: 400 });
    }

    await prisma.plan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.error('Failed to delete plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
