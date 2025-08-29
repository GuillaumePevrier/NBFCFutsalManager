
'use client';

import './globals.css';
import Script from 'next/script';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl = "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png";
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="NBFC Futsal Manager" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NBFC Manager" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#fd5156" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#01182a" />
        
        <link rel="apple-touch-icon" href={logoUrl} />

        <link rel="icon" type="image/png" href={logoUrl} />
        <link rel="manifest" href="/manifest.json" />

        <title>NBFC Futsal Manager</title>
        <meta name="description" content="Application de gestion de tactique et de match pour le NBFC Futsal." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap" rel="stylesheet" />
        
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                if (window.__OS_INIT__) return;
                window.__OS_INIT__ = true;
                
                await OneSignal.init({
                  appId: "fc0ca62b-b752-4d15-bd5b-90b0a0b06d4a",
                });
              });
            `,
          }}
        />
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
