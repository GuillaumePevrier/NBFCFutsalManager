'use server';

/**
 * @fileOverview A flow for sending push notifications.
 */

import { ai } from '@/ai/genkit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import webpush from 'web-push';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  message: z.string().describe('The main content of the notification.'),
  opponent: z.string(),
  date: z.string(),
  time: z.string(),
  location: z.string(),
});

export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

export async function sendNotification(input: SendNotificationInput) {
  return sendNotificationFlow(input);
}

const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.object({ success: z.boolean(), sentCount: z.number() }),
  },
  async (input) => {
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("VAPID keys or Supabase config are not configured.");
      return { success: false, sentCount: 0 };
    }

    // You need to set your email here
    webpush.setVapidDetails(
      'mailto:contact@nbfcfutsal.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('subscription_object');

    if (error) {
      console.error("Failed to fetch subscriptions", error);
      return { success: false, sentCount: 0 };
    }
    
    const notificationPayload = JSON.stringify({
      title: input.title,
      body: input.message,
      icon: '/logo.png', // optional
    });

    let sentCount = 0;
    const sendPromises = subscriptions.map(async (s: any) => {
      try {
        await webpush.sendNotification(s.subscription_object, notificationPayload);
        sentCount++;
      } catch (err) {
        console.error('Error sending notification, it might be expired.', err);
        // Here you might want to delete the expired subscription from your DB
      }
    });

    await Promise.all(sendPromises);
    
    return { success: true, sentCount: sentCount };
  }
);
