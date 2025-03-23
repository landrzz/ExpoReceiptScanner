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
