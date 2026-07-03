import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/services/paymentService';
import { activateSubscription } from '@/services/subscriberService';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-squad-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const isValid = await verifyWebhookSignature(rawBody, signature, 'SQUAD');
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    // Squad webhooks usually send charge.success or contain transaction info
    const event = payload.Event || payload.event || 'charge.success';
    const bodyData = payload.Body || payload.body || payload.data || payload;

    // Check if status is success or successful
    const status = bodyData.status || bodyData.transaction_status;
    const reference = bodyData.transaction_ref || bodyData.reference;
    
    // Squad metadata is sometimes nested in meta or metadata
    const meta = bodyData.meta || bodyData.metadata;
    const planId = meta?.planId || meta?.plan_id;
    const subscriberId = meta?.subscriberId || meta?.subscriber_id;

    if (event === 'charge.success' || status === 'success') {
      if (planId && subscriberId && reference) {
        await activateSubscription(subscriberId, planId, reference, 'SQUAD');
        console.log(`Squad Webhook Success: Activated subscriber ${subscriberId} for plan ${planId}`);
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Squad webhook handling error:', error);
    return new Response('Internal error', { status: 500 });
  }
}
