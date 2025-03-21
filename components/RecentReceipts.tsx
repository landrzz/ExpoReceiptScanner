import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Calendar, Clock, DollarSign, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";
import { getReceipts } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";

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

  useEffect(() => {
    // If receipts are provided as props, use those
    if (propReceipts) {
      setReceipts(propReceipts);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API
    const fetchReceipts = async () => {
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

    fetchReceipts();
  }, [propReceipts]);

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      className="flex-row p-4 bg-white rounded-lg mb-3 shadow-sm border border-gray-100"
      onPress={() => onReceiptPress(item)}
    >
      <View className="mr-3 h-12 w-12 rounded-full overflow-hidden justify-center items-center">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="h-full w-full" />
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
    </View>
  );
};

export default RecentReceipts;
