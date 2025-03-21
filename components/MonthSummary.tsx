import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { BarChart, PieChart } from "lucide-react-native";
import { getReceiptsByMonth } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";

interface CategoryExpense {
  category: "GAS" | "FOOD" | "TRAVEL" | "OTHER";
  amount: number;
  color: string;
}

interface MonthSummaryProps {
  month?: string;
  year?: number;
}

const CATEGORY_COLORS = {
  FOOD: "#4CAF50",
  GAS: "#2196F3",
  TRAVEL: "#FFC107",
  OTHER: "#9C27B0"
};

const MonthSummary = ({
  month,
  year,
}: MonthSummaryProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [previousMonthChange, setPreviousMonthChange] = useState<number | null>(null);

  // Get current month and year if not provided
  const currentDate = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthIndex = currentDate.getMonth();
  const currentMonthName = month || monthNames[currentMonthIndex];
  const currentYear = year || currentDate.getFullYear();

  // Calculate percentages for each category
  const getPercentage = (amount: number) => {
    return totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
  };

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        
        // Get the month index from the month name if provided
        const monthIndex = month ? monthNames.findIndex(m => m === month) + 1 : currentMonthIndex + 1;
        const yearValue = year || currentYear;
        
        // Fetch current month receipts
        const { data: currentMonthReceipts, error: currentError } = await getReceiptsByMonth(
          monthIndex,
          yearValue
        );
        
        if (currentError) throw currentError;
        
        setReceipts(currentMonthReceipts || []);
        
        // Calculate total expense
        const total = currentMonthReceipts?.reduce((sum, receipt) => sum + receipt.amount, 0) || 0;
        setTotalExpense(total);
        
        // Calculate category expenses
        const categories: { [key: string]: number } = {
          FOOD: 0,
          GAS: 0,
          TRAVEL: 0,
          OTHER: 0
        };
        
        currentMonthReceipts?.forEach(receipt => {
          categories[receipt.category] += receipt.amount;
        });
        
        const categoryData: CategoryExpense[] = Object.entries(categories).map(([category, amount]) => ({
          category: category as "GAS" | "FOOD" | "TRAVEL" | "OTHER",
          amount,
          color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
        }));
        
        setCategoryExpenses(categoryData);
        
        // Try to fetch previous month data for comparison
        try {
          // Calculate previous month and year
          let prevMonth = monthIndex - 1;
          let prevYear = yearValue;
          if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
          }
          
          const { data: prevMonthReceipts } = await getReceiptsByMonth(
            prevMonth,
            prevYear
          );
          
          const prevTotal = prevMonthReceipts?.reduce((sum, receipt) => sum + receipt.amount, 0) || 0;
          
          // Calculate percentage change
          if (prevTotal > 0) {
            const change = ((total - prevTotal) / prevTotal) * 100;
            setPreviousMonthChange(Math.round(change * 10) / 10); // Round to 1 decimal place
          } else if (total > 0) {
            setPreviousMonthChange(100); // If previous month was 0 and current is not, show 100% increase
          } else {
            setPreviousMonthChange(0); // Both months are 0
          }
        } catch (err) {
          console.error("Error fetching previous month data:", err);
          setPreviousMonthChange(null);
        }
      } catch (err) {
        console.error("Error fetching month summary data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceipts();
  }, [month, year, currentMonthIndex, currentYear]);

  if (loading) {
    return (
      <View className="w-full bg-white p-4 rounded-lg shadow-sm items-center justify-center" style={{ minHeight: 200 }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="mt-2 text-gray-500">Loading summary...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="w-full bg-white p-4 rounded-lg shadow-sm items-center justify-center" style={{ minHeight: 200 }}>
        <Text className="text-red-500">Failed to load summary</Text>
      </View>
    );
  }

  return (
    <View className="w-full bg-white p-4 rounded-lg shadow-sm">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-800">
          {currentMonthName} {currentYear} Summary
        </Text>
        <View className="flex-row items-center">
          <BarChart className="mr-2" size={20} color="#6366F1" />
          <PieChart size={20} color="#6366F1" />
        </View>
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-4">
        ${totalExpense.toFixed(2)}
      </Text>

      {receipts.length === 0 ? (
        <View className="items-center justify-center py-4">
          <Text className="text-gray-500">No receipts found for this month</Text>
        </View>
      ) : (
        <View className="mb-4">
          {categoryExpenses
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map((item, index) => (
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
      )}

      <View className="flex-row justify-between">
        <View className="flex-1 mr-2 bg-gray-100 p-2 rounded-md">
          <Text className="text-xs text-gray-500">Highest Category</Text>
          <Text className="text-sm font-semibold">
            {categoryExpenses.length > 0 && receipts.length > 0
              ? categoryExpenses.sort((a, b) => b.amount - a.amount)[0]?.category
              : "N/A"}
          </Text>
        </View>
        <View className="flex-1 ml-2 bg-gray-100 p-2 rounded-md">
          <Text className="text-xs text-gray-500">vs. Last Month</Text>
          {previousMonthChange !== null ? (
            <Text 
              className={`text-sm font-semibold ${
                previousMonthChange > 0 
                  ? "text-red-600" 
                  : previousMonthChange < 0 
                    ? "text-green-600" 
                    : "text-gray-600"
              }`}
            >
              {previousMonthChange > 0 ? "+" : ""}{previousMonthChange}%
            </Text>
          ) : (
            <Text className="text-sm font-semibold text-gray-600">N/A</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default MonthSummary;
