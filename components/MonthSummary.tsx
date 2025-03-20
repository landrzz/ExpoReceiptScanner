import React from "react";
import { View, Text } from "react-native";
import { BarChart, PieChart } from "lucide-react-native";

interface CategoryExpense {
  category: "GAS" | "FOOD" | "TRAVEL" | "OTHER";
  amount: number;
  color: string;
}

interface MonthSummaryProps {
  month?: string;
  year?: number;
  totalExpense?: number;
  categoryExpenses?: CategoryExpense[];
}

const MonthSummary = ({
  month = "June",
  year = 2023,
  totalExpense = 1250.75,
  categoryExpenses = [
    { category: "FOOD", amount: 450.25, color: "#4CAF50" },
    { category: "GAS", amount: 320.5, color: "#2196F3" },
    { category: "TRAVEL", amount: 280.0, color: "#FFC107" },
    { category: "OTHER", amount: 200.0, color: "#9C27B0" },
  ],
}: MonthSummaryProps) => {
  // Calculate percentages for each category
  const getPercentage = (amount: number) => {
    return Math.round((amount / totalExpense) * 100);
  };

  return (
    <View className="w-full bg-white p-4 rounded-lg shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-800">
          {month} {year} Summary
        </Text>
        <View className="flex-row items-center">
          <BarChart className="mr-2" size={20} color="#6366F1" />
          <PieChart size={20} color="#6366F1" />
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-4">
        ${totalExpense.toFixed(2)}
      </Text>

      <View className="mb-4">
        {categoryExpenses.map((item, index) => (
          <View key={index} className="mb-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">{item.category}</Text>
              <Text className="text-gray-700">
                ${item.amount.toFixed(2)} ({getPercentage(item.amount)}%)
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${getPercentage(item.amount)}%`,
                  backgroundColor: item.color,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      <View className="flex-row justify-between">
        <View className="flex-1 mr-2 bg-gray-100 p-2 rounded-md">
          <Text className="text-xs text-gray-500">Highest Category</Text>
          <Text className="text-sm font-semibold">
            {categoryExpenses.sort((a, b) => b.amount - a.amount)[0]?.category}
          </Text>
        </View>
        <View className="flex-1 ml-2 bg-gray-100 p-2 rounded-md">
          <Text className="text-xs text-gray-500">vs. Last Month</Text>
          <Text className="text-sm font-semibold text-green-600">+5.2%</Text>
        </View>
      </View>
    </View>
  );
};

export default MonthSummary;
