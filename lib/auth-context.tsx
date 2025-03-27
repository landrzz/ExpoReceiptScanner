import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import { getSession, ensureUserProfileExists, signOut as authServiceSignOut } from './auth-service';
import { Platform } from 'react-native';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<{ success: boolean, error?: any }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => ({ success: false }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    let isMounted = true;
    
    // For web, add a safety timeout to prevent infinite loading
    let safetyTimer: NodeJS.Timeout | null = null;
    if (isWeb) {
      safetyTimer = setTimeout(() => {
        if (isMounted && isLoading) {
          console.log('[Auth] Safety timeout triggered - ending loading state');
          setIsLoading(false);
        }
      }, 5000); // 5 second safety timeout for web
    }
    
    // Check for an existing session on mount
    const loadSession = async () => {
      try {
        console.log(`[Auth] Loading session on ${Platform.OS} platform...`);
        
        // For web, we'll try to get the session but not block the UI if it fails
        const { session: currentSession, error } = await getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.warn(`[Auth] Error loading session:`, error);
          setIsLoading(false);
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Ensure user profile exists if we have a session
        if (currentSession?.user) {
          try {
            await ensureUserProfileExists(
              currentSession.user.id, 
              currentSession.user.email
            );
          } catch (profileError) {
            console.error('[Auth] Error ensuring user profile exists:', profileError);
          }
        }
      } catch (e) {
        console.error('[Auth] Unexpected error during session loading:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`[Auth] Auth state changed: ${event}`);
        
        if (!isMounted) return;
        
        setSession(newSession);
        setUser(newSession?.user || null);
        
        // Ensure user profile exists when auth state changes
        if (newSession?.user) {
          try {
            await ensureUserProfileExists(
              newSession.user.id,
              newSession.user.email
            );
          } catch (profileError) {
            console.error('[Auth] Error ensuring user profile on auth change:', profileError);
          }
        }
        
        setIsLoading(false);
      }
    );

    // Start loading the session
    loadSession();

    return () => {
      isMounted = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      authListener?.subscription.unsubscribe();
    };
  }, [isLoading, isWeb]);

  const handleSignOut = async () => {
    try {
      // Call the auth service signOut function
      const result = await authServiceSignOut();
      
      // Regardless of the result, clear the local state
      setUser(null);
      setSession(null);
      
      return result;
    } catch (error) {
      console.error('[Auth] Error in handleSignOut:', error);
      
      // Still clear the local state even if there was an error
      setUser(null);
      setSession(null);
      
      return { success: false, error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
