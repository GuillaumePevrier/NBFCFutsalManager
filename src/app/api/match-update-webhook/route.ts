// src/app/api/match-update-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { sendOneSignalNotification, type SendOneSignalNotificationInput } from '@/ai/flows/send-onesignal-notification';
import type { Match } from '@/lib/types';

interface WebhookPayload {
  type: 'UPDATE';
  table: string;
  record: Match;
  old_record: Match;
  schema: 'public';
}

// Fonction pour déterminer le type d'événement et construire le message de notification
function getNotificationForUpdate(oldData: Match, newData: Match): SendOneSignalNotificationInput | null {
  const opponent = newData.details.opponent || 'Adversaire';
  const oldScore = oldData.scoreboard;
  const newScore = newData.scoreboard;

  // 1. Détection d'un but
  if (newScore.homeScore > oldScore.homeScore) {
    return {
      title: `BUT POUR NBFC FUTSAL !`,
      message: `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore} contre ${opponent}.`,
      type: 'goal',
      matchId: newData.id
    };
  }
  if (newScore.awayScore > oldScore.awayScore) {
    return {
      title: `But pour ${opponent} !`,
      message: `Le score est maintenant de ${newScore.homeScore} - ${newScore.awayScore}.`,
      type: 'goal',
      matchId: newData.id
    };
  }

  // 2. Détection d'une faute
  if (newScore.homeFouls > oldScore.homeFouls) {
    return {
      title: `Faute pour NBFC Futsal`,
      message: `L'équipe a maintenant commis ${newScore.homeFouls} fautes.`,
      type: 'foul',
      matchId: newData.id
    };
  }
  if (newScore.awayFouls > oldScore.awayFouls) {
    return {
      title: `Faute pour ${opponent}`,
      message: `L'équipe adverse a maintenant commis ${newScore.awayFouls} fautes.`,
      type: 'foul',
      matchId: newData.id
    };
  }
  
  // 3. Détection du début/fin de période (si on ajoute un statut au match plus tard)
  // Exemple: if (newData.status === 'IN_PROGRESS' && oldData.status === 'NOT_STARTED') { ... }

  return null; // Pas de changement notable pour une notification
}


export async function POST(req: NextRequest) {
  try {
    // 1. Sécuriser le Webhook (recommandé)
    // Idéalement, utilisez un secret partagé pour vérifier que la requête vient bien de Supabase
    // const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    // if (req.headers.get('x-supabase-webhook-secret') !== webhookSecret) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const payload = (await req.json()) as WebhookPayload;

    // 2. S'assurer que c'est bien un événement de mise à jour sur la table 'matches'
    if (payload.type !== 'UPDATE' || payload.table !== 'matches') {
      return NextResponse.json({ message: 'Ignored: Not a match update.' });
    }

    const { old_record: oldMatch, record: newMatch } = payload;
    
    // 3. Déterminer si une notification doit être envoyée
    const notificationPayload = getNotificationForUpdate(oldMatch, newMatch);

    if (notificationPayload) {
      // 4. Appeler le Flow Genkit pour envoyer la notification
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
