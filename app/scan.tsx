import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";

export default function ScanScreen() {
  const router = useRouter();
  const [isCameraReady, setIsCameraReady] = useState(false);

  // In a real implementation, this would use expo-camera
  // For this demo, we'll simulate taking a photo
  const handleTakePhoto = () => {
    // Simulate capturing a photo
    const mockImageUri =
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80";

    // Navigate to receipt details with the image URI
    router.push({
      pathname: "/receipt-details",
      params: { imageUri: mockImageUri },
    });
  };

  return (
    <View className="flex-1 bg-black justify-between">
      {/* This would be a real camera view in a complete implementation */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-lg mb-4">
          Camera Preview (Simulated)
        </Text>
        <Text className="text-gray-400 text-center px-8">
          Position the receipt in the frame and take a photo
        </Text>
      </View>

      {/* Camera Controls */}
      <View className="pb-10 items-center">
        <TouchableOpacity
          onPress={handleTakePhoto}
          className="bg-white rounded-full w-20 h-20 items-center justify-center"
        >
          <Camera size={32} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
