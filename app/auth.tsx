import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  InputAccessoryView
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../lib/auth-context';

type AuthScreenProps = {
  onPreviewPress?: () => void;
};

// Explicitly mark as default export
export default function AuthScreen({ onPreviewPress }: AuthScreenProps): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Handle preview UI button press
  const handlePreviewUI = () => {
    if (onPreviewPress) {
      onPreviewPress();
    } else {
      router.push('/');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <Header
        title="Receipt Scanner Pro"
        showTitle={true}
        showSettings={false}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          >
            <View className="flex-1 justify-center items-center px-4 py-6">
              <View className="w-full max-w-md">
                <View className="mb-8 items-center">
                  <Text className="text-3xl font-bold text-gray-800 mb-2">Welcome</Text>
                  <Text className="text-gray-500 text-center">
                    Sign in to manage your receipts and expenses!
                  </Text>
                </View>

                <AuthForm />

                {/* Preview UI button */}
                {/* <TouchableOpacity 
                  className="mt-8 bg-black/30 px-4 py-3 rounded-md self-center"
                  onPress={handlePreviewUI}
                >
                  <Text className="text-white text-sm font-medium">Preview UI Without Login</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        
        {/* Empty InputAccessoryView to prevent the default iOS keyboard accessory view */}
        {Platform.OS === 'ios' && <InputAccessoryView nativeID="emptyAccessoryView" />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
