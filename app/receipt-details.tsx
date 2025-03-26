import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar
} from "react-native";
import { useLocalSearchParams, useRouter, router as expoRouter } from "expo-router";
import { MapPin, ScanLine, ArrowLeft } from "lucide-react-native";
import { saveReceipt, updateReceipt } from "../lib/receipt-service";
import { extractReceiptInfo } from "../lib/openai-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { getStorageUrl } from "../lib/storage-service";
import { getUserProfile } from "../lib/profile-service";
import { supabase } from "../lib/supabase";

const categories = ["GAS", "FOOD", "TRAVEL", "OTHER"] as const;
type CategoryType = typeof categories[number];

// Category color mapping
const categoryColors: Record<CategoryType, string> = {
  FOOD: "bg-green-500",
  GAS: "bg-blue-500",
  TRAVEL: "bg-purple-500",
  OTHER: "bg-gray-500",
};

export default function ReceiptDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Extract and convert params
  const imageUri = params.imageUri as string;
  const receiptId = params.id as string;
  const isEditing = params.isEditing === 'true';
  
  // Form state
  const [formState, setFormState] = useState({
    category: 'OTHER' as CategoryType, // Set a default category
    notes: '',
    location: '',
    amount: '0',
    vendor: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  // Handle direct edits to form fields
  const updateFormField = (field: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle category selection specifically
  const updateCategory = (category: CategoryType) => {
    setFormState(prev => ({
      ...prev,
      category
    }));
  };

  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current user session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData.session?.user) {
          const userId = sessionData.session.user.id;
          const user = await getUserProfile(userId);
          
          console.log('User metadata:', JSON.stringify(user.user_metadata));
          
          // Check if user has metadata with first_name
          let firstName = null;
          
          if (user.user_metadata?.data?.first_name) {
            // This is the structure used by ProfileModal
            firstName = user.user_metadata.data.first_name;
            console.log('User first name loaded from data:', firstName);
          } else if (user.user_metadata?.first_name) {
            firstName = user.user_metadata.first_name;
            console.log('User first name loaded directly:', firstName);
          } else {
            console.log('No first name found in user profile');
          }
          
          if (firstName) {
            setUserFirstName(firstName);
            
            // Pre-fill the notes field with the user's first name if we're not in editing mode
            // and the notes field is empty
            if (!isEditing && !formState.notes) {
              updateFormField('notes', firstName);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, []);

  // Initialize form for editing mode if applicable
  useEffect(() => {
    console.log("Initializing form. Is editing:", isEditing);
    console.log("Params:", params);
    
    if (isEditing) {
      try {
        setFormState({
          category: String(params.category || 'OTHER') as CategoryType, // Set default category if not provided
          notes: String(params.notes || ''),
          location: String(params.location || ''),
          amount: String(params.amount || '0'),
          vendor: String(params.vendor || '')
        });
        console.log("Form state initialized for editing.");
      } catch (error) {
        console.error("Error initializing form state:", error);
      }
    }
  }, [isEditing, params.category, params.notes, params.location, params.amount, params.vendor]);

  // Process the image URI when it changes
  useEffect(() => {
    const processImage = async () => {
      try {
        // For editing mode, prioritize looking up the image path in the database
        if (isEditing && receiptId) {
          console.log("Edit mode - checking database for image path");
          
          // Fetch the receipt from the database to get the image path
          const { data, error } = await supabase
            .from("receipts")
            .select("image_path")
            .eq("id", receiptId)
            .single();
          
          if (error) {
            console.error("Error fetching receipt image from DB:", error);
          } else if (data && data.image_path) {
            console.log("Found image path in database:", data.image_path);
            // Use the image path to generate a public URL
            const publicUrl = getStorageUrl(data.image_path);
            console.log("DB Image: Generated public URL:", publicUrl);
            setIsImageLoading(true);
            setProcessedImageUri(publicUrl);
            return; // Exit early since we found and set the image
          } else {
            console.log("No image path found in database for receipt:", receiptId);
          }
        }
        
        // Fall back to imageUri parameter if provided
        if (imageUri) {
          console.log("Processing imageUri parameter:", imageUri);
          setIsImageLoading(true);
          
          // Process the image URI
          let finalUri = imageUri;
          
          // Handle different image URI formats
          if (imageUri.startsWith('file://') || imageUri.startsWith('data:')) {
            // Local file or data URI, use as is
            finalUri = imageUri;
            console.log("Using local image URI:", finalUri);
          } else if (imageUri.startsWith('http')) {
            // Already a full URL, use as is
            finalUri = imageUri;
            console.log("Using existing URL:", finalUri);
          } else {
            // If URI is from Supabase storage (not a full URL yet)
            // Make sure we're using the public URL for Supabase storage paths
            finalUri = getStorageUrl(imageUri);
            console.log("Processed Image URI using getStorageUrl:", finalUri);
          }
          
          console.log("Final image URI to display:", finalUri);
          setProcessedImageUri(finalUri);
        } else {
          console.log("No image URI provided");
          setProcessedImageUri(null);
          setIsImageLoading(false);
        }
      } catch (error) {
        console.error("Error processing image URI:", error);
        setProcessedImageUri(null);
        setIsImageLoading(false);
      }
    };
    
    processImage();
  }, [imageUri, isEditing, receiptId]);

  // Set initial loading state
  useEffect(() => {
    if (imageUri) {
      console.log("Image URI:", imageUri);
      console.log("Display Image URI:", getDisplayImageUri(imageUri));
    }
  }, [imageUri]);

  const handleSubmit = async () => {
    try {
      // Validate category before submission
      if (!formState.category || !categories.includes(formState.category)) {
        Alert.alert(
          "Invalid Category",
          "Please select a valid category for this receipt."
        );
        return;
      }
      
      setIsSubmitting(true);
      
      const receiptData: Partial<any> = {
        category: formState.category,
        notes: formState.notes,
        location: formState.location,
        amount: parseFloat(formState.amount.replace(/,/g, "")),
        vendor: formState.vendor,
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      };
      
      let result;
      
      if (isEditing && receiptId) {
        // Update existing receipt
        result = await updateReceipt(
          receiptId,
          receiptData,
          imageUri // Pass the image URI for updating
        );
      } else {
        // Save new receipt
        result = await saveReceipt(receiptData, imageUri);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      console.log(`Receipt ${isEditing ? "updated" : "saved"} successfully:`, result.data);
      
      // Use a one-time notification to avoid constant re-renders
      // Don't update router params during normal component lifecycle
      const triggerKey = Date.now().toString();
      if (typeof window !== 'undefined') {
        // Store the update notification in sessionStorage instead of router params
        sessionStorage.setItem('receiptUpdated', triggerKey);
      }
      
      // Navigate back to home screen
      router.push("/");
    } catch (error) {
      console.error("Error saving receipt:", error);
      Alert.alert(
        "Error",
        `Failed to ${isEditing ? "update" : "save"} receipt. Please try again.`
      );
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
      updateFormField('location', locationText);
      
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

  const scanWithAI = async (uri: string) => {
    try {
      setIsScanning(true);
      const result = await extractReceiptInfo(uri);
      console.log("AI Extraction Result:", result);
      
      if (result.success && result.data) {
        // Update form with extracted data
        const extractedData = result.data;
        
        updateFormField('amount', extractedData.amount.toString());
        updateFormField('vendor', extractedData.vendor || '');
        
        // Pre-fill notes with user's first name if available
        if (userFirstName && !formState.notes) {
          updateFormField('notes', userFirstName);
        }
        
        Alert.alert(
          "Scan Complete", 
          "Successfully extracted information from your receipt."
        );
      } else {
        Alert.alert(
          "Scan Failed", 
          `Could not extract information from the receipt: ${result.error || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      Alert.alert(
        "Scanning Error",
        "Failed to extract details from the receipt image. Please enter details manually."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const getDisplayImageUri = (imageUri: string) => {
    if (!imageUri) return '';
    
    // This function is now mainly used for the AI scanning
    // For display, we use the processedImageUri state
    if (imageUri.startsWith('http') || imageUri.startsWith('file://') || imageUri.startsWith('data:')) {
      return imageUri;
    } else {
      return getStorageUrl(imageUri);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-gray-100">
          <StatusBar barStyle="dark-content" />
          
          {/* Header with safe area padding */}
          <View 
            className="bg-white border-b border-gray-200 flex-row justify-between items-center"
            style={{ 
              paddingTop: Math.max(insets.top, 16), 
              paddingBottom: 12,
              paddingHorizontal: 16
            }}
          >
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-3" 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
              style={{ marginLeft: 4 }}
            >
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-xl font-bold">{isEditing ? "Edit Receipt" : "Receipt Details"}</Text>
            <View style={{ width: 48 }} /> 
          </View>

          <ScrollView 
            className="flex-1 p-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 100 }} 
          >
            <View className="mb-6">
              {/* Image Preview */}
              <View className="bg-white rounded-lg overflow-hidden shadow-sm mb-3">
                {processedImageUri ? (
                  <View className="w-full h-64 relative">
                    <Image
                      source={{ uri: processedImageUri }}
                      className="w-full h-64"
                      resizeMode="contain"
                      onLoadStart={() => {
                        console.log("Image loading started for:", processedImageUri);
                        setIsImageLoading(true);
                      }}
                      onLoad={() => {
                        console.log("Image loaded successfully:", processedImageUri);
                        setIsImageLoading(false);
                      }}
                      onLoadEnd={() => {
                        console.log("Image loading ended");
                        setIsImageLoading(false);
                      }}
                      onError={(error) => {
                        console.error("Image loading error:", error.nativeEvent.error);
                        console.log("Failed URI:", processedImageUri);
                        setIsImageLoading(false);
                        
                        // Only show alert in development mode
                        if (__DEV__) {
                          Alert.alert(
                            "Image Loading Error",
                            `Failed to load image: ${processedImageUri}. Error: ${error.nativeEvent.error}`
                          );
                        }
                      }}
                    />
                    {isImageLoading && (
                      <View className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text className="text-gray-700 font-medium mt-2">Loading image...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="w-full h-64 bg-gray-200 items-center justify-center">
                    <Text className="text-gray-500">No image available</Text>
                  </View>
                )}
              </View>
              
              {/* AI Scan Button - Only show for new receipts with images */}
              {!isEditing && imageUri && (
                <TouchableOpacity
                  onPress={() => scanWithAI(processedImageUri || imageUri)}
                  disabled={isScanning}
                  className={`mb-6 py-3 rounded-lg items-center flex-row justify-center ${isScanning ? "bg-indigo-300" : "bg-indigo-600"}`}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text className="text-white font-medium">Scanning Receipt...</Text>
                    </>
                  ) : (
                    <>
                      <ScanLine size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text className="text-white font-medium">Scan Receipt with AI</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Category Selector */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap justify-between">
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => updateCategory(category)}
                      className={`py-3 px-4 rounded-lg mb-2 w-[48%] ${formState.category === category ? categoryColors[category] : "bg-white"}`}
                    >
                      <Text
                        className={`text-center font-medium ${formState.category === category ? "text-white" : "text-gray-700"}`}
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
                  Names / Notes
                </Text>
                <TextInput
                  className="bg-white p-4 rounded-lg text-gray-800"
                  placeholder="Add notes about this receipt"
                  value={formState.notes}
                  onChangeText={(text) => updateFormField('notes', text)}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Amount Input */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Amount
                </Text>
                <TextInput
                  className="bg-white p-4 rounded-lg text-gray-800"
                  placeholder="Enter amount"
                  value={formState.amount}
                  onChangeText={(text) => updateFormField('amount', text)}
                  keyboardType="numeric"
                />
              </View>
              
              {/* Vendor Input */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Vendor
                </Text>
                <TextInput
                  className="bg-white p-4 rounded-lg text-gray-800"
                  placeholder="Enter vendor name"
                  value={formState.vendor}
                  onChangeText={(text) => updateFormField('vendor', text)}
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
                    value={formState.location}
                    onChangeText={(text) => updateFormField('location', text)}
                    editable={!isLoadingLocation}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`py-4 rounded-lg items-center ${isSubmitting ? "bg-blue-300" : "bg-blue-500"}`}
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? "Saving..." : (isEditing ? "Update Receipt" : "Save Receipt")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
