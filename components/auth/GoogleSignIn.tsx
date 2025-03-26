import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

// You'll need to replace this with your actual Web Client ID from Google Cloud Console
const WEB_CLIENT_ID = '268502834320-09utbslbtotal0967issbg42oc98r14p.apps.googleusercontent.com';

export const GoogleSignIn = () => {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = () => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID, // Get this from Google Cloud Console
      offlineAccess: false,
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      // Check if Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      
      // Sign in with Google and get current user info
      await GoogleSignin.signIn();
      const currentUser = await GoogleSignin.getCurrentUser();
      
      // Access the idToken from the currentUser
      if (currentUser && currentUser.idToken) {
        // Sign in with Supabase using the Google ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: currentUser.idToken,
        });
        
        if (error) {
          console.error('Supabase sign in error:', error);
        } else {
          console.log('Successfully signed in with Google', data);
          // Navigate to the main screen or wherever you want after successful login
          router.replace('/(app)');
        }
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in operation is in progress already');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available or outdated');
      } else {
        console.error('Google sign in error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleGoogleSignIn}
        style={styles.googleButton}
      />
      
      {/* Alternative custom button */}
      <TouchableOpacity 
        style={styles.customGoogleButton}
        onPress={handleGoogleSignIn}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  googleButton: {
    width: 240,
    height: 48,
    marginBottom: 16,
  },
  customGoogleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
