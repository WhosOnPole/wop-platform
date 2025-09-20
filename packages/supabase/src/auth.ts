import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createAuthHelpers(supabase: SupabaseClient<Database>) {
  return {
    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    },

    async signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      return { error };
    },

    async resetPassword(email: string) {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      return { data, error };
    },

    async updatePassword(password: string) {
      const { data, error } = await supabase.auth.updateUser({
        password,
      });
      return { data, error };
    },

    getCurrentUser() {
      return supabase.auth.getUser();
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      return supabase.auth.onAuthStateChange(callback);
    },
  };
}
