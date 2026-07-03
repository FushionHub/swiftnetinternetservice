import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkRouterConnection } from '@/services/mikrotikService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-me';

// Auth checker
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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Active subscribers count
    const activeSubscribersCount = await prisma.subscriber.count({
      where: {
        status: 'ACTIVE',
        subscriptionExpiry: { gte: now }
      }
    });

    // 2. Revenue aggregates
    const transactionsToday = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', createdAt: { gte: todayStart } }
    });

    const transactionsWeek = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', createdAt: { gte: weekStart } }
    });

    const transactionsMonth = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS', createdAt: { gte: monthStart } }
    });

    // 3. Router connection status
    const routerStatus = await checkRouterConnection();

    // 4. Recent transactions list
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriber: { select: { fullName: true, username: true } },
        plan: { select: { name: true } }
      }
    });

    return NextResponse.json({
      activeSubscribers: activeSubscribersCount,
      revenueToday: transactionsToday._sum.amount || 0,
      revenueWeek: transactionsWeek._sum.amount || 0,
      revenueMonth: transactionsMonth._sum.amount || 0,
      router: routerStatus,
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard stats fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
