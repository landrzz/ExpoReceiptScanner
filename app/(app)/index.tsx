import React from "react";
import { View, Text, ScrollView, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";

import Header from "../../components/Header";
import ActionButtons from "../../components/ActionButtons";
import RecentReceipts from "../../components/RecentReceipts";
import MonthSummary from "../../components/MonthSummary";

export default function HomeScreen() {
  const router = useRouter();

  const handleSettingsPress = () => {
    console.log("Navigate to settings");
    // router.push('/settings');
  };

  const handleReceiptPress = (receipt) => {
    console.log("Receipt pressed:", receipt);
    // router.push({
    //   pathname: '/receipt/[id]',
    //   params: { id: receipt.id }
    // });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      <Header
        title="Receipt Scanner"
        onSettingsPress={handleSettingsPress}
        showTitle={true}
        showSettings={false}
      />

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-800 mb-1">
            Welcome back
          </Text>
          <Text className="text-gray-500">
            Manage your receipts and expenses
          </Text>
        </View>

        <View className="mb-6">
          <ActionButtons />
        </View>

        <View className="mb-6">
          <MonthSummary />
        </View>

        <View className="mb-6">
          <RecentReceipts onReceiptPress={handleReceiptPress} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
