'use server';

/**
 * @fileOverview A flow for sending push notifications.
 */

import { ai } from '@/ai/genkit';
import { createClient } from '@/lib/supabase/server';
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
    
    // This is a simulation. In a real scenario, you would fetch subscriptions
    // from your database and use the web-push library to send notifications.
    console.log('Simulating sending notifications with input:', input);
    
    // Here is how you would configure web-push
    /*
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("VAPID keys are not configured.");
      return { success: false, sentCount: 0 };
    }

    webpush.setVapidDetails(
      'mailto:youremail@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const supabase = createClient();
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

    await Promise.all(sentPromises);
    */
   
    // For now, we just return a success message.
    return { success: true, sentCount: 0 }; // Change sentCount when implementing for real
  }
);
