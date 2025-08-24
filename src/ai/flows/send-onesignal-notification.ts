
'use server';
/**
 * @fileOverview Flow to send notifications via the OneSignal API.
 * 
 * - sendNotificationToAllPlayers: Sends a push notification to all subscribed users.
 * - SendNotificationInput: The input type for the sendNotificationToAllPlayers function.
 * - SendNotificationOutput: The return type for the sendNotificationToAllPlayers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the push notification.'),
  message: z.string().describe('The main content/body of the push notification.'),
  url: z.string().optional().describe('An optional URL to open when the notification is clicked.'),
});
export type SendNotificationInput = z.infer<typeof SendNotificationInputSchema>;

const SendNotificationOutputSchema = z.object({
    success: z.boolean(),
    error: z.string().optional(),
});
export type SendNotificationOutput = z.infer<typeof SendNotificationOutputSchema>;


export async function sendNotificationToAllPlayers(input: SendNotificationInput): Promise<SendNotificationOutput> {
  return sendOneSignalNotificationFlow(input);
}


const sendOneSignalNotificationFlow = ai.defineFlow(
  {
    name: 'sendOneSignalNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: SendNotificationOutputSchema,
  },
  async (payload) => {
    const { title, message, url } = payload;
    const appId = process.env.ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      console.error("OneSignal credentials are not set in environment variables.");
      return { success: false, error: "OneSignal credentials are not configured on the server." };
    }

    const notification = {
        app_id: appId,
        contents: { en: message },
        headings: { en: title },
        included_segments: ["Subscribed Users"], // This targets everyone
        url: url || undefined,
        chrome_web_icon: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png',
        firefox_icon: 'https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png',
    };

    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${restApiKey}`,
            },
            body: JSON.stringify(notification),
        });

        const data = await response.json();

        if (response.ok && !data.errors) {
            console.log("OneSignal notification sent successfully:", data);
            return { success: true };
        } else {
            console.error("Error sending OneSignal notification:", data.errors);
            return { success: false, error: `OneSignal API error: ${JSON.stringify(data.errors)}` };
        }
    } catch (error) {
        console.error("Failed to send notification:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown fetch error occurred';
        return { success: false, error: errorMessage };
    }
  }
);
