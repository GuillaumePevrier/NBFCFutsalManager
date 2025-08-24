// src/app/api/match-update-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Match, Message } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

interface MatchWebhookPayload {
  type: 'UPDATE';
  table: 'matches';
  record: Match;
  old_record: Match;
  schema: 'public';
}

interface MessageWebhookPayload {
    type: 'INSERT';
    table: 'messages';
    record: Message;
    old_record: {};
    schema: 'public';
}

type WebhookPayload = MatchWebhookPayload | MessageWebhookPayload;


// ========== Notification Logic ==========

async function handleMatchUpdate(oldData: Match, newData: Match) {
  // This function is kept for potential future use or non-push notification logic,
  // but the push notification part will be handled by OneSignal.
  console.log('Match update detected, but push notifications are now handled by a separate service.');
}


async function handleNewMessage(newMessage: Message) {
    // This function is kept for potential future use or non-push notification logic,
    // but the push notification part will be handled by OneSignal.
    console.log('New message detected, but push notifications are now handled by a separate service.');
}


// ========== Main Webhook Handler ==========

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as WebhookPayload;

    console.log('Webhook received for table:', payload.table, 'type:', payload.type);

    if (payload.table === 'matches' && payload.type === 'UPDATE') {
        await handleMatchUpdate(payload.old_record, payload.record);
    } 
    else if (payload.table === 'messages' && payload.type === 'INSERT') {
        await handleNewMessage(payload.record);
    }
    else {
        return NextResponse.json({ message: 'Ignored: Event does not trigger a notification.' });
    }

    return NextResponse.json({ message: 'Webhook processed.' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
