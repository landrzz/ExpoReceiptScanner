import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface MonthYearPickerProps {
  onSelectDate: (year: number, month: number) => void;
  initialYear?: number;
  initialMonth?: number;
  onClose: () => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  onSelectDate,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth() + 1,
  onClose,
}) => {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const months = [
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

  // Generate a range of years (current year - 5 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 7 },
    (_, i) => currentYear - 5 + i
  );

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex + 1);
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
  };

  const handleConfirm = () => {
    onSelectDate(selectedYear, selectedMonth);
    onClose();
  };

  const incrementYear = () => {
    if (selectedYear < currentYear + 1) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const decrementYear = () => {
    setSelectedYear(selectedYear - 1);
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View className="bg-white rounded-lg shadow-lg">
            {/* Year selector */}
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-center mb-2">Select Year</Text>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={decrementYear}
                  className="p-2 rounded-full bg-gray-100"
                >
                  <ChevronLeft size={20} color="#4B5563" />
                </TouchableOpacity>
                
                <Text className="text-xl font-bold">{selectedYear}</Text>
                
                <TouchableOpacity
                  onPress={incrementYear}
                  className="p-2 rounded-full bg-gray-100"
                  disabled={selectedYear >= currentYear + 1}
                >
                  <ChevronRight size={20} color={selectedYear >= currentYear + 1 ? "#D1D5DB" : "#4B5563"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Month selector */}
            <View className="p-4">
              <Text className="text-lg font-bold text-center mb-2">Select Month</Text>
              <View className="flex-row flex-wrap justify-between">
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleSelectMonth(index)}
                    className={`py-3 px-2 m-1 rounded-lg w-[30%] ${
                      selectedMonth === index + 1 ? "bg-blue-500" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        selectedMonth === index + 1 ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action buttons */}
            <View className="flex-row border-t border-gray-200 p-4">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-200 mr-2"
              >
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-500"
              >
                <Text className="text-center font-medium text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default MonthYearPicker;
