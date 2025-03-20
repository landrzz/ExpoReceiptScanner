import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Camera, FileText, BarChart } from "lucide-react-native";
import { useRouter } from "expo-router";

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color: string;
}

const ActionButton = ({
  icon,
  label,
  onPress,
  color = "bg-blue-500",
}: ActionButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${color} p-4 rounded-xl items-center justify-center w-28 h-28 shadow-md`}
      activeOpacity={0.7}
    >
      <View className="items-center">
        {icon}
        <Text className="text-white font-semibold mt-2 text-center">
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const ActionButtons = () => {
  const router = useRouter();

  const handleScanReceipt = () => {
    // Navigate to camera screen
    console.log("Navigate to scan receipt");
    router.push("/scan");
  };

  const handleViewHistory = () => {
    // Navigate to history screen
    console.log("Navigate to view history");
    router.push("/history");
  };

  const handleGenerateReports = () => {
    // Navigate to reports screen
    console.log("Navigate to generate reports");
    router.push("/reports");
  };

  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-lg font-bold mb-4 text-gray-800">
        Quick Actions
      </Text>
      <View className="flex-row justify-between">
        <ActionButton
          icon={<Camera size={28} color="white" />}
          label="Scan Receipt"
          onPress={handleScanReceipt}
          color="bg-blue-500"
        />
        <ActionButton
          icon={<FileText size={28} color="white" />}
          label="View History"
          onPress={handleViewHistory}
          color="bg-purple-500"
        />
        <ActionButton
          icon={<BarChart size={28} color="white" />}
          label="Generate Reports"
          onPress={handleGenerateReports}
          color="bg-green-500"
        />
      </View>
    </View>
  );
};

export default ActionButtons;
