
'use server';

/**
 * @fileOverview A flow for sending push notifications via OneSignal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SendOneSignalNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  message: z.string().describe('The main content of the notification.'),
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

    console.log(`Attempting to send notification: "${input.title}"`);

    const notification = {
      app_id: appId,
      included_segments: ["Subscribed Users"], // Sends to all subscribed users
      headings: { en: input.title },
      contents: { en: input.message },
      // You can add more options here, like a URL to open on click
      // web_url: 'https://yoursite.com/match/123'
    };
    
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
