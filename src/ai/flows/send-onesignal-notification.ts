
'use server';

/**
 * @fileOverview A flow for sending push notifications via OneSignal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SendOneSignalNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  message: z.string().describe('The main content of the notification.'),
  type: z.enum(['goal', 'foul', 'match_start', 'match_end', 'generic', 'chat_message']).describe('The type of event triggering the notification.'),
  targetUrl: z.string().url().describe('The URL to open when the notification is clicked.'),
  // Optional topic for grouping notifications (e.g., per match or per channel)
  topic: z.string().optional().describe('An optional topic to group notifications.'),
});

export type SendOneSignalNotificationInput = z.infer<typeof SendOneSignalNotificationInputSchema>;

export async function sendOneSignalNotification(input: SendOneSignalNotificationInput) {
  return sendOneSignalNotificationFlow(input);
}

const sendOneSignalNotificationFlow = ai.defineFlow(
  {
    name: 'sendOneSignalNotificationFlow',
    inputSchema: SendOneSignalNotificationInputSchema,
    outputSchema: z.object({ success: z.boolean(), sentCount: z.number().optional() }),
  },
  async (input) => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !apiKey) {
      console.error("OneSignal App ID or REST API Key is not configured.");
      return { success: false };
    }

    console.log(`Attempting to send notification for topic ${input.topic}: "${input.title}"`);

    const notification: any = {
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: input.title },
      contents: { en: input.message },
      web_url: input.targetUrl, 
      web_push_topic: input.topic,
    };
    
    // Add specific icons for different notification types
    if (input.type === 'goal') {
        notification.chrome_web_icon = `${process.env.NEXT_PUBLIC_BASE_URL}/goal-icon.png`;
    } else if (input.type === 'chat_message') {
        notification.chrome_web_icon = `${process.env.NEXT_PUBLIC_BASE_URL}/message-icon.png`;
    }
    
    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${apiKey}`,
        },
        body: JSON.stringify(notification),
      });

      const jsonResponse = await response.json();
      
      if (jsonResponse.errors) {
        console.error("OneSignal API Error:", jsonResponse.errors);
        return { success: false };
      }
      
      console.log("OneSignal API Success Response:", jsonResponse);

      return { success: true, sentCount: jsonResponse.recipients || 0 };

    } catch (error) {
      console.error("Failed to send OneSignal notification", error);
      return { success: false };
    }
  }
);
