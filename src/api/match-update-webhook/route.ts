
// src/app/api/match-update-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Match, Message, Player } from '@/lib/types';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendPushNotification, sendNotificationToAllPlayers } from '@/app/actions';

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
  const opponent = newData.details.opponent || 'Adversaire';
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/match/${newData.id}`;

  // --- Poll Started Notification ---
  const oldPollStatus = oldData.details?.poll?.status;
  const newPollStatus = newData.details?.poll?.status;
  if (oldPollStatus === 'inactive' && newPollStatus === 'active') {
    await sendNotificationToAllPlayers({
      title: `Convocation pour le match`,
      body: `Répondez au sondage pour le match contre ${opponent} le ${new Date(newData.details.date).toLocaleDateString('fr-FR')}.`,
      tag: `poll-${newData.id}`,
      url: url
    });
  }
  
  // NOTE: Goal notification logic has been moved to a Realtime listener
  // using pg_notify as requested by the user.
}


async function handleNewMessage(newMessage: Message) {
    const supabase = createClient();

    // 1. Find the sender's name
    const { data: senderData, error: senderError } = await supabase
        .from('players')
        .select('name')
        .eq('user_id', newMessage.user_id)
        .single();
    
    if (senderError) {
        console.error('Could not find sender for new message notification:', senderError);
        return;
    }
    const senderName = senderData.name;

    // 2. Find all participants of the channel EXCEPT the sender
    const { data: participants, error: participantsError } = await supabase
        .from('channel_participants')
        .select('user_id')
        .eq('channel_id', newMessage.channel_id)
        .neq('user_id', newMessage.user_id);
    
    if (participantsError) {
        console.error('Could not find participants for new message notification:', participantsError);
        return;
    }

    // 3. Send a notification to each participant
    const notificationPayload = {
        title: `Nouveau message de ${senderName}`,
        body: newMessage.content,
        tag: `chat-${newMessage.channel_id}`,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${newMessage.channel_id}`
    };

    for (const participant of participants) {
        await sendPushNotification(participant.user_id, notificationPayload);
    }
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
