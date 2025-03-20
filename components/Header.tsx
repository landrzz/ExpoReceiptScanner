import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { Settings } from "lucide-react-native";

interface HeaderProps {
  title?: string;
  onSettingsPress?: () => void;
  showTitle?: boolean;
  showSettings?: boolean;
}

const Header = ({
  title = "Receipt Scanner",
  onSettingsPress = () => console.log("Settings pressed"),
  showTitle = true,
  showSettings = true,
}: HeaderProps) => {
  return (
    <View className="bg-white w-full h-16 px-4 flex-row items-center justify-between">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      {showTitle ? (
        <Text className="text-xl font-bold text-gray-800">{title}</Text>
      ) : (
        <View />
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
  );
};

export default Header;
