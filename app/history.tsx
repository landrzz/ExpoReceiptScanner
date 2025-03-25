import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Filter,
  ChevronDown,
} from "lucide-react-native";
import { getReceipts, getReceiptsByMonth } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";
import ImageViewerModal from "../components/ImageViewerModal";
import MonthYearPicker from "../components/MonthYearPicker";
import { getStorageUrl } from "../lib/storage-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Fallback mock data for when API fails
const mockReceipts: Receipt[] = [
  {
    id: "1",
    date: "2023-10-15",
    category: "FOOD" as "FOOD",
    amount: 24.99,
    vendor: "Burger King",
    notes: "Lunch with team",
    image_path:
      "https://images.unsplash.com/photo-1572441420532-e7f6e24e1848?w=400&q=80",
    time: "12:30",
    location: "New York, NY",
    created_at: "2023-10-15T12:30:00Z",
    updated_at: "2023-10-15T12:30:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "2",
    date: "2023-10-12",
    category: "GAS" as "GAS",
    amount: 45.5,
    vendor: "Shell",
    notes: "Full tank",
    image_path:
      "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80",
    time: "10:15",
    location: "Boston, MA",
    created_at: "2023-10-12T10:15:00Z",
    updated_at: "2023-10-12T10:15:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "3",
    date: "2023-10-10",
    category: "TRAVEL" as "TRAVEL",
    amount: 125.0,
    vendor: "Uber",
    notes: "Airport trip",
    image_path:
      "https://images.unsplash.com/photo-1595953832255-a2ba391cdc78?w=400&q=80",
    time: "08:45",
    location: "Chicago, IL",
    created_at: "2023-10-10T08:45:00Z",
    updated_at: "2023-10-10T08:45:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "4",
    date: "2023-10-05",
    category: "OTHER" as "OTHER",
    amount: 75.25,
    vendor: "Office Depot",
    notes: "Supplies",
    image_path:
      "https://images.unsplash.com/photo-1567360425618-824ae1b704d3?w=400&q=80",
    time: "14:20",
    location: "San Francisco, CA",
    created_at: "2023-10-05T14:20:00Z",
    updated_at: "2023-10-05T14:20:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "5",
    date: "2023-10-01",
    category: "FOOD" as "FOOD",
    amount: 32.5,
    vendor: "Chipotle",
    notes: "Dinner",
    image_path:
      "https://images.unsplash.com/photo-1593538312308-d4c29d8dc7f1?w=400&q=80",
    time: "19:30",
    location: "Los Angeles, CA",
    created_at: "2023-10-01T19:30:00Z",
    updated_at: "2023-10-01T19:30:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "6",
    date: "2023-09-28",
    category: "GAS" as "GAS",
    amount: 42.75,
    vendor: "Exxon",
    notes: "",
    image_path:
      "https://images.unsplash.com/photo-1605849285614-e5884d961a49?w=400&q=80",
    time: "16:45",
    location: "Seattle, WA",
    created_at: "2023-09-28T16:45:00Z",
    updated_at: "2023-09-28T16:45:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "7",
    date: "2023-09-25",
    category: "TRAVEL" as "TRAVEL",
    amount: 350.0,
    vendor: "Delta",
    notes: "Baggage fee",
    image_path:
      "https://images.unsplash.com/photo-1647427060118-4911c9821b82?w=400&q=80",
    time: "11:10",
    location: "Denver, CO",
    created_at: "2023-09-25T11:10:00Z",
    updated_at: "2023-09-25T11:10:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
  {
    id: "8",
    date: "2023-09-20",
    category: "FOOD" as "FOOD",
    amount: 18.99,
    vendor: "Subway",
    notes: "Lunch",
    image_path:
      "https://images.unsplash.com/photo-1567360425618-824ae1b704d3?w=400&q=80",
    time: "13:25",
    location: "Miami, FL",
    created_at: "2023-09-20T13:25:00Z",
    updated_at: "2023-09-20T13:25:00Z",
    user_id: "00000000-0000-0000-0000-000000000000",
  },
];

// Category color mapping
const categoryColors = {
  FOOD: "bg-orange-500",
  GAS: "bg-blue-500",
  TRAVEL: "bg-purple-500",
  OTHER: "bg-gray-500",
};

const HistoryScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Format the selected date as a string
  const getFormattedDate = () => {
    return `${monthNames[selectedDate.month - 1]} ${selectedDate.year}`;
  };

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);

        // Fetch receipts for the selected month and year
        const { data, error } = await getReceiptsByMonth(
          selectedDate.month,
          selectedDate.year
        );
        
        if (error) {
          console.error("Month receipts error:", error);
          throw error;
        }
        console.log("Month receipts data:", data);
        setReceipts(data || []);
      } catch (err) {
        console.error("Error fetching receipts:", err);
        setError(err as Error);
        // Show empty list on error instead of mock data
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [selectedDate]);

  const handleDateSelection = (year: number, month: number) => {
    setSelectedDate({ year, month });
  };

  const toggleReceiptSelection = (id: string) => {
    if (selectedReceipts.includes(id)) {
      setSelectedReceipts(
        selectedReceipts.filter((receiptId) => receiptId !== id),
      );
    } else {
      setSelectedReceipts([...selectedReceipts, id]);
    }
  };

  const handleBatchAction = (action: "pdf" | "submit") => {
    if (selectedReceipts.length === 0) return;

    console.log(`Performing ${action} action on receipts:`, selectedReceipts);
    // In a real app, this would trigger the appropriate action

    // Reset selection after action
    setSelectedReceipts([]);
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => {
    const isSelected = selectedReceipts.includes(item.id);

    const handleImagePress = () => {
      if (item.image_path) {
        try {
          // Get the full image URL from storage
          const imageUrl = item.image_path.startsWith('http') ? item.image_path : getStorageUrl(item.image_path);
          
          // Log the image URL being sent to the modal
          console.log("Opening image in modal:", imageUrl);
          
          // Set the image URL directly
          setSelectedImage(imageUrl);
          setImageViewerVisible(true);
        } catch (error) {
          console.error("Error preparing image for modal:", error);
        }
      } else {
        console.log("No image path available for this receipt");
      }
    };
    
    // Handle image URI for different platforms
    const getImageSource = (uri: string | null) => {
      if (!uri) return null;
      
      // Get the storage URL if it's a path
      const imageUrl = uri.startsWith('http') ? uri : getStorageUrl(uri);
      
      // Log the image URI for debugging
      console.log("History Image URI:", imageUrl);
      
      // Return the image source without platform-specific formatting
      return { uri: imageUrl };
    };

    return (
      <TouchableOpacity
        onPress={() => toggleReceiptSelection(item.id)}
        onLongPress={() => router.push("/receipt-details")}
        className={`p-4 border-b border-gray-200 ${isSelected ? "bg-blue-50" : ""}`}
      >
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handleImagePress}
            className="w-16 h-16 bg-gray-200 rounded-md mr-3 overflow-hidden"
            activeOpacity={item.image_path ? 0.7 : 1}
          >
            {item.image_path ? (
              <View className="w-full h-full relative">
                <Image
                  source={getImageSource(item.image_path) || { uri: '' }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onLoadStart={() => {
                    setLoadingImages(prev => ({ ...prev, [item.id]: true }));
                  }}
                  onLoadEnd={() => {
                    setLoadingImages(prev => ({ ...prev, [item.id]: false }));
                  }}
                  onError={() => {
                    console.log("History image loading error for:", item.image_path);
                    setLoadingImages(prev => ({ ...prev, [item.id]: false }));
                  }}
                />
                {loadingImages[item.id] && (
                  <View className="absolute inset-0 flex items-center justify-center bg-gray-200/70">
                    <ActivityIndicator size="small" color="#3b82f6" />
                  </View>
                )}
              </View>
            ) : (
              <View
                className={`w-full h-full ${categoryColors[item.category as keyof typeof categoryColors]} opacity-30`}
              >
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-xs font-bold text-gray-700">
                    {item.category}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row items-center">
              <View
                className={`w-3 h-3 rounded-full ${categoryColors[item.category as keyof typeof categoryColors]} mr-2`}
              />
              <Text 
                className="text-xs font-medium px-2 py-0.5 rounded-full mr-2"
                style={{ 
                  backgroundColor: `${item.category === 'FOOD' ? '#FFF7ED' : 
                                    item.category === 'GAS' ? '#EFF6FF' : 
                                    item.category === 'TRAVEL' ? '#F5F3FF' : 
                                    '#F3F4F6'}`,
                  color: `${item.category === 'FOOD' ? '#F97316' : 
                          item.category === 'GAS' ? '#3B82F6' : 
                          item.category === 'TRAVEL' ? '#A855F7' : 
                          '#6B7280'}`
                }}
              >
                {item.category}
              </Text>
              <Text className="font-semibold text-gray-800">{item.vendor}</Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1">
              {item.notes || "No notes"}
            </Text>
          </View>

          <View className="items-end">
            <Text className="font-bold">${item.amount.toFixed(2)}</Text>
            <Text className="text-xs text-gray-500">
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal
          isVisible={imageViewerVisible}
          imageUrl={selectedImage}
          onClose={() => {
            setImageViewerVisible(false);
            setSelectedImage(null);
          }}
        />
      )}

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
          onPress={() => router.replace('/')}
          className="p-3" // Increased touch target
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Additional hit area
          style={{ marginLeft: 4 }}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Receipt History</Text>
        <TouchableOpacity 
          className="p-3" // Increased touch target
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Additional hit area
        >
          <Filter size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Month and Year Selector */}
      <View className="p-4 bg-gray-50">
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="flex-row items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
        >
          <View className="flex-row items-center">
            <Calendar size={20} color="#4B5563" />
            <Text className="ml-2 font-medium">{getFormattedDate()}</Text>
          </View>
          <ChevronDown size={20} color="#4B5563" />
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 p-4">
            <MonthYearPicker
              onSelectDate={handleDateSelection}
              initialYear={selectedDate.year}
              initialMonth={selectedDate.month}
              onClose={() => setShowDatePicker(false)}
            />
          </View>
        </Modal>
      </View>

      {/* Batch Action Bar - Only show when items are selected */}
      {selectedReceipts.length > 0 && (
        <View className="flex-row justify-between items-center p-3 bg-blue-500">
          <Text className="text-white font-medium">
            {selectedReceipts.length} receipts selected
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => handleBatchAction("pdf")}
              className="bg-white py-1 px-3 rounded-lg mr-2"
            >
              <Text className="text-blue-500 font-medium">Generate PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleBatchAction("submit")}
              className="bg-white py-1 px-3 rounded-lg"
            >
              <Text className="text-blue-500 font-medium">Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Receipt List */}
      {loading ? (
        <View className="flex-1 items-center justify-center p-10">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-4">Loading receipts...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-red-500 text-center">
            Failed to load receipts
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
            onPress={() => router.push("/")}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : receipts.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Text className="text-gray-500 text-center">
            No receipts found for this period
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
            onPress={() => router.push("/scan")}
          >
            <Text className="text-white font-medium">Scan a Receipt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

export default HistoryScreen;
