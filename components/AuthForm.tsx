import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert, InputAccessoryView } from 'react-native';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../lib/auth-service';
import { AuthError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { GoogleSignIn } from './auth/GoogleSignIn';

type AuthMode = 'login' | 'register' | 'forgotPassword';

type FeedbackMessage = {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  actions?: Array<{
    text: string;
    onPress: () => void;
  }>;
};

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const router = useRouter();

  // Auto-dismiss feedback after 10 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const showFeedback = (feedback: FeedbackMessage) => {
    if (Platform.OS === 'web') {
      // For web, display in-page feedback
      setFeedbackMessage(feedback);
    } else {
      // For native platforms, use Alert component
      Alert.alert(
        feedback.title,
        feedback.message,
        feedback.actions 
          ? feedback.actions.map(action => ({ 
              text: action.text, 
              onPress: action.onPress 
            }))
          : [{ text: 'OK' }]
      );
    }
  };

  const handleAuth = async () => {
    if (!email.trim()) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Please enter an email address'
      });
      return;
    }

    if (mode === 'forgotPassword') {
      handleResetPassword();
      return;
    }

    if (!password.trim()) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Please enter a password'
      });
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Passwords do not match'
      });
      return;
    }

    // Clear any previous error messages
    setEmailError(null);
    setFeedbackMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Attempt to sign in
        console.log('Starting login process for:', email);
        const result = await signInWithEmail(email, password);
        console.log('Login attempt result:', result);
        
        // Always handle the result, regardless of success/failure
        if (result.isEmailConfirmationRequired) {
          showFeedback({
            type: 'info',
            title: 'Email Not Confirmed',
            message: 'Please check your email inbox and confirm your email address before signing in.',
            actions: [
              { 
                text: 'Resend Confirmation', 
                onPress: () => handleResendConfirmation() 
              }
            ]
          });
        } else if (!result.success) {
          // Always show an error message for failed login attempts
          const errorMessage = result.error 
            ? (result.error as AuthError).message 
            : 'Invalid email or password. Please try again.';
          
          showFeedback({
            type: 'error',
            title: 'Login Failed',
            message: errorMessage
          });
        } else {
          console.log('Login successful, redirecting...');
          // showFeedback({
          //   type: 'success',
          //   title: 'Login Successful',
          //   message: 'You are now signed in.'
          // });
          // Delay redirect slightly to show success message
          setTimeout(() => {
            router.push('/');
          }, 1000);
        }
      } else {
        console.log('Starting registration process for:', email);
        const { success, error, isEmailConfirmationRequired } = await signUpWithEmail(email, password);
        
        if (!success && error) {
          const authError = error as AuthError;
          console.error('Registration failed with error:', authError);
          
          // Handle specific error cases
          if (authError.message.includes('already exists') || 
              authError.message.includes('already registered') ||
              authError.message.toLowerCase().includes('email')) {
            setEmailError('Email already exists. Please try a different email address or sign in.');
          } else {
            showFeedback({
              type: 'error',
              title: 'Registration Failed',
              message: authError.message
            });
          }
        } else if (success) {
          if (isEmailConfirmationRequired) {
            showFeedback({
              type: 'success',
              title: 'Email Confirmation Required',
              message: 'Registration successful! Please check your email to confirm your account before signing in.'
            });
          } else {
            showFeedback({
              type: 'success',
              title: 'Registration Successful',
              message: 'Your account has been created successfully.'
            });
          }
          setMode('login');
        }
      }
    } catch (error: any) {
      console.error('Uncaught error in auth process:', error);
      showFeedback({
        type: 'error',
        title: 'Error',
        message: error.message || 'An unexpected error occurred'
      });
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
        showFeedback({
          type: 'success',
          title: 'Confirmation Email Sent',
          message: 'We have sent a new confirmation email to your address. Please check your inbox.'
        });
      } else if (error) {
        const authError = error as AuthError;
        showFeedback({
          type: 'error',
          title: 'Error',
          message: authError.message
        });
      }
    } catch (error: any) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Please enter an email address'
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to send password reset email to:', email);
      const { success, error } = await resetPassword(email);
      
      if (!success && error) {
        const authError = error as AuthError;
        console.error('Password reset failed:', authError.message);
        showFeedback({
          type: 'error',
          title: 'Reset Failed',
          message: authError.message
        });
      } else if (success) {
        console.log('Password reset email sent successfully');
        showFeedback({
          type: 'success',
          title: 'Password Reset Email Sent',
          message: 'If an account exists with this email, you will receive instructions to reset your password. Please check your inbox and spam folder.'
        });
        setMode('login');
      }
    } catch (error: any) {
      console.error('Error in handleResetPassword:', error);
      showFeedback({
        type: 'error',
        title: 'Error',
        message: error.message || 'An error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
    setEmailError(null);
    setFeedbackMessage(null);
  };

  const goToForgotPassword = () => {
    setMode('forgotPassword');
    setPassword('');
    setConfirmPassword('');
    setEmailError(null);
    setFeedbackMessage(null);
  };

  const goToLogin = () => {
    setMode('login');
    setPassword('');
    setConfirmPassword('');
    setEmailError(null);
    setFeedbackMessage(null);
  };

  return (
    <View className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      {feedbackMessage && (
        <View 
          className={`p-4 mb-4 rounded-md ${
            feedbackMessage.type === 'error' ? 'bg-red-100 border border-red-400' : 
            feedbackMessage.type === 'success' ? 'bg-green-100 border border-green-400' : 
            'bg-blue-100 border border-blue-400'
          }`}
        >
          <Text className={`font-bold ${
            feedbackMessage.type === 'error' ? 'text-red-800' : 
            feedbackMessage.type === 'success' ? 'text-green-800' : 
            'text-blue-800'
          }`}>
            {feedbackMessage.title}
          </Text>
          <Text className={`${
            feedbackMessage.type === 'error' ? 'text-red-700' : 
            feedbackMessage.type === 'success' ? 'text-green-700' : 
            'text-blue-700'
          } mt-1`}>
            {feedbackMessage.message}
          </Text>
          {feedbackMessage.actions && (
            <View className="flex-row mt-2">
              {feedbackMessage.actions.map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  className={`mr-2 mt-2 py-1 px-3 rounded-md ${
                    feedbackMessage.type === 'error' ? 'bg-red-500' : 
                    feedbackMessage.type === 'success' ? 'bg-green-500' : 
                    'bg-blue-500'
                  }`}
                  onPress={action.onPress}
                >
                  <Text className="text-white font-medium">{action.text}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                className="mt-2 py-1 px-3 rounded-md bg-gray-300"
                onPress={() => setFeedbackMessage(null)}
              >
                <Text className="text-gray-800 font-medium">Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
        <TextInput
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(null); // Clear email error when email changes
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError && (
          <Text className="text-red-500 text-sm mt-1">{emailError}</Text>
        )}
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

      {/* Social Authentication Divider */}
      {mode !== 'forgotPassword' && (
        <>
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google Sign-In Button */}
          <GoogleSignIn />
        </>
      )}
      
      {/* Empty InputAccessoryView for iOS */}
      {Platform.OS === 'ios' && <InputAccessoryView nativeID="emptyAccessoryView" />}
    </View>
  );
};

export default AuthForm;
