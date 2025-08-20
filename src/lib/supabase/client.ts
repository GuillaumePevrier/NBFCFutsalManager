'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    "https://vehbxkqndoqmqwtjbcjr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ4a3FuZG9xbXF3dGpiY2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTYzNzcsImV4cCI6MjA2OTEzMjM3N30.Egrs2V0fmAJnZcpcLaHtQ3iTmBEEVU8rBLmc8qZgI6g"
  );
}
