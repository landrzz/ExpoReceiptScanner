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
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import { saveReceipt } from "../lib/receipt-service";
import * as Location from 'expo-location';

const categories = ["GAS", "FOOD", "TRAVEL", "OTHER"];

export default function ReceiptDetailsScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

  const handleLocationRequest = async () => {
    setIsLoadingLocation(true);
    console.log("Location request initiated");
    
    try {
      // Request permission to access location
      console.log("Requesting location permission...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      
      if (status !== 'granted') {
        console.log("Permission denied");
        Alert.alert(
          "Permission Denied",
          "Permission to access location was denied. Please enable location services in your device settings to use this feature.",
          [{ text: "OK" }]
        );
        return;
      }
      
      // Get current location
      console.log("Getting current position...");
      
      // Different options for web vs native
      const locationOptions = Platform.OS === 'web' 
        ? { 
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 1000,
          }
        : {
            accuracy: Location.Accuracy.Balanced
          };
          
      const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
      console.log("Location received:", currentLocation);
      
      // Get address from coordinates
      console.log("Reverse geocoding...");
      const [addressInfo] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });
      
      console.log("Address info:", addressInfo);
      
      // Format address
      let formattedAddress = '';
      if (addressInfo) {
        const addressParts = [
          addressInfo.name,
          addressInfo.street,
          addressInfo.city,
          addressInfo.region,
          addressInfo.postalCode,
          addressInfo.country
        ].filter(Boolean);
        
        formattedAddress = addressParts.join(', ');
      }
      
      // Set the location
      const locationText = formattedAddress || `${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}`;
      console.log("Setting location to:", locationText);
      setLocation(locationText);
      
    } catch (error) {
      console.error("Error getting location:", error);
      
      // More specific error handling for web
      if (Platform.OS === 'web') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('timeout')) {
          Alert.alert(
            "Location Timeout", 
            "The request to get your location timed out. Please try again or check your browser settings."
          );
        } else if (errorMessage.includes('permission')) {
          Alert.alert(
            "Permission Issue", 
            "Your browser is blocking location access. Please check your browser settings and ensure location access is allowed for this site."
          );
        } else {
          Alert.alert(
            "Location Error", 
            "Failed to get your location in the browser. Please try again or enter location manually."
          );
        }
      } else {
        Alert.alert(
          "Location Error", 
          "Failed to get your current location. Please try again or enter location manually."
        );
      }
    } finally {
      setIsLoadingLocation(false);
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
                source={{ uri: imageUri as string }}
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
              <TouchableOpacity 
                onPress={handleLocationRequest}
                disabled={isLoadingLocation}
                className={`p-3 ${isLoadingLocation ? 'bg-gray-100' : ''}`}
                accessibilityLabel="Get current location"
                accessibilityHint="Requests permission to use your current location"
              >
                <MapPin size={20} color={isLoadingLocation ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
              <TextInput
                className="flex-1 p-3 text-gray-800"
                placeholder={isLoadingLocation ? "Getting location..." : "Add location"}
                value={location}
                onChangeText={setLocation}
                editable={!isLoadingLocation}
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
