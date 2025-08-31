
'use server';
/**
 * @fileOverview A Genkit flow for sending notifications via OneSignal.
 * This flow handles the direct API communication with OneSignal.
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
  data: z.record(z.any()).optional().describe("An optional object for custom data."),
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
      console.error("[sendNotificationFlow] OneSignal App ID or REST API Key is not configured.");
      return { success: false, error: "OneSignal credentials are not set on the server." };
    }

    // Construct the notification object for the OneSignal API
    const notification = {
      app_id: ONE_SIGNAL_APP_ID,
      include_player_ids: payload.onesignalIds,
      headings: { en: payload.title },
      contents: { en: payload.body },
      web_url: payload.url, // Correct field for the URL
      data: payload.data, // Pass custom data
      chrome_web_icon: payload.icon,
      firefox_icon: payload.icon,
      // web_push_topic allows grouping notifications so a new one replaces an old one.
      web_push_topic: payload.tag 
    };

    try {
      console.log(`[sendNotificationFlow] Sending notification to ${payload.onesignalIds.length} IDs. Title: "${payload.title}"`);
      
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify(notification),
      });

      const responseData = await response.json();

      // Check if the request was successful and if there are no errors in the response body.
      // OneSignal can return a 200 OK status even if some IDs are invalid.
      if (response.ok && !responseData.errors) {
        console.log('[sendNotificationFlow] OneSignal API call successful. Response:', responseData);
        return { success: true };
      } else {
        // Log the specific errors returned by the OneSignal API for easier debugging.
        console.error("[sendNotificationFlow] OneSignal API Error. Status:", response.status, "Response Data:", responseData);
        const errorMessages = responseData.errors?.join(', ') || `Unknown OneSignal API error. Status: ${response.status}`;
        return { success: false, error: errorMessages };
      }
    } catch (error) {
      console.error('[sendNotificationFlow] Failed to send notification via OneSignal:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during fetch';
      return { success: false, error: errorMessage };
    }
  }
);
