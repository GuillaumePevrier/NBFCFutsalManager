'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

async function initializeOneSignal() {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (oneSignalAppId) {
    await OneSignal.init({ appId: oneSignalAppId });
  } else {
    console.error("OneSignal App ID is not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID in your environment variables.");
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeOneSignal();
    }
  }, []);

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>NBFC Futsal Manager</title>
        <meta name="description" content="Application de gestion de tactique et de match pour le NBFC Futsal." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
