import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'expo-router';
import { signOut } from '../lib/auth-service';

const AuthButton = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handlePress = async () => {
    if (user) {
      try {
        setIsSigningOut(true);
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        setIsSigningOut(false);
      }
    } else {
      router.push('/auth');
    }
  };

  if (isLoading || isSigningOut) {
    return (
      <TouchableOpacity 
        disabled={true}
        className="px-3 py-2 bg-gray-100 rounded-md"
      >
        <ActivityIndicator size="small" color="#4285F4" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`px-3 py-2 rounded-md ${user ? 'bg-red-100' : 'bg-blue-100'}`}
    >
      <Text className={`text-sm font-medium ${user ? 'text-red-700' : 'text-blue-700'}`}>
        {user ? 'Sign Out' : 'Sign In'}
      </Text>
    </TouchableOpacity>
  );
};

export default AuthButton;
