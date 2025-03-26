import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// You'll need to replace this with your actual Web Client ID from Google Cloud Console
const WEB_CLIENT_ID = '268502834320-09utbslbtotal0967issbg42oc98r14p.apps.googleusercontent.com';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export const GoogleSignIn = () => {
  const handleGoogleSignIn = async () => {
    if (isExpoGo) {
      Alert.alert(
        'Not Available in Expo Go',
        'Google Sign-In requires a development or production build. It is not available in Expo Go.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // This code won't run in Expo Go, but will work in development builds or production
    try {
      // We're omitting the actual Google Sign-In code to prevent errors in Expo Go
      // In a real build, you would implement the Google Sign-In logic here
      console.log('Would sign in with Google in a development or production build');
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.customGoogleButton}
        onPress={handleGoogleSignIn}
      >
        <Text style={styles.buttonText}>Sign in with Google{isExpoGo ? ' (Unavailable in Expo Go)' : ''}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  customGoogleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    marginTop: 10,
    opacity: isExpoGo ? 0.7 : 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
