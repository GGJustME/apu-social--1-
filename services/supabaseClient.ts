import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * SECURITY NOTE:
 * The Supabase URL and Anon Key are designed for frontend use and respect Row Level Security (RLS).
 * 
 * NEVER place the following in this file or any frontend code:
 * - Supabase Service Role Key (full database access)
 * - LiveKit API Secret
 * - Production Gemini API keys
 * 
 * These sensitive secrets must be stored in secure backend environments or Supabase Edge Functions.
 */

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
