import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { Settings } from "lucide-react-native";
import AuthButton from "./AuthButton";

interface HeaderProps {
  title?: string;
  onSettingsPress?: () => void;
  showTitle?: boolean;
  showSettings?: boolean;
  showAuthButton?: boolean;
}

const Header = ({
  title = "Receipt Scanner Pro",
  onSettingsPress = () => console.log("Settings pressed"),
  showTitle = true,
  showSettings = true,
  showAuthButton = true,
}: HeaderProps) => {
  return (
    <View className="bg-white w-full h-16 px-4 flex-row items-center justify-between">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      {showTitle ? (
        <Text className="text-xl font-bold text-gray-800">{title}</Text>
      ) : (
        <View />
      )}
      <View className="flex-row items-center">
        {showAuthButton && (
          <View className="mr-3">
            <AuthButton />
          </View>
        )}
        {showSettings && (
          <TouchableOpacity
            onPress={onSettingsPress}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Settings size={20} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Header;
