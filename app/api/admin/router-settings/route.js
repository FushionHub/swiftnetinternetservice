import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { encrypt } from '@/services/encryption';
import { checkRouterConnection } from '@/services/mikrotikService';

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
      return NextResponse.json({ routerHost: '', routerPort: 8728, routerUser: '' });
    }

    return NextResponse.json({
      routerHost: settings.routerHost,
      routerPort: settings.routerPort,
      routerUser: settings.routerUser
    });
  } catch (error) {
    console.error('Failed to fetch router settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { routerHost, routerPort, routerUser, routerPassword } = await request.json();

    if (!routerHost || !routerUser) {
      return NextResponse.json({ error: 'Host and Username are required' }, { status: 400 });
    }

    const data = {
      routerHost,
      routerPort: parseInt(routerPort) || 8728,
      routerUser
    };

    if (routerPassword) {
      data.routerPasswordEnc = encrypt(routerPassword);
    }

    const updatedSettings = await prisma.settings.upsert({
      where: { id: 'single-settings' },
      update: data,
      create: {
        id: 'single-settings',
        ...data
      }
    });

    // Test connection with new settings
    const routerTest = await checkRouterConnection();

    return NextResponse.json({
      success: true,
      message: 'Router settings saved successfully',
      routerStatus: routerTest.status,
      routerMessage: routerTest.message
    });
  } catch (error) {
    console.error('Failed to update router settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
