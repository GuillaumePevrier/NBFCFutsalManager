'use client';

import { useOneSignal } from '@/hooks/useOneSignal';
import React from 'react';

export default function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // This hook will initialize OneSignal and handle all the logic.
  // We just need to call it here at the root of our app.
  useOneSignal();

  return <>{children}</>;
}
