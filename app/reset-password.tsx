import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Extract the token from URL parameters
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const query = typeof window !== 'undefined' ? window.location.search : '';
    
    console.log('URL hash:', hash);
    console.log('URL query:', query);
    console.log('URL params:', params);

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
      
      // Try to get from route params
      if (params.access_token) {
        return String(params.access_token);
      }
      
      return null;
    };

    const token = extractToken();
    console.log('Extracted token:', token);
    setResetToken(token);
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
      // Update the user's password using the token
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error resetting password:', error);
        Alert.alert('Error', error.message);
      } else {
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
