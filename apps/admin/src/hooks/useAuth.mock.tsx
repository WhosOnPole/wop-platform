import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const value = {
    user,
    loading,
    signUp: async (_email: string, _password: string) => {
      console.log('Sign up:', _email);
      return { data: null, error: null };
    },
    signIn: async (_email: string, _password: string) => {
      console.log('Sign in:', _email);
      return { data: null, error: null };
    },
    signOut: async () => {
      console.log('Sign out');
      return { error: null };
    },
    resetPassword: async (email: string) => {
      console.log('Reset password:', email);
      return { data: null, error: null };
    },
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
