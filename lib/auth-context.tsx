import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { getSession, ensureUserProfileExists } from './auth-service';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session on mount
    const loadSession = async () => {
      setIsLoading(true);
      const { session: currentSession } = await getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      // Ensure user profile exists if we have a session
      if (currentSession?.user) {
        await ensureUserProfileExists(
          currentSession.user.id, 
          currentSession.user.email
        );
      }
      
      setIsLoading(false);
    };

    loadSession();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Ensure user profile exists when auth state changes
        if (newSession?.user) {
          await ensureUserProfileExists(
            newSession.user.id,
            newSession.user.email
          );
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
