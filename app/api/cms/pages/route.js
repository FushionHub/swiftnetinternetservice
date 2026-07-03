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
  try {
    const pages = await prisma.pageContent.findMany({
      orderBy: { pageKey: 'asc' }
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pageKey, title, content, metadata } = await request.json();

    if (!pageKey || !title || !content) {
      return NextResponse.json({ error: 'Page key, title, and content are required' }, { status: 400 });
    }

    const page = await prisma.pageContent.upsert({
      where: { pageKey },
      update: { title, content, metadata },
      create: { pageKey, title, content, metadata }
    });

    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to save page content:', error);
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
  }
}
