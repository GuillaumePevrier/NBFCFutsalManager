
// src/app/api/match-update-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { sendOneSignalNotification, type SendOneSignalNotificationInput } from '@/ai/flows/send-onesignal-notification';
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


// ========== Notification Handlers ==========

function getNotificationForMatchUpdate(oldData: Match, newData: Match): SendOneSignalNotificationInput | null {
  const opponent = newData.details.opponent || 'Adversaire';
  const oldScore = oldData.scoreboard;
  const newScore = newData.scoreboard;
  const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/match/${newData.id}`;
  const topic = `match-${newData.id}`;

  if (newScore.homeScore > oldScore.homeScore) {
    return {
      title: `BUT POUR NBFC FUTSAL !`,
      message: `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore} contre ${opponent}.`,
      type: 'goal',
      targetUrl,
      topic,
    };
  }
  if (newScore.awayScore > oldScore.awayScore) {
    return {
      title: `But pour ${opponent} !`,
      message: `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore}.`,
      type: 'goal',
      targetUrl,
      topic,
    };
  }

  return null; // Pas de changement notable pour une notification
}


async function getNotificationForNewMessage(message: Message): Promise<SendOneSignalNotificationInput | null> {
    const supabase = createClient();

    // 1. Get sender's name from players table
    const { data: sender, error: senderError } = await supabase
        .from('players')
        .select('name')
        .eq('user_id', message.user_id)
        .single();
    
    if (senderError || !sender) {
        console.error('Could not find sender for new message notification:', senderError);
        return null;
    }
    
    // 2. Construct the notification payload
    const targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${message.channel_id}`;
    const topic = `channel-${message.channel_id}`;

    return {
        title: `Nouveau message de ${sender.name}`,
        message: message.content,
        type: 'chat_message',
        targetUrl,
        topic,
    };
}


// ========== Main Webhook Handler ==========

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as WebhookPayload;

    let notificationPayload: SendOneSignalNotificationInput | null = null;

    // Route payload to the correct handler based on table and type
    if (payload.table === 'matches' && payload.type === 'UPDATE') {
        const { old_record: oldMatch, record: newMatch } = payload;
        notificationPayload = getNotificationForMatchUpdate(oldMatch, newMatch);
    } 
    else if (payload.table === 'messages' && payload.type === 'INSERT') {
        notificationPayload = await getNotificationForNewMessage(payload.record);
    }
    else {
        return NextResponse.json({ message: 'Ignored: Event does not trigger a notification.' });
    }

    // Send notification if a payload was generated
    if (notificationPayload) {
      console.log('Sending notification:', notificationPayload);
      const result = await sendOneSignalNotification(notificationPayload);

      if (result.success) {
        return NextResponse.json({ message: 'Notification sent successfully', sentCount: result.sentCount });
      } else {
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'No relevant change detected for notification.' });

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
