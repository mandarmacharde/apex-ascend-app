import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// 1. Define the shape of your context data
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

// 2. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // a. Fetch initial session data
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // b. Set up real-time listener for auth changes (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // c. Cleanup function to unsubscribe when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  const value = { session, user, loading };

  // Only render the app once the initial session status is loaded
  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Loading Authentication...</div> : children}
    </AuthContext.Provider>
  );
};

// 4. Custom hook for easy access in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};