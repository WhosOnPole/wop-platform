import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirect to feed after successful authentication
        if (event === 'SIGNED_IN' && session?.user) {
          window.location.href = '/feed';
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    // Don't redirect to feed immediately - let the auth state change handle it
    const redirectUrl = `${window.location.origin}/`;
    
    // Use Supabase's OAuth but intercept and fix the URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    
    if (error) {
      console.error('OAuth error:', error);
      return { data, error };
    }
    
    if (data?.url) {
      // Fix the redirect_uri parameter to ensure proper ? formatting
      const url = new URL(data.url);
      const redirectUri = url.searchParams.get('redirect_uri');
      
      console.log('Original redirect_uri:', redirectUri);
      
      if (redirectUri && redirectUri.includes('flowName=GeneralOAuthFlow')) {
        // Fix the malformed redirect_uri by ensuring proper ? formatting
        let fixedRedirectUri = redirectUri;
        
        // Check if there's a space before flowName and replace with ?
        if (redirectUri.includes(' flowName=GeneralOAuthFlow')) {
          fixedRedirectUri = redirectUri.replace(' flowName=GeneralOAuthFlow', '?flowName=GeneralOAuthFlow');
        } else if (redirectUri.includes('flowName=GeneralOAuthFlow') && !redirectUri.includes('?flowName=')) {
          fixedRedirectUri = redirectUri.replace('flowName=GeneralOAuthFlow', '?flowName=GeneralOAuthFlow');
        }
        
        console.log('Fixed redirect_uri:', fixedRedirectUri);
        url.searchParams.set('redirect_uri', fixedRedirectUri);
      }
      
      console.log('Final OAuth URL:', url.toString());
      
      // Redirect immediately to Google OAuth
      window.location.href = url.toString();
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
