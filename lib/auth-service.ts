import { supabase } from './supabase';

/**
 * Signs up a new user with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { user: data.user, success: true };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, success: false, error };
  }
};

/**
 * Signs in an existing user with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { user: data.user, session: data.session, success: true };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, session: null, success: false, error };
  }
};

/**
 * Signs the user out
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

/**
 * Gets the current user session
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return { session: data.session, success: true };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, success: false, error };
  }
};

/**
 * Sends a password reset email
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};
