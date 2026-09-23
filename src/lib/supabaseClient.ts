import { createClient } from '@supabase/supabase-js';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Use host origin if Supabase URL is not configured or dummy
const isConfigured = envUrl && !envUrl.includes('xyzcompany.supabase.co');
const SUPABASE_URL = isConfigured
  ? envUrl
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

const SUPABASE_ANON_KEY = isConfigured && envAnonKey
  ? envAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
