import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const page = await prisma.pageContent.findUnique({
      where: { pageKey: params.pageKey }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}
