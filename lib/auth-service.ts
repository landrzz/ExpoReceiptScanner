import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Signs up a new user with email and password
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign up user with email:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }

    console.log('Signup response data:', data);
    
    // Check if email confirmation is required
    const isEmailConfirmationRequired = data.user?.identities?.length === 0 || 
      (data.user && !data.user.confirmed_at);
      
    console.log('Email confirmation required?', isEmailConfirmationRequired);

    // Create user profile if user was created
    if (data.user && data.user.id) {
      await ensureUserProfileExists(data.user.id, email);
    }

    return { 
      user: data.user, 
      success: true, 
      isEmailConfirmationRequired 
    };
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
    console.log('Attempting to sign in user with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
      // Check if the error is due to email not being confirmed
      if (error.message.includes('Email not confirmed')) {
        return { 
          user: null, 
          session: null, 
          success: false, 
          error,
          isEmailConfirmationRequired: true 
        };
      }
      throw error;
    }

    console.log('Signin successful, user:', data.user?.id);
    
    // Ensure user profile exists on sign in as well
    if (data.user && data.user.id) {
      await ensureUserProfileExists(data.user.id, email);
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
    // First check if there's a valid session
    const { data } = await supabase.auth.getSession();
    
    // If no session exists, just return success (already signed out)
    if (!data.session) {
      console.log('No active session found, user is already signed out');
      return { success: true };
    }
    
    // Proceed with sign out since we have a session
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
    let redirectTo;
    
    if (Platform.OS === 'web') {
      // Using absolute URL for web platform with explicit protocol
      redirectTo = `${window.location.origin}/reset-password`;
      console.log('Web platform detected - reset URL:', redirectTo);
    } else {
      // For mobile, use the app's URL scheme
      const scheme = Constants.expoConfig?.scheme || 'exp';
      redirectTo = `${scheme}://reset-password`;
      console.log('Mobile platform detected - reset URL:', redirectTo);
    }
    
    console.log('Sending password reset email to:', email);
    console.log('With redirect URL:', redirectTo);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    
    if (error) {
      console.error('Supabase returned error on password reset:', error);
      return { success: false, error };
    }
    
    console.log('Password reset email sent successfully, response data:', data);
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};

/**
 * Creates or updates a user record in the public.users table
 * This is necessary because the receipts table has a foreign key to public.users
 */
export const ensureUserProfileExists = async (userId: string, email?: string) => {
  try {
    if (!userId) {
      console.error('Cannot create user profile: No user ID provided');
      return { success: false, error: 'No user ID provided' };
    }
    
    console.log('Ensuring user profile exists for user:', userId);
    
    // Use upsert to either create a new record or update an existing one
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          id: userId,
          email: email,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
    
    if (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error };
    }
    
    console.log('User profile created/updated successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Exception creating user profile:', error);
    return { success: false, error };
  }
};
