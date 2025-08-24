
'use server';
/**
 * @fileOverview Flow to send push notifications via Firebase Cloud Messaging.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
    // on your server (e.g., Vercel).
    // For local development, you need to set up the ADC:
    // `gcloud auth application-default login`
    admin.initializeApp();
}

export const FcmNotificationPayloadSchema = z.object({
  tokens: z.array(z.string()).describe('A list of FCM registration tokens.'),
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
  icon: z.string().optional().describe('URL to an icon for the notification.'),
  tag: z.string().optional().describe('A tag to group notifications.'),
  data: z.record(z.any()).optional().describe('Arbitrary data payload.'),
});
export type FcmNotificationPayload = z.infer<typeof FcmNotificationPayloadSchema>;

export async function sendFcmNotification(payload: FcmNotificationPayload) {
    return sendFcmNotificationFlow(payload);
}


const sendFcmNotificationFlow = ai.defineFlow(
    {
        name: 'sendFcmNotificationFlow',
        inputSchema: FcmNotificationPayloadSchema,
        outputSchema: z.any(),
    },
    async (payload) => {
        if (!payload.tokens || payload.tokens.length === 0) {
            console.log('No FCM tokens provided, skipping notification.');
            return { success: false, message: 'No tokens.' };
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            webpush: {
                notification: {
                    icon: payload.icon || 'https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png',
                    tag: payload.tag,
                },
                fcm_options: {
                    link: payload.data?.url || process.env.NEXT_PUBLIC_BASE_URL,
                },
            },
            tokens: payload.tokens,
            data: payload.data || {},
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message as any); // Use multicast for multiple tokens
            console.log('Successfully sent message:', response);

            // You can add logic here to handle failures, e.g., to remove invalid tokens from the database.
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`Failed to send to token: ${payload.tokens[idx]}`, resp.error);
                    }
                });
            }

            return { success: true, response };

        } catch (error) {
            console.error('Error sending FCM message:', error);
            return { success: false, error: (error as Error).message };
        }
    }
);
