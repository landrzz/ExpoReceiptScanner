import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth-context';
import AuthScreen from '../app/auth';

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [bypassAuth, setBypassAuth] = useState(false);
  const [showWebBypassButton, setShowWebBypassButton] = useState(false);
  const isWeb = Platform.OS === 'web';

  // For web platform, show the bypass button after a short delay
  useEffect(() => {
    if (isWeb && isLoading) {
      const timer = setTimeout(() => {
        setShowWebBypassButton(true);
      }, 1500); // Show button after 1.5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isWeb, isLoading]);

  // If still loading auth state, show a loading screen
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-gray-600 text-lg mt-4">Loading Authentication...</Text>
        
        {/* Show bypass button on web after delay */}
        {isWeb && showWebBypassButton && (
          <View className="mt-8 items-center">
            <Text className="text-gray-500 mb-2">
              Having trouble loading? Try the options below:
            </Text>
            <TouchableOpacity 
              className="mt-2 bg-blue-500 px-6 py-3 rounded-md"
              onPress={() => setBypassAuth(true)}
            >
              <Text className="text-white font-medium">Continue in Demo Mode</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="mt-4 bg-gray-200 px-6 py-3 rounded-md"
              onPress={() => window.location.reload()}
            >
              <Text className="text-gray-700 font-medium">Reload Page</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // If user bypassed auth explicitly
  if (bypassAuth) {
    return (
      <View className="flex-1">
        {children}
        
        {/* Show a "Demo Mode" indicator */}
        <View className="absolute top-0 left-0 right-0 bg-red-500 py-1 items-center">
          <Text className="text-white text-xs font-bold">DEMO MODE {isWeb ? '(BROWSER)' : ''}</Text>
        </View>
      </View>
    );
  }

  // If user is not authenticated and not bypassing auth, show the auth screen
  if (!user) {
    return (
      <View className="flex-1">
        <AuthScreen onPreviewPress={() => setBypassAuth(true)} />
      </View>
    );
  }

  // If user is authenticated, render children
  return (
    <View className="flex-1">
      {children}
    </View>
  );
};

export default AuthGuard;
