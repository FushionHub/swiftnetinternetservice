import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { encrypt } from '@/services/encryption';

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
    const settings = await prisma.settings.findUnique({
      where: { id: 'single-settings' }
    });

    if (!settings) {
      return NextResponse.json({
        paystackEnabled: false,
        paystackPublicKey: '',
        squadEnabled: false,
        squadPublicKey: ''
      });
    }

    return NextResponse.json({
      paystackEnabled: settings.paystackEnabled,
      paystackPublicKey: settings.paystackPublicKey,
      squadEnabled: settings.squadEnabled,
      squadPublicKey: settings.squadPublicKey
    });
  } catch (error) {
    console.error('Failed to fetch payment settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      paystackEnabled,
      paystackPublicKey,
      paystackSecretKey,
      squadEnabled,
      squadPublicKey,
      squadSecretKey
    } = body;

    const data = {};

    if (paystackEnabled !== undefined) data.paystackEnabled = !!paystackEnabled;
    if (paystackPublicKey !== undefined) data.paystackPublicKey = paystackPublicKey;
    if (paystackSecretKey) data.paystackSecretEnc = encrypt(paystackSecretKey);

    if (squadEnabled !== undefined) data.squadEnabled = !!squadEnabled;
    if (squadPublicKey !== undefined) data.squadPublicKey = squadPublicKey;
    if (squadSecretKey) data.squadSecretEnc = encrypt(squadSecretKey);

    await prisma.settings.upsert({
      where: { id: 'single-settings' },
      update: data,
      create: {
        id: 'single-settings',
        ...data
      }
    });

    return NextResponse.json({ success: true, message: 'Payment settings saved successfully' });
  } catch (error) {
    console.error('Failed to update payment settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
