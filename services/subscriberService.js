import { PrismaClient } from '@prisma/client';
import { addHotspotUser, removeHotspotUser } from './mikrotikService';

const prisma = new PrismaClient();

// Helper to determine if identifier is email or phone
function parseIdentifier(identifier) {
  const clean = identifier.trim();
  const isEmail = clean.includes('@');
  return {
    email: isEmail ? clean.toLowerCase() : null,
    phone: isEmail ? null : clean
  };
}

export async function findSubscriberByIdentifier(identifier) {
  const clean = identifier.trim();
  return await prisma.subscriber.findFirst({
    where: {
      OR: [
        { username: clean },
        { phone: clean },
        { email: clean.toLowerCase() }
      ]
    },
    include: { currentPlan: true }
  });
}

export async function signUpSubscriber({ fullName, phone, email, username, macAddress }) {
  // Check if subscriber already exists by any identifier
  let existing = await prisma.subscriber.findFirst({
    where: {
      OR: [
        phone ? { phone } : null,
        email ? { email } : null,
        username ? { username } : null
      ].filter(Boolean)
    }
  });

  if (existing) {
    // If MAC address is provided and not set yet, update it
    if (macAddress && !existing.macAddress) {
      existing = await prisma.subscriber.update({
        where: { id: existing.id },
        data: { macAddress }
      });
    }
    return existing;
  }

  // Generate unique username if not provided
  let finalUsername = username;
  if (!finalUsername) {
    const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8);
    const rand = Math.floor(1000 + Math.random() * 9000);
    finalUsername = `${cleanName}${rand}`;
  }

  // Ensure username is unique
  const usernameExists = await prisma.subscriber.findUnique({
    where: { username: finalUsername }
  });
  if (usernameExists) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    finalUsername = `${finalUsername}${rand}`;
  }

  return await prisma.subscriber.create({
    data: {
      fullName,
      phone: phone || `PH-${Date.now()}`,
      email: email || `EM-${Date.now()}@temp.local`,
      username: finalUsername,
      macAddress,
      status: 'INACTIVE'
    }
  });
}

export async function loginSubscriber(identifier, macAddress = null) {
  const subscriber = await findSubscriberByIdentifier(identifier);
  if (!subscriber) {
    throw new Error('Subscriber account not found');
  }

  // Update MAC address if captured automatically
  if (macAddress && subscriber.macAddress !== macAddress) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { macAddress }
    });
    subscriber.macAddress = macAddress;
  }

  // Check if current subscription is still active
  const now = new Date();
  if (subscriber.status === 'ACTIVE' && subscriber.subscriptionExpiry && subscriber.subscriptionExpiry > now) {
    // Subscriber is active. Reconnect them on MikroTik just in case
    try {
      const remainingSec = Math.max(0, Math.floor((subscriber.subscriptionExpiry.getTime() - now.getTime()) / 1000));
      await addHotspotUser(
        subscriber.username,
        subscriber.username, // username is password for captive portal simplification
        subscriber.currentPlan.mikrotikProfile,
        remainingSec,
        subscriber.macAddress
      );
    } catch (err) {
      console.error('Failed to sync login status to MikroTik:', err.message);
    }
    return { subscriber, active: true };
  }

  // Expired or inactive
  return { subscriber, active: false };
}

export async function activateSubscription(subscriberId, planId, transactionRef, provider) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
  if (!subscriber) throw new Error('Subscriber not found');

  const now = new Date();
  const expiry = new Date(now.getTime() + plan.duration * 1000);

  // Update subscriber details in DB
  const updatedSubscriber = await prisma.subscriber.update({
    where: { id: subscriberId },
    data: {
      currentPlanId: plan.id,
      subscriptionStart: now,
      subscriptionExpiry: expiry,
      status: 'ACTIVE'
    }
  });

  // Create or update Transaction
  await prisma.transaction.upsert({
    where: { providerRef: transactionRef },
    update: { status: 'SUCCESS' },
    create: {
      subscriberId,
      planId,
      provider,
      providerRef: transactionRef,
      amount: plan.price,
      status: 'SUCCESS'
    }
  });

  // Add user to MikroTik Router
  try {
    await addHotspotUser(
      subscriber.username,
      subscriber.username, // Using username as password
      plan.mikrotikProfile,
      plan.duration,
      subscriber.macAddress
    );
  } catch (err) {
    console.error('MikroTik user activation failed but subscription recorded:', err.message);
    // Do not fail the activation process if the router is currently offline
  }

  return updatedSubscriber;
}

export async function runExpirationCheck() {
  const now = new Date();
  
  // Find all active subscribers that have expired
  const expiredSubscribers = await prisma.subscriber.findMany({
    where: {
      status: 'ACTIVE',
      subscriptionExpiry: { lte: now }
    }
  });

  console.log(`Running cron: found ${expiredSubscribers.length} expired subscribers.`);

  for (const sub of expiredSubscribers) {
    try {
      // 1. Remove from MikroTik
      await removeHotspotUser(sub.username);
    } catch (err) {
      console.error(`Failed to remove expired user ${sub.username} from MikroTik:`, err.message);
    }

    // 2. Mark status as EXPIRED in DB
    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED' }
    });
  }
}
