import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import ProfileModal from './ProfileModal';

const AuthButton = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isModalVisible, setModalVisible] = useState(false);

  const handlePress = async () => {
    if (user) {
      // Open profile modal instead of signing out directly
      setModalVisible(true);
    } else {
      router.push('/auth');
    }
  };

  if (isLoading) {
    return (
      <TouchableOpacity 
        disabled={true}
        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
      >
        <ActivityIndicator size="small" color="#4285F4" />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        className={`rounded-full items-center justify-center ${user ? 'bg-indigo-100 w-10 h-10' : 'bg-blue-100 px-3 py-2'}`}
      >
        {user ? (
          <User size={20} color="#4F46E5" />
        ) : (
          <Text className="text-sm font-medium text-blue-700">Sign In</Text>
        )}
      </TouchableOpacity>

      <ProfileModal 
        visible={isModalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </>
  );
};

export default AuthButton;
