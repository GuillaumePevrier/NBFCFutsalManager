
// src/app/api/match-update-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Match, Message, Player } from '@/lib/types';
import { sendNotificationToAllPlayers } from '@/ai/flows/send-onesignal-notification';

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
  const oldScore = oldData.scoreboard;
  const newScore = newData.scoreboard;
  
  let title: string | null = null;
  let message: string | null = null;
  let url: string = `${process.env.NEXT_PUBLIC_BASE_URL}/match/${newData.id}`;

  // --- Goal Notification ---
  if (newScore.homeScore > oldScore.homeScore) {
    title = `BUT POUR NBFC FUTSAL !`;
    message = `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore} contre ${opponent}.`;
  } else if (newScore.awayScore > oldScore.awayScore) {
    title = `But pour ${opponent} !`;
    message = `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore}.`;
  }
  if (title && message) {
    await sendNotificationToAllPlayers({ title, message, url });
  }

  // --- Poll Started Notification ---
  const oldPollStatus = oldData.details?.poll?.status;
  const newPollStatus = newData.details?.poll?.status;
  if (oldPollStatus === 'inactive' && newPollStatus === 'active') {
    await sendNotificationToAllPlayers({
      title: `Convocation pour le match`,
      message: `Répondez au sondage pour le match contre ${opponent} le ${new Date(newData.details.date).toLocaleDateString('fr-FR')}.`,
      url
    });
  }
}


async function handleNewMessage(newMessage: Message) {
    // TODO: Re-implement with OneSignal to target specific users
    console.log('New message detected. Notification logic to be implemented with OneSignal targeting specific users.');
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
