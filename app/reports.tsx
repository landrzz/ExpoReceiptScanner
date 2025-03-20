import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  PieChart,
  BarChart2,
  Download,
  Share2,
} from "lucide-react-native";

const ReportsScreen = () => {
  const router = useRouter();
  const [dateRange, setDateRange] = useState("October 2023");
  const [activeTab, setActiveTab] = useState("summary");

  // Mock data for reports
  const summaryData = {
    totalSpent: 715.98,
    receiptCount: 8,
    categories: [
      { name: "FOOD", amount: 76.48, percentage: 10.7, color: "#F97316" },
      { name: "GAS", amount: 88.25, percentage: 12.3, color: "#3B82F6" },
      { name: "TRAVEL", amount: 475.0, percentage: 66.3, color: "#A855F7" },
      { name: "OTHER", amount: 76.25, percentage: 10.7, color: "#6B7280" },
    ],
  };

  const renderCategoryBar = (category: (typeof summaryData.categories)[0]) => {
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
              width: `${category.percentage}%`,
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
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Date Range Selector */}
      <View className="p-4 bg-gray-50">
        <TouchableOpacity className="flex-row items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
          <View className="flex-row items-center">
            <Calendar size={20} color="#4B5563" />
            <Text className="ml-2 font-medium">{dateRange}</Text>
          </View>
          <Text className="text-blue-500">Change</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          onPress={() => setActiveTab("trends")}
          className={`flex-1 py-3 ${activeTab === "trends" ? "border-b-2 border-blue-500" : ""}`}
        >
          <Text
            className={`text-center font-medium ${activeTab === "trends" ? "text-blue-500" : "text-gray-500"}`}
          >
            Trends
          </Text>
        </TouchableOpacity>
      </View>

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
                  ${summaryData.totalSpent.toFixed(2)}
                </Text>
              </View>
              <View className="bg-purple-50 p-4 rounded-xl w-[48%]">
                <Text className="text-purple-500 font-medium mb-1">
                  Receipts
                </Text>
                <Text className="text-2xl font-bold">
                  {summaryData.receiptCount}
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
                {summaryData.categories.map((category) => (
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
            {summaryData.categories.map((category) =>
              renderCategoryBar(category),
            )}
          </View>
        )}

        {activeTab === "trends" && (
          <View className="items-center justify-center">
            <View className="items-center justify-center bg-gray-100 rounded-xl p-6 w-full h-60 mb-6">
              <BarChart2 size={32} color="#3B82F6" className="mb-2" />
              <Text className="text-gray-500 text-center">
                Monthly Spending Trends
              </Text>
            </View>
            <Text className="text-gray-500 text-center">
              Detailed spending trends will appear here as you add more receipts
              over time.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ReportsScreen;
