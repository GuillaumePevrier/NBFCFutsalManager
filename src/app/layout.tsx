
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';
import { useEffect } from 'react';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // Clear the app badge when the app is opened or becomes visible
    const clearBadge = () => {
      if (navigator.clearAppBadge) {
        navigator.clearAppBadge();
      }
    };
    
    // Clear badge on initial load
    clearBadge();
    
    // Clear badge when the tab becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        clearBadge();
      }
    });

    // Clean up the event listener
    return () => {
      document.removeEventListener('visibilitychange', clearBadge);
    };

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
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Theme and Icons for PWA */}
        <meta name="theme-color" content="#01182a" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NBFC Futsal" />

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
