import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { signOut } from '../lib/auth-service';
import { useRouter } from 'expo-router';

const UserProfile = () => {
  const { user, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <View className="p-4 bg-white rounded-lg shadow-md">
        <ActivityIndicator size="small" color="#4285F4" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <View className="p-4 bg-white rounded-lg shadow-md">
      <Text className="text-lg font-bold text-gray-800 mb-2">User Profile</Text>
      <Text className="text-gray-600 mb-4">{user.email}</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        disabled={isSigningOut}
        className="bg-red-500 py-2 px-4 rounded-md"
      >
        {isSigningOut ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-center">Sign Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UserProfile;
