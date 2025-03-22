import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../lib/auth-service';
import { AuthError } from '@supabase/supabase-js';

type AuthMode = 'login' | 'register' | 'forgotPassword';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (mode === 'forgotPassword') {
      handleResetPassword();
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { success, error, isEmailConfirmationRequired } = await signInWithEmail(email, password);
        
        if (isEmailConfirmationRequired) {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email inbox and confirm your email address before signing in.',
            [
              { 
                text: 'Resend Confirmation', 
                onPress: () => handleResendConfirmation() 
              },
              { text: 'OK' }
            ]
          );
        } else if (!success && error) {
          const authError = error as AuthError;
          Alert.alert('Login Failed', authError.message);
        }
      } else {
        const { success, error, isEmailConfirmationRequired } = await signUpWithEmail(email, password);
        
        if (!success && error) {
          const authError = error as AuthError;
          Alert.alert('Registration Failed', authError.message);
        } else if (success) {
          if (isEmailConfirmationRequired) {
            Alert.alert(
              'Email Confirmation Required',
              'Registration successful! Please check your email to confirm your account before signing in.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Registration Successful',
              'Your account has been created successfully.',
              [{ text: 'OK' }]
            );
          }
          setMode('login');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setIsLoading(true);
      // Use the resetPassword function to resend the confirmation email
      const { success, error } = await resetPassword(email);
      
      if (success) {
        Alert.alert(
          'Confirmation Email Sent',
          'We have sent a new confirmation email to your address. Please check your inbox.'
        );
      } else if (error) {
        const authError = error as AuthError;
        Alert.alert('Error', authError.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);

    try {
      const { success, error } = await resetPassword(email);
      if (!success && error) {
        const authError = error as AuthError;
        Alert.alert('Reset Failed', authError.message);
      } else {
        Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
        setMode('login');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  const goToForgotPassword = () => {
    setMode('forgotPassword');
    setPassword('');
    setConfirmPassword('');
  };

  const goToLogin = () => {
    setMode('login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <View className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
        <TextInput
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {mode !== 'forgotPassword' && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
          <TextInput
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      )}

      {mode === 'register' && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
          <TextInput
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>
      )}

      <TouchableOpacity
        className="w-full bg-blue-500 py-2 rounded-md mb-4"
        onPress={handleAuth}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-medium">
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'}
          </Text>
        )}
      </TouchableOpacity>

      {mode === 'login' && (
        <TouchableOpacity onPress={goToForgotPassword} className="mb-4">
          <Text className="text-blue-500 text-center">Forgot Password?</Text>
        </TouchableOpacity>
      )}

      {mode === 'forgotPassword' && (
        <TouchableOpacity onPress={goToLogin} className="mb-4">
          <Text className="text-blue-500 text-center">Back to Login</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={toggleMode}>
        <Text className="text-blue-500 text-center">
          {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthForm;
