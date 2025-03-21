import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Dimensions, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  PieChart,
  BarChart2,
  Download,
  Share2,
  Printer,
} from "lucide-react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import MonthYearPicker from "../components/MonthYearPicker";
import { getReceiptsByMonth } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";

// Add TypeScript declaration for the window.html2pdf global
declare global {
  interface Window {
    html2pdf: any;
  }
}

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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [generatedPdfPath, setGeneratedPdfPath] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

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

  // Generate HTML content for PDF
  const generateHtmlContent = (receipts: Receipt[], reportData: any, formattedDate: string) => {
    const categoryColors = {
      'FOOD': '#F97316',
      'GAS': '#3B82F6',
      'TRAVEL': '#A855F7',
      'OTHER': '#6B7280'
    };
    
    // Create receipts HTML
    const receiptsHtml = receipts.map((receipt: Receipt) => {
      const imageHtml = receipt.image_url 
        ? `<div style="flex: 1;"><img src="${receipt.image_url}" style="width: 150px; height: auto; border-radius: 8px;" crossorigin="anonymous" /></div>` 
        : `<div style="flex: 1; width: 150px; height: 150px; background-color: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><p style="color: #9ca3af;">No Image</p></div>`;
      
      return `
        <div style="display: flex; flex-direction: row; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background-color: white;">
          ${imageHtml}
          <div style="flex: 2; margin-left: 15px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${receipt.vendor || 'Unknown Vendor'}</h3>
            <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #111827;">$${receipt.amount.toFixed(2)}</p>
            <p style="margin: 0 0 5px 0; color: #4b5563;">Date: ${receipt.date} ${receipt.time || ''}</p>
            <p style="margin: 0 0 5px 0; color: #4b5563;">Category: <span style="color: ${categoryColors[receipt.category]};">${receipt.category}</span></p>
            ${receipt.location ? `<p style="margin: 0 0 5px 0; color: #4b5563;">Location: ${receipt.location}</p>` : ''}
            ${receipt.notes ? `<p style="margin: 0 0 5px 0; color: #4b5563;">Notes: ${receipt.notes}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Create enhanced category chart HTML
    const categoriesHtml = reportData.categories
      .filter((c: typeof reportData.categories[0]) => c.percentage > 0)
      .map((category: typeof reportData.categories[0]) => `
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 12px; border-radius: 8px; background-color: ${category.color}20;">
          <div style="display: flex; flex-direction: row; align-items: center;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${category.color}; margin-right: 12px;"></div>
            <div style="font-size: 16px; font-weight: 500;">${category.name}</div>
          </div>
          <div style="display: flex; flex-direction: row; align-items: center;">
            <div style="font-size: 16px; font-weight: bold; margin-right: 10px; color: #374151;">$${category.amount.toFixed(2)}</div>
            <div style="background-color: white; padding: 4px 10px; border-radius: 999px;">
              <span style="font-size: 14px; font-weight: 600; color: ${category.color};">${category.percentage}%</span>
            </div>
          </div>
        </div>
      `).join('');
    
    // Create the HTML content with the html2pdf.js library included
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Expense Report - ${formattedDate}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 20px; background-color: #f9fafb; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary-cards { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .card { flex: 1; padding: 20px; border-radius: 12px; margin: 0 10px; }
            .blue-card { background-color: #eff6ff; }
            .purple-card { background-color: #f5f3ff; }
            .categories-container { background-color: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .receipt-list { margin-top: 30px; }
            h1 { color: #111827; }
            h2 { color: #374151; margin-bottom: 15px; font-size: 20px; text-align: center; }
            .controls { position: fixed; top: 10px; right: 10px; display: flex; gap: 10px; z-index: 1000; }
            .btn { padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; text-align: center; }
            .download-btn { background-color: #3b82f6; color: white; border: none; }
            .print-btn { background-color: #6b7280; color: white; border: none; }
            @media (max-width: 600px) {
              .summary-cards { flex-direction: column; }
              .card { margin: 5px 0; }
            }
            @media print {
              .controls { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="controls">
            <button class="btn download-btn" onclick="generatePDF()">Download PDF</button>
            <button class="btn print-btn" onclick="window.print()">Print</button>
          </div>

          <div id="content" class="container">
            <div class="header">
              <h1>Expense Report</h1>
              <p>${formattedDate}</p>
            </div>
            
            <div class="summary-cards">
              <div class="card blue-card">
                <h3 style="color: #3b82f6; margin-top: 0;">Total Spent</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">$${reportData.totalSpent.toFixed(2)}</p>
              </div>
              
              <div class="card purple-card">
                <h3 style="color: #8b5cf6; margin-top: 0;">Receipts</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 0;">${reportData.receiptCount}</p>
              </div>
            </div>
            
            <div class="categories-container">
              <h3 style="text-align: center; font-size: 18px; margin-bottom: 15px;">Expense Distribution</h3>
              <div style="display: flex; justify-content: center; margin-bottom: 15px;">
                <div style="background-color: #EBF5FF; border-radius: 50%; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#3B82F6"/>
                  </svg>
                </div>
              </div>
              ${categoriesHtml}
            </div>
            
            <div class="receipt-list">
              <h2>Receipts</h2>
              ${receiptsHtml}
            </div>
          </div>

          <script>
            function generatePDF() {
              const element = document.getElementById('content');
              const opt = {
                margin: 10,
                filename: 'expense_report_${selectedDate.year}_${selectedDate.month}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                  scale: 2,
                  useCORS: true,
                  logging: true,
                  allowTaint: true,
                  imageTimeout: 15000 // Increase timeout for image loading
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };

              window.html2pdf().from(element).set(opt).save();
            }

            // Message handler for React Native
            function handleMessage(message) {
              if (message === 'generatePDF') {
                generatePDF();
              } else if (message === 'print') {
                window.print();
              }
            }

            // Auto-generate PDF if on mobile (when using WebView)
            function checkPlatformAndGenerate() {
              const userAgent = navigator.userAgent || navigator.vendor || window.opera;
              const isMobile = /android|iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
              
              if (isMobile) {
                // Wait for everything to load
                setTimeout(() => {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage('ready');
                  }
                }, 1000);
              }
            }

            document.addEventListener('DOMContentLoaded', checkPlatformAndGenerate);
          </script>
        </body>
      </html>
    `;
  };
  
  // Handle PDF generation through different methods based on platform
  const handleExportPdf = async () => {
    if (receipts.length === 0) {
      Alert.alert('No Data', 'There are no receipts to export for the selected period.');
      return;
    }

    try {
      setPdfLoading(true);
      const formattedDate = getFormattedDate();
      const content = generateHtmlContent(receipts, reportData, formattedDate);
      
      // For both web and mobile, show the preview first
      setHtmlContent(content);
      setShowWebView(true);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  
  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    if (message === 'ready') {
      // The WebView is ready, we can send commands
      webViewRef.current?.injectJavaScript('generatePDF()');
    }
  };
  
  // Handle sharing
  const handleShare = async () => {
    try {
      setPdfLoading(true);
      
      if (Platform.OS === 'web') {
        // For web, just open the export PDF view which has sharing options
        handleExportPdf();
        return;
      }
      
      // For mobile
      if (!generatedPdfPath) {
        // Generate HTML if not already done
        const formattedDate = getFormattedDate();
        const content = generateHtmlContent(receipts, reportData, formattedDate);
        const htmlFile = `${FileSystem.cacheDirectory}report.html`;
        await FileSystem.writeAsStringAsync(htmlFile, content, { encoding: FileSystem.EncodingType.UTF8 });
        setGeneratedPdfPath(htmlFile);
      }
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      // Share the HTML file (which user can open in browser)
      await Sharing.shareAsync(generatedPdfPath!, {
        mimeType: 'text/html',
        dialogTitle: `Expense Report - ${getFormattedDate()}`,
        UTI: 'public.html'
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share the report.');
    } finally {
      setPdfLoading(false);
    }
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

              {/* Expense Distribution Section */}
              <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <View className="items-center justify-center mb-4">
                  <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <PieChart size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-lg font-bold text-center">Expense Distribution</Text>
                </View>
                
                {/* Category Legend - Enhanced */}
                <View className="w-full">
                  {reportData.categories
                    .filter((c: typeof reportData.categories[0]) => c.percentage > 0)
                    .map((category: typeof reportData.categories[0]) => (
                      <View
                        key={category.name}
                        className="flex-row items-center justify-between mb-3 p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}20` }} // 20 = 12% opacity
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          />
                          <Text className="font-medium">{category.name}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-gray-700 font-bold mr-2">
                            ${category.amount.toFixed(2)}
                          </Text>
                          <View className="bg-white px-2 py-1 rounded-full">
                            <Text className="text-xs font-semibold" style={{ color: category.color }}>
                              {category.percentage}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-between mb-6">
                <TouchableOpacity 
                  className="bg-blue-500 p-4 rounded-lg flex-row items-center justify-center w-full"
                  onPress={handleExportPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  ) : (
                    <Download size={20} color="white" style={{ marginRight: 8 }} />
                  )}
                  <Text className="text-white font-medium">Export & Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === "categories" && (
            <View>
              <Text className="text-lg font-bold mb-4">Spending by Category</Text>
              {reportData.categories.map((category: typeof reportData.categories[0]) =>
                renderCategoryBar(category),
              )}
            </View>
          )}
        </ScrollView>
      )}
      
      {/* HTML Preview Modal/WebView for PDF generation */}
      {showWebView && (
        <Modal
          visible={showWebView}
          onRequestClose={() => setShowWebView(false)}
          animationType="slide"
        >
          <View className="flex-1 bg-white">
            <View className="bg-white p-4 border-b border-gray-200 flex-row justify-between items-center">
              <TouchableOpacity onPress={() => setShowWebView(false)}>
                <Text className="text-blue-500">Close</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold">Expense Report</Text>
              <View style={{ width: 50 }} />
            </View>
            
            {/* Action buttons for PDF */}
            <View className="bg-white p-4 border-b border-gray-200 flex-row justify-center space-x-4">
              <TouchableOpacity 
                className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                onPress={async () => {
                  try {
                    setPdfLoading(true);
                    
                    if (Platform.OS === 'web') {
                      // Create a temporary div to render the HTML
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = htmlContent;
                      document.body.appendChild(tempDiv);
                      
                      // Load html2pdf.js dynamically if it's not already loaded
                      if (typeof window.html2pdf === 'undefined') {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                        script.async = true;
                        
                        // Wait for the script to load
                        await new Promise((resolve, reject) => {
                          script.onload = resolve;
                          script.onerror = reject;
                          document.head.appendChild(script);
                        });
                      }
                      
                      // Configure html2pdf options
                      const options = {
                        margin: 10,
                        filename: `Expense_Report_${selectedDate.year}_${selectedDate.month}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { 
                          scale: 2,
                          useCORS: true,
                          logging: true,
                          allowTaint: true,
                          imageTimeout: 15000 // Increase timeout for image loading
                        },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                      };
                      
                      // Wait for images to load before generating PDF
                      const images = tempDiv.querySelectorAll('img');
                      const imagePromises = Array.from(images).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(resolve => {
                          img.onload = resolve;
                          img.onerror = resolve; // Continue even if image fails to load
                        });
                      });
                      
                      // Wait for all images to load or timeout after 5 seconds
                      await Promise.race([
                        Promise.all(imagePromises),
                        new Promise(resolve => setTimeout(resolve, 5000))
                      ]);
                      
                      // Generate PDF
                      await window.html2pdf().set(options).from(tempDiv).save();
                      
                      // Clean up
                      document.body.removeChild(tempDiv);
                    } else {
                      // For mobile, use file system API to save and share
                      if (webViewRef.current) {
                        webViewRef.current.injectJavaScript(`
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'generatePdf'
                          }));
                          true;
                        `);
                      }
                    }
                  } catch (error) {
                    console.error('Error downloading PDF:', error);
                    Alert.alert('Error', 'Failed to download PDF. Please try again.');
                  } finally {
                    setPdfLoading(false);
                  }
                }}
              >
                <Download size={18} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-medium">Download PDF</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'web' && (
                <TouchableOpacity 
                  className="bg-gray-200 px-4 py-2 rounded-lg flex-row items-center"
                  onPress={() => {
                    try {
                      // Create a temporary iframe for printing
                      const printIframe = document.createElement('iframe');
                      printIframe.style.position = 'absolute';
                      printIframe.style.top = '-9999px';
                      printIframe.style.left = '-9999px';
                      document.body.appendChild(printIframe);
                      
                      // Check if contentDocument exists before using it
                      if (printIframe.contentDocument) {
                        printIframe.contentDocument.write(htmlContent);
                        printIframe.contentDocument.close();
                      }
                      
                      // Wait for images to load
                      setTimeout(() => {
                        // Check if contentWindow exists before using it
                        if (printIframe.contentWindow) {
                          printIframe.contentWindow.print();
                        }
                        document.body.removeChild(printIframe);
                      }, 500);
                    } catch (error) {
                      console.error('Error printing:', error);
                      Alert.alert('Error', 'Failed to print. Please try again.');
                    }
                  }}
                >
                  <Printer size={18} color="#4B5563" style={{ marginRight: 8 }} />
                  <Text className="text-gray-700 font-medium">Print</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {Platform.OS === 'web' ? (
              <View className="flex-1">
                <iframe
                  srcDoc={htmlContent}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </View>
            ) : (
              <WebView
                ref={webViewRef}
                source={{ html: htmlContent, baseUrl: '' }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View className="absolute inset-0 justify-center items-center bg-white">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="mt-4 text-gray-500">Generating report...</Text>
                  </View>
                )}
              />
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

export default ReportsScreen;
