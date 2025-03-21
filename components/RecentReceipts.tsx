import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Calendar, Clock, DollarSign, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getReceipts } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";
import ReceiptDetailsModal from "./ReceiptDetailsModal";

type RecentReceiptsProps = {
  receipts?: Receipt[];
  onReceiptPress?: (receipt: Receipt) => void;
};

const getCategoryColor = (category: Receipt["category"]) => {
  switch (category) {
    case "GAS":
      return "bg-blue-500";
    case "FOOD":
      return "bg-green-500";
    case "TRAVEL":
      return "bg-purple-500";
    case "OTHER":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const RecentReceipts = ({
  receipts: propReceipts,
  onReceiptPress = () => {},
}: RecentReceiptsProps) => {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchReceipts = async () => {
    // Skip fetching if receipts are provided as props
    if (propReceipts) return;
    
    try {
      setLoading(true);
      const { data, error } = await getReceipts();
      if (error) throw error;
      setReceipts(data.slice(0, 3)); // Only show the 3 most recent
    } catch (err) {
      console.error("Error fetching receipts:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If receipts are provided as props, use those
    if (propReceipts) {
      setReceipts(propReceipts);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    fetchReceipts();
  }, [propReceipts]);

  const handleReceiptPress = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setModalVisible(true);
    onReceiptPress(receipt); // Still call the parent's onReceiptPress if provided
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleReceiptDelete = (receiptId: string) => {
    console.log("Receipt deleted, refreshing list:", receiptId);
    // Remove the deleted receipt from the local state immediately for a faster UI response
    setReceipts(prevReceipts => prevReceipts.filter(receipt => receipt.id !== receiptId));
    // Refresh the list from server to get the latest data
    fetchReceipts();
  };

  const handleReceiptEdit = (receipt: Receipt) => {
    console.log("Editing receipt:", receipt.id);
    router.push({
      pathname: "/receipt-details",
      params: {
        id: receipt.id,
        imageUri: receipt.image_url,
        category: receipt.category,
        notes: receipt.notes || '',
        location: receipt.location || '',
        amount: receipt.amount.toString(),
        vendor: receipt.vendor || '',
        isEditing: 'true'
      }
    });
    closeModal();
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => {
    // Handle image URI for different platforms
    const getImageSource = (uri: string | null) => {
      if (!uri) return null;
      
      // Log the image URI for debugging
      console.log("Image URI:", uri);
      
      // For iOS, ensure the URI is properly formatted
      if (Platform.OS === 'ios' && uri.startsWith('file://')) {
        // iOS needs special handling for local file URIs
        return { uri };
      } else if (Platform.OS === 'ios' && !uri.startsWith('http')) {
        // If it's a local path without the file:// prefix, add it
        return { uri: `file://${uri}` };
      }
      
      // For web and Android, use the URI as is
      return { uri };
    };
    
    return (
      <TouchableOpacity
        className="flex-row p-4 bg-white rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => handleReceiptPress(item)}
      >
        <View className="mr-3 h-12 w-12 rounded-full overflow-hidden justify-center items-center">
          {item.image_url ? (
            <Image 
              source={getImageSource(item.image_url) || { uri: '' }}
              className="h-full w-full"
              onError={() => {
                console.log("Image loading error for:", item.image_url);
              }}
            />
          ) : (
            <View
              className={`h-full w-full ${getCategoryColor(item.category)} justify-center items-center`}
            >
              <Text className="text-white font-bold">
                {item.category.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="font-bold text-base">{item.category}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  {item.location || "No location"}
                </Text>
              </View>
            </View>
            <Text className="font-bold text-base">${item.amount.toFixed(2)}</Text>
          </View>

          <View className="flex-row mt-2">
            <View className="flex-row items-center mr-3">
              <Calendar size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">{item.date}</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={14} color="#6b7280" />
              <Text className="text-gray-500 text-xs ml-1">{item.time}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold">Recent Receipts</Text>
        <TouchableOpacity onPress={() => router.push("/history")}>
          <Text className="text-blue-500">View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-8 items-center justify-center bg-white rounded-lg">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-2">Loading receipts...</Text>
        </View>
      ) : error ? (
        <View className="py-8 items-center justify-center bg-white rounded-lg">
          <Text className="text-gray-400">Failed to load receipts</Text>
        </View>
      ) : receipts.length > 0 ? (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      ) : (
        <View className="py-8 items-center justify-center bg-white rounded-lg">
          <DollarSign size={32} color="#d1d5db" />
          <Text className="text-gray-400 mt-2">No recent receipts</Text>
          <TouchableOpacity className="mt-3 bg-blue-500 px-4 py-2 rounded-full">
            <Text className="text-white font-medium">
              Scan Your First Receipt
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Receipt Details Modal */}
      <ReceiptDetailsModal 
        isVisible={modalVisible}
        receipt={selectedReceipt}
        onClose={closeModal}
        onDelete={handleReceiptDelete}
        onEdit={handleReceiptEdit}
      />
    </View>
  );
};

export default RecentReceipts;
