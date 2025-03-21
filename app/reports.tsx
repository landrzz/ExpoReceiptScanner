import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  PieChart,
  BarChart2,
  Download,
  Share2,
} from "lucide-react-native";
import MonthYearPicker from "../components/MonthYearPicker";
import { getReceiptsByMonth } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";

const ReportsScreen = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reportData, setReportData] = useState({
    totalSpent: 0,
    receiptCount: 0,
    categories: [
      { name: "FOOD", amount: 0, percentage: 0, color: "#F97316" },
      { name: "GAS", amount: 0, percentage: 0, color: "#3B82F6" },
      { name: "TRAVEL", amount: 0, percentage: 0, color: "#A855F7" },
      { name: "OTHER", amount: 0, percentage: 0, color: "#6B7280" },
    ],
  });

  const getFormattedDate = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[selectedDate.month - 1]} ${selectedDate.year}`;
  };

  const handleDateSelection = (year: number, month: number) => {
    setSelectedDate({ year, month });
    setShowDatePicker(false);
  };

  // Calculate report statistics based on receipts
  const calculateReportData = (receipts: Receipt[]) => {
    if (!receipts || receipts.length === 0) {
      return {
        totalSpent: 0,
        receiptCount: 0,
        categories: [
          { name: "FOOD", amount: 0, percentage: 0, color: "#F97316" },
          { name: "GAS", amount: 0, percentage: 0, color: "#3B82F6" },
          { name: "TRAVEL", amount: 0, percentage: 0, color: "#A855F7" },
          { name: "OTHER", amount: 0, percentage: 0, color: "#6B7280" },
        ],
      };
    }

    // Calculate total spent
    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    // Calculate category totals
    const categoryTotals = {
      FOOD: 0,
      GAS: 0,
      TRAVEL: 0,
      OTHER: 0,
    };

    receipts.forEach((receipt) => {
      categoryTotals[receipt.category] += receipt.amount;
    });

    // Calculate percentages and create category data
    const categories = [
      { 
        name: "FOOD", 
        amount: categoryTotals.FOOD, 
        percentage: totalSpent > 0 ? Math.round((categoryTotals.FOOD / totalSpent) * 100 * 10) / 10 : 0, 
        color: "#F97316" 
      },
      { 
        name: "GAS", 
        amount: categoryTotals.GAS, 
        percentage: totalSpent > 0 ? Math.round((categoryTotals.GAS / totalSpent) * 100 * 10) / 10 : 0, 
        color: "#3B82F6" 
      },
      { 
        name: "TRAVEL", 
        amount: categoryTotals.TRAVEL, 
        percentage: totalSpent > 0 ? Math.round((categoryTotals.TRAVEL / totalSpent) * 100 * 10) / 10 : 0, 
        color: "#A855F7" 
      },
      { 
        name: "OTHER", 
        amount: categoryTotals.OTHER, 
        percentage: totalSpent > 0 ? Math.round((categoryTotals.OTHER / totalSpent) * 100 * 10) / 10 : 0, 
        color: "#6B7280" 
      },
    ];

    return {
      totalSpent,
      receiptCount: receipts.length,
      categories,
    };
  };

  // Fetch receipts when selected date changes
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
        
        const receiptData = data || [];
        setReceipts(receiptData);
        
        // Calculate report data based on receipts
        const calculatedReportData = calculateReportData(receiptData);
        setReportData(calculatedReportData);
      } catch (err) {
        console.error("Error fetching receipts:", err);
        setError(err as Error);
        setReceipts([]);
        setReportData(calculateReportData([]));
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [selectedDate]);

  const renderCategoryBar = (category: (typeof reportData.categories)[0]) => {
    return (
      <View key={category.name} className="mb-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-700">{category.name}</Text>
          <Text className="font-semibold">${category.amount.toFixed(2)}</Text>
        </View>
        <View className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${category.percentage || 0}%`,
              backgroundColor: category.color,
            }}
          />
        </View>
        <Text className="text-right text-xs text-gray-500 mt-1">
          {category.percentage}%
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200 flex-row justify-between items-center">
        <View className="w-8"></View>
        <Text className="text-xl font-bold">Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Date Range Selector */}
      <View className="p-4 bg-gray-50">
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)} 
          className="flex-row items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
        >
          <View className="flex-row items-center">
            <Calendar size={20} color="#4B5563" />
            <Text className="ml-2 font-medium">{getFormattedDate()}</Text>
          </View>
          <Text className="text-blue-500">Change</Text>
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

      {/* Tab Navigation */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("summary")}
          className={`flex-1 py-3 ${activeTab === "summary" ? "border-b-2 border-blue-500" : ""}`}
        >
          <Text
            className={`text-center font-medium ${activeTab === "summary" ? "text-blue-500" : "text-gray-500"}`}
          >
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("categories")}
          className={`flex-1 py-3 ${activeTab === "categories" ? "border-b-2 border-blue-500" : ""}`}
        >
          <Text
            className={`text-center font-medium ${activeTab === "categories" ? "text-blue-500" : "text-gray-500"}`}
          >
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-500">Loading reports...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-2">
            Failed to load reports
          </Text>
          <Text className="text-gray-500 text-center">
            {error.message || "An unexpected error occurred"}
          </Text>
        </View>
      ) : receipts.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-center mb-4">
            No receipts found for {getFormattedDate()}
          </Text>
          <TouchableOpacity
            className="bg-blue-500 py-2 px-4 rounded-lg"
            onPress={() => router.push("/scan")}
          >
            <Text className="text-white font-medium">Scan a Receipt</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {activeTab === "summary" && (
            <View>
              {/* Summary Cards */}
              <View className="flex-row justify-between mb-6">
                <View className="bg-blue-50 p-4 rounded-xl w-[48%]">
                  <Text className="text-blue-500 font-medium mb-1">
                    Total Spent
                  </Text>
                  <Text className="text-2xl font-bold">
                    ${reportData.totalSpent.toFixed(2)}
                  </Text>
                </View>
                <View className="bg-purple-50 p-4 rounded-xl w-[48%]">
                  <Text className="text-purple-500 font-medium mb-1">
                    Receipts
                  </Text>
                  <Text className="text-2xl font-bold">
                    {reportData.receiptCount}
                  </Text>
                </View>
              </View>

              {/* Pie Chart Placeholder */}
              <View className="items-center justify-center bg-gray-100 rounded-xl p-6 mb-6">
                <PieChart size={32} color="#3B82F6" className="mb-2" />
                <Text className="text-gray-500 text-center">
                  Expense Distribution
                </Text>
                <View className="w-full mt-4 flex-row flex-wrap justify-between">
                  {reportData.categories.filter(cat => cat.percentage > 0).map((category) => (
                    <View
                      key={category.name}
                      className="flex-row items-center mb-2 w-[48%]"
                    >
                      <View
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <Text className="text-xs">
                        {category.name}: {category.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-between mb-6">
                <TouchableOpacity className="bg-blue-500 p-3 rounded-lg flex-row items-center justify-center w-[48%]">
                  <Download size={20} color="white" className="mr-2" />
                  <Text className="text-white font-medium">Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-200 p-3 rounded-lg flex-row items-center justify-center w-[48%]">
                  <Share2 size={20} color="#4B5563" className="mr-2" />
                  <Text className="text-gray-700 font-medium">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === "categories" && (
            <View>
              <Text className="text-lg font-bold mb-4">Spending by Category</Text>
              {reportData.categories.map((category) =>
                renderCategoryBar(category),
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default ReportsScreen;
