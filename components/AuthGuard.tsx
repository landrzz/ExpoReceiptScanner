import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useAuth } from '../lib/auth-context';
import AuthScreen from '../app/auth';

type AuthGuardProps = {
  children: React.ReactNode;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [bypassAuth, setBypassAuth] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // For web environment, add a timeout to prevent getting stuck on loading
  useEffect(() => {
    if (isLoading && Platform.OS === 'web') {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout for loading
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // If still loading auth state, show a loading screen with a bypass option for web
  if (isLoading && !loadingTimeout) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-gray-600 text-lg">Loading...</Text>
        
        {/* Add a bypass button specifically for web testing */}
        {Platform.OS === 'web' && (
          <TouchableOpacity 
            className="mt-4 bg-blue-500 px-4 py-2 rounded-md"
            onPress={() => setBypassAuth(true)}
          >
            <Text className="text-white font-medium">Test in Browser</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // If loading timed out on web or user bypassed auth explicitly
  if ((loadingTimeout && Platform.OS === 'web') || bypassAuth) {
    return (
      <View className="flex-1">
        {children}
        
        {/* Show a "Demo Mode" indicator */}
        <View className="absolute top-0 left-0 right-0 bg-red-500 py-1 items-center">
          <Text className="text-white text-xs font-bold">DEMO MODE (BROWSER)</Text>
        </View>
      </View>
    );
  }

  // If user is not authenticated and not bypassing auth, show the auth screen
  if (!user && !bypassAuth) {
    return (
      <View className="flex-1">
        <AuthScreen onPreviewPress={() => setBypassAuth(true)} />
        
        {/* Bypass auth button - positioned at bottom right */}
        {/* <TouchableOpacity 
          className="absolute bottom-4 right-4 bg-black/30 px-3 py-2 rounded-md z-10"
          onPress={() => setBypassAuth(true)}
        >
          <Text className="text-white text-xs font-medium">Preview UI</Text>
        </TouchableOpacity> */}
      </View>
    );
  }

  // If user is authenticated or bypassing auth, render children
  return (
    <View className="flex-1">
      {children}
      
      {/* Show a "Demo Mode" indicator when bypassing auth */}
      {!user && bypassAuth && (
        <View className="absolute top-0 left-0 right-0 bg-red-500 py-1 items-center">
          <Text className="text-white text-xs font-bold">DEMO MODE</Text>
        </View>
      )}
    </View>
  );
};

export default AuthGuard;
