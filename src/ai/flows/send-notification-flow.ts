
'use server';
/**
 * @fileOverview A Genkit flow for sending notifications via OneSignal.
 *
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for our flow
const NotificationInputSchema = z.object({
  onesignalIds: z.array(z.string()).describe("A list of OneSignal player IDs to send the notification to."),
  title: z.string().describe("The title of the notification."),
  body: z.string().describe("The main content/body of the notification."),
  url: z.string().optional().describe("An optional URL to open when the notification is clicked."),
  icon: z.string().optional().describe("An optional URL for a custom notification icon."),
  tag: z.string().optional().describe("A tag to group notifications."),
});

// Define the output schema for our flow
const NotificationOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});


// This is the main flow function that will be exported and called from server actions.
export const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: NotificationInputSchema,
    outputSchema: NotificationOutputSchema,
  },
  async (payload) => {
    const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_REST_API_KEY) {
      console.error("OneSignal App ID or REST API Key is not configured.");
      return { success: false, error: "OneSignal credentials are not set on the server." };
    }

    const notification = {
      app_id: ONE_SIGNAL_APP_ID,
      include_player_ids: payload.onesignalIds,
      headings: { en: payload.title },
      contents: { en: payload.body },
      web_url: payload.url,
      chrome_web_icon: payload.icon,
      firefox_icon: payload.icon,
      // You can add more OneSignal options here if needed
      // web_push_topic: payload.tag 
    };

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(notification),
      });

      const responseData = await response.json();

      if (response.ok && !responseData.errors) {
        return { success: true };
      } else {
        console.error("OneSignal API Error:", responseData);
        return { success: false, error: responseData.errors?.join(', ') || 'Unknown OneSignal API error.' };
      }
    } catch (error) {
      console.error('Failed to send notification via OneSignal:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }
);
