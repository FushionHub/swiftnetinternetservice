import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encrypt function
function encrypt(text) {
  if (!text) return '';
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key-123456', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Verify token (simplified - in production use proper JWT verification)
    // For now, we'll just check if it exists

    const settings = await prisma.settings.findUnique({
      where: { id: 'single-settings' }
    });

    if (!settings) {
      return NextResponse.json({
        emailEnabled: false,
        emailHost: '',
        emailPort: 587,
        emailUser: '',
        emailFrom: '',
        emailFromName: ''
      });
    }

    return NextResponse.json({
      emailEnabled: settings.emailEnabled,
      emailHost: settings.emailHost,
      emailPort: settings.emailPort,
      emailUser: settings.emailUser,
      emailFrom: settings.emailFrom,
      emailFromName: settings.emailFromName
    });
  } catch (error) {
    console.error('Email settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Verify token (simplified)

    const body = await request.json();
    const {
      emailEnabled,
      emailHost,
      emailPort,
      emailUser,
      emailPassword,
      emailFrom,
      emailFromName
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: 'single-settings' },
      update: {
        emailEnabled,
        emailHost,
        emailPort: emailPort || 587,
        emailUser,
        emailPasswordEnc: emailPassword ? encrypt(emailPassword) : undefined,
        emailFrom,
        emailFromName
      },
      create: {
        id: 'single-settings',
        emailEnabled,
        emailHost,
        emailPort: emailPort || 587,
        emailUser,
        emailPasswordEnc: emailPassword ? encrypt(emailPassword) : '',
        emailFrom,
        emailFromName
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email settings saved successfully'
    });
  } catch (error) {
    console.error('Email settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
