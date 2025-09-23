import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fall back to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://akjgphgaisyhumgmaeqo.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuYXdnYnZtZnZyb3ZyY2txeHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDAwMDAsImV4cCI6MjA3MDcxNjAwMH0.CO_DuBRCIfWmby3C8MJDsdndAYod_4aZNLT5yGBgNvE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
