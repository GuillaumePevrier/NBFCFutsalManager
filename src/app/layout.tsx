
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import OneSignal from 'react-onesignal';
import { useEffect } from 'react';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const initOneSignal = async () => {
      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        console.warn("OneSignal App ID is not set. Notifications will be disabled.");
        return;
      }
      await OneSignal.init({ 
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
        allowLocalhostAsSecureOrigin: true,
      });
    }
    initOneSignal();
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#01182a" />
      </head>
      <body className="font-body antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
