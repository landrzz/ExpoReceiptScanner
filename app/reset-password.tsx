import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Extract the token from URL parameters
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const query = typeof window !== 'undefined' ? window.location.search : '';
    
    console.log('Reset password page loaded');
    console.log('URL hash:', hash);
    console.log('URL query:', query);
    console.log('URL params:', params);

    // For local testing, we'll accept a direct token parameter as well
    const manualToken = params.token || params.access_token;
    if (manualToken) {
      console.log('Found manual token parameter:', manualToken);
      setResetToken(String(manualToken));
      return;
    }

    // The token might be in different places depending on how Supabase constructs the URL
    // It could be in the hash, query params, or directly in the route params
    const extractToken = () => {
      // Try to get from hash fragment
      if (hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        return hashParams.get('access_token');
      }
      
      // Try to get from query params
      if (query.includes('access_token=')) {
        const queryParams = new URLSearchParams(query);
        return queryParams.get('access_token');
      }
      
      // Try to get from hash fragment (type=recovery)
      if (hash.includes('type=recovery')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        return hashParams.get('access_token');
      }
      
      // Try to get directly from params object
      if (params.access_token) {
        return String(params.access_token);
      }
      
      return null;
    };

    const token = extractToken();
    console.log('Extracted token:', token);
    
    if (!token) {
      console.error('No reset token found in URL');
      setTokenError('Could not find a valid reset token in the URL. If you\'re testing locally, you may need to manually provide a token.');
    } else {
      setResetToken(token);
    }
  }, [params]);

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!resetToken) {
      Alert.alert('Error', 'Invalid or missing reset token');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to reset password with token');
      
      // First, check if we need to use the token to get a session
      const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: resetToken,
        type: 'recovery',
      });
      
      if (sessionError) {
        console.error('Error verifying token:', sessionError);
      } else {
        console.log('Token verification successful:', sessionData);
      }
      
      // Update the user's password using the token
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error resetting password:', error);
        Alert.alert('Error', error.message);
      } else {
        console.log('Password update successful:', data);
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now log in with your new password.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
      }
    } catch (error: any) {
      console.error('Error in password reset:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Invalid Reset Link</Text>
        <Text style={styles.message}>
          {tokenError}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Manually enter reset token for testing"
          onChangeText={(text) => {
            if (text.trim()) {
              setResetToken(text.trim());
              setTokenError(null);
            }
          }}
        />
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!resetToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Invalid Reset Link</Text>
        <Text style={styles.message}>
          The password reset link appears to be invalid or has expired.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
