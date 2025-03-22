import React from 'react';
import { View, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AuthForm from '../components/AuthForm';

export default function AuthScreen() {
  const router = useRouter();

  const handleSettingsPress = () => {
    console.log("Navigate to settings");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <Header
        title="Account"
        onSettingsPress={handleSettingsPress}
        showTitle={true}
        showSettings={false}
      />

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingVertical: 20 }}
      >
        <AuthForm />
      </ScrollView>
    </SafeAreaView>
  );
}
