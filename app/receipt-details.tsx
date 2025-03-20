import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import { saveReceipt } from "../lib/receipt-service";

const categories = ["GAS", "FOOD", "TRAVEL", "OTHER"];

export default function ReceiptDetailsScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await saveReceipt({
        imageUri: imageUri as string,
        category: selectedCategory,
        notes,
        location,
      });

      if (error) throw error;

      // Navigate back to home
      router.push("/");
    } catch (error) {
      console.error("Error saving receipt:", error);
      Alert.alert("Error", "Failed to save receipt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-4">
            Receipt Details
          </Text>

          {/* Image Preview */}
          <View className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-full h-64"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-64 bg-gray-200 items-center justify-center">
                <Text className="text-gray-500">No image available</Text>
              </View>
            )}
          </View>

          {/* Category Selector */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  className={`py-3 px-4 rounded-lg mb-2 w-[48%] ${selectedCategory === category ? "bg-blue-500" : "bg-white"}`}
                >
                  <Text
                    className={`text-center font-medium ${selectedCategory === category ? "text-white" : "text-gray-700"}`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Input */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Name / Notes
            </Text>
            <TextInput
              className="bg-white p-4 rounded-lg text-gray-800"
              placeholder="Add notes about this receipt"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Location Input */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Location
            </Text>
            <View className="flex-row items-center bg-white rounded-lg overflow-hidden">
              <View className="p-3">
                <MapPin size={20} color="#6b7280" />
              </View>
              <TextInput
                className="flex-1 p-3 text-gray-800"
                placeholder="Add location"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            className={`py-4 rounded-lg items-center ${isSubmitting ? "bg-blue-300" : "bg-blue-500"}`}
          >
            <Text className="text-white font-bold text-lg">
              {isSubmitting ? "Saving..." : "Save Receipt"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
