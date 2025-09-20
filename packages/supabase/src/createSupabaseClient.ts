import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseClient(): SupabaseClient<Database> {
  // Use environment variables if available, otherwise fall back to defaults
  const supabaseUrl = (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_SUPABASE_URL) || 
    process.env.VITE_SUPABASE_URL || 
    "https://bnawgbvmfvrovrckqxpu.supabase.co";
  const supabaseAnonKey = (typeof window !== 'undefined' && (window as any).import?.meta?.env?.VITE_SUPABASE_ANON_KEY) || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXdnYnZtZnZyb3ZyY2txeHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDAwMDAsImV4cCI6MjA3MDcxNjAwMH0.CO_DuBRCIfWmby3C8MJDsdndAYod_4aZNLT5yGBgNvE";

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
