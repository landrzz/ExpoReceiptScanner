import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Dimensions, Alert, Platform, StatusBar, LogBox } from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  PieChart,
  BarChart2,
  Download,
  Share2,
  Printer,
  ArrowLeft,
} from "lucide-react-native";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
// @ts-ignore
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import MonthYearPicker from "../components/MonthYearPicker";
import { getReceiptsByMonth } from "../lib/receipt-service";
import { Receipt } from "../lib/supabase";
import { getStorageUrl } from "../lib/storage-service";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Add TypeScript declaration for the window.html2pdf global
declare global {
  interface Window {
    html2pdf: any;
  }
}

// Suppress specific warnings
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

const ReportsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [includeExpenseDistribution, setIncludeExpenseDistribution] = useState(false);
  const [reportType, setReportType] = useState<'digital' | 'pdf'>('pdf');
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
    
    // Group receipts into sets of 4 for the 2x2 grid layout
    const receiptGroups = [];
    for (let i = 0; i < receipts.length; i += 4) {
      receiptGroups.push(receipts.slice(i, i + 4));
    }
    
    const receiptsHtml = receiptGroups.map((group, groupIndex) => {
      const receiptCards = group.map((receipt: Receipt) => {
        // Get the full Supabase URL for the image
        const imageUrl = receipt.image_path ? getStorageUrl(receipt.image_path) : '';
        
        // Create image HTML with better error handling and loading indicators
        const imageHtml = imageUrl 
          ? `<div class="receipt-image">
              <img 
                src="${imageUrl}" 
                crossorigin="anonymous" 
                onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<div class=\\'image-placeholder\\'><p>Image failed to load</p></div>';" 
              />
            </div>` 
          : `<div class="image-placeholder"><p>No Image</p></div>`;
        
        return `
          <div class="receipt-card">
            ${imageHtml}
            <div class="receipt-details">
              <h3>${receipt.vendor || 'Unknown Vendor'}</h3>
              <p class="amount">$${receipt.amount.toFixed(2)}</p>
              <p>Date: ${receipt.date} ${receipt.time || ''}</p>
              <p>Category: <span style="color: ${categoryColors[receipt.category]};">${receipt.category}</span></p>
              ${receipt.location ? `<p>Location: ${receipt.location}</p>` : ''}
              ${receipt.notes ? `<p>Notes: ${receipt.notes}</p>` : ''}
            </div>
          </div>
        `;
      }).join('');
      
      // Each group of 4 receipts is wrapped in a page container
      return `
        <div class="receipt-page">
          <div class="receipt-grid">
            ${receiptCards}
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
          <meta http-equiv="Content-Security-Policy" content="default-src * 'self' data: gap: 'unsafe-inline' 'unsafe-eval' https://jfbazvfmbvoufpewlwge.supabase.co https://*.supabase.co https://cdnjs.cloudflare.com; img-src * 'self' data: blob: https://*.supabase.co;">
          <title>Expense Report - ${formattedDate}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              margin: 20px; 
              background-color: #f9fafb; 
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              page-break-after: avoid; 
            }
            .summary-cards { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px; 
              page-break-inside: avoid; 
            }
            .card { 
              flex: 1; 
              padding: 20px; 
              border-radius: 12px; 
              margin: 0 10px; 
            }
            .blue-card { background-color: #eff6ff; }
            .purple-card { background-color: #f5f3ff; }
            .categories-container { 
              background-color: white; 
              border-radius: 12px; 
              padding: 20px; 
              margin-bottom: 30px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
              page-break-inside: avoid; 
            }
            .receipt-list { 
              margin-top: 30px; 
            }
            .receipt-page { 
              page-break-after: always; 
              page-break-inside: avoid; 
              margin-bottom: 20px;
            }
            .receipt-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              width: 100%;
            }
            .receipt-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              background-color: white;
              display: flex;
              flex-direction: column;
              page-break-inside: avoid;
              width: 100%;
              box-sizing: border-box;
            }
            .receipt-image {
              height: 280px;
              position: relative;
              margin-bottom: 10px;
              display: flex;
              justify-content: center;
            }
            .receipt-image img {
              height: 280px;
              max-width: 100%;
              width: auto;
              border-radius: 8px;
              object-fit: contain;
            }
            .image-placeholder {
              width: 100%;
              height: 280px;
              background-color: #f3f4f6;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 10px;
            }
            .image-placeholder p {
              color: #9ca3af;
            }
            .receipt-details h3 {
              margin: 0 0 8px 0;
              font-size: 16px;
              color: #111827;
            }
            .receipt-details p {
              margin: 0 0 5px 0;
              color: #4b5563;
              font-size: 14px;
            }
            .receipt-details .amount {
              font-size: 16px;
              font-weight: bold;
              color: #111827;
            }
            h1 { color: #111827; }
            h2 { 
              color: #374151; 
              margin-bottom: 15px; 
              font-size: 20px; 
              text-align: center; 
              page-break-after: avoid; 
            }
            @media (max-width: 600px) {
              .summary-cards { flex-direction: column; }
              .card { margin: 5px 0; }
              .receipt-grid { grid-template-columns: 1fr; }
            }
            @media print {
              .receipt-page { page-break-after: always; }
              .receipt-card { page-break-inside: avoid; }
              .receipt-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
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
            
            ${includeExpenseDistribution ? `
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
            ` : ''}
            
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
                jsPDF: { 
                  unit: 'mm', 
                  format: 'a4', 
                  orientation: 'portrait'
                },
                pagebreak: { 
                  mode: ['avoid-all', 'css', 'legacy'],
                  after: '.receipt-page'
                }
              };

              // Force the grid layout to be applied before generating the PDF
              const receiptGrids = document.querySelectorAll('.receipt-grid');
              receiptGrids.forEach(grid => {
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                grid.style.width = '100%';
                grid.style.gap = '20px';
              });
              
              // Ensure receipt images are displayed in portrait orientation
              const receiptImages = document.querySelectorAll('.receipt-image img');
              receiptImages.forEach(img => {
                img.style.height = '280px';
                img.style.maxWidth = '100%';
                img.style.width = 'auto';
                img.style.objectFit = 'contain';
              });

              window.html2pdf().from(element).set(opt).save();
            }

            // Message handler for React Native
            function handleMessage(message) {
              if (message === 'generatePDF') {
                generatePDF();
              }
            }

            // Send ready message to React Native
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage('ready');
                }
              }, 1000);
            });
          </script>
        </body>
      </html>
    `;
  };
  
  // Handle PDF generation through different methods based on platform and report type
  const handleExportPdf = async () => {
    if (receipts.length === 0) {
      Alert.alert('No Data', 'There are no receipts to export for the selected period.');
      return;
    }

    try {
      setPdfLoading(true);
      const formattedDate = getFormattedDate();
      const content = generateHtmlContent(receipts, reportData, formattedDate);
      
      // Set HTML content and show WebView for both report types
      setHtmlContent(content);
      setShowWebView(true);
      
    } catch (err) {
      console.error('Error generating report:', err);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Generate and share PDF for mobile
  const generateAndSharePdf = async () => {
    try {
      setPdfLoading(true);
      
      // Check if we're in Expo Go (RNHTMLtoPDF will be null)
      if (!RNHTMLtoPDF) {
        // Fallback for Expo Go - save HTML and share that instead
        try {
          // Create an HTML file in the cache directory
          const htmlFile = `${FileSystem.cacheDirectory}report.html`;
          await FileSystem.writeAsStringAsync(htmlFile, htmlContent, { 
            encoding: FileSystem.EncodingType.UTF8 
          });
          
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return;
          }
          
          // Share the HTML file (in Expo Go, this will open as a web page)
          await Sharing.shareAsync(htmlFile, {
            mimeType: 'text/html',
            dialogTitle: `Expense Report - ${getFormattedDate()}`,
            UTI: 'public.html'
          });
          
          Alert.alert(
            'Expo Go Limitation', 
            'You are using Expo Go which doesn\'t support direct PDF generation. The report has been shared as an HTML file. In a full build, this would be a PDF.'
          );
          
          return;
        } catch (err) {
          console.error('Error sharing HTML in Expo Go:', err);
          throw new Error('PDF generation is not available in Expo Go. This feature requires a development or production build.');
        }
      }
      
      // Native PDF generation for development/production builds
      const fileName = `Expense_Report_${getFormattedDate().replace(' ', '_')}`;
      
      // Generate PDF from HTML content
      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',
        width: 595, // A4 width in points (72 dpi)
        height: 842, // A4 height in points (72 dpi)
      };
      
      const file = await RNHTMLtoPDF.convert(options);
      
      if (file && file.filePath) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Error', 'Sharing is not available on this device');
          return;
        }
        
        // Share the PDF file
        await Sharing.shareAsync(file.filePath, {
          mimeType: 'application/pdf',
          dialogTitle: `Expense Report - ${getFormattedDate()}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        throw new Error('Failed to generate PDF file');
      }
    } catch (err) {
      console.error('Error generating or sharing PDF:', err);
      
      // Provide a more helpful error message
      const error = err as Error;
      if (error.message && error.message.includes('Expo Go')) {
        Alert.alert(
          'Expo Go Limitation',
          'PDF generation is not available in Expo Go. This feature requires a development or production build.'
        );
      } else {
        Alert.alert('Error', 'Failed to share PDF. Please try again.');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle WebView messages
  const handleWebViewMessage = (event: any) => {
    const message = event.nativeEvent.data;
    if (message === 'ready' && reportType === 'pdf') {
      // Only generate PDF automatically if PDF mode is selected
      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript('generatePDF()');
        }
      }, 1500);
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
          onPress={() => {
            try {
              router.replace("/" as any);
            } catch (error) {
              console.error('Navigation error:', error);
            }
          }}
          className="p-3" 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          style={{ marginLeft: 4 }}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Reports</Text>
        <View style={{ width: 48 }} /> {/* Empty view for balance */}
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
            onPress={() => {
              try {
                router.push("/scan" as any);
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
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
              
              {/* PDF Export Options */}
              <View className="bg-white rounded-xl p-6 mb-6 shadow-sm">
                <View className="items-center justify-center mb-4">
                  <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2">
                    <Download size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-lg font-bold text-center">Report Options</Text>
                </View>
                
                {/* Simple checkbox toggle for report type */}
                <View className="flex-row items-center mb-4">
                  <TouchableOpacity 
                    onPress={() => setReportType(reportType === 'digital' ? 'pdf' : 'digital')}
                    className="flex-row items-center"
                  >
                    <View className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${reportType === 'digital' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                      {reportType === 'digital' && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                    <Text className="text-gray-700">Generate Digital Report (Instead of PDF)</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="flex-row items-center mb-4">
                  <TouchableOpacity 
                    onPress={() => setIncludeExpenseDistribution(!includeExpenseDistribution)}
                    className="flex-row items-center"
                  >
                    <View className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${includeExpenseDistribution ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                      {includeExpenseDistribution && (
                        <Text className="text-white text-xs font-bold">✓</Text>
                      )}
                    </View>
                    <Text className="text-gray-700">Include Expense Distribution</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-blue-500 rounded-lg p-3"
                  onPress={handleExportPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Download size={20} color="white" />
                      <Text className="ml-2 text-white font-medium">
                        Generate {reportType === 'digital' ? 'Digital' : 'PDF'} Report
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-between mb-6">
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
      
      {/* HTML Preview Modal/WebView for reports */}
      {showWebView && (
        <Modal
          visible={showWebView}
          onRequestClose={() => setShowWebView(false)}
          animationType="slide"
          transparent={false}
        >
          <View className="flex-1 bg-white">
            <View 
              className="bg-white border-b border-gray-200 flex-row justify-between items-center"
              style={{ 
                paddingTop: Math.max(insets.top, 16), 
                paddingBottom: 12,
                paddingHorizontal: 16
              }}
            >
              <TouchableOpacity 
                onPress={() => setShowWebView(false)}
                className="p-3" 
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <ArrowLeft size={24} color="#000" />
              </TouchableOpacity>
              <Text className="text-xl font-bold">
                Expense Report
              </Text>
              <View style={{ width: 48 }} />
            </View>
            
            {/* Action buttons */}
            <View className="bg-white p-4 border-b border-gray-200 flex-row justify-center space-x-4">
              {reportType === 'digital' ? (
                // Digital report actions
                <>
                  <TouchableOpacity 
                    className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                    onPress={() => {
                      if (webViewRef.current) {
                        webViewRef.current.injectJavaScript('generatePDF()');
                      }
                    }}
                  >
                    <Download size={20} color="white" />
                    <Text className="ml-2 text-white">Save as PDF</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // PDF report actions - add share button
                <>
                  <TouchableOpacity 
                    className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                    onPress={generateAndSharePdf}
                    disabled={pdfLoading}
                  >
                    {pdfLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Share2 size={20} color="white" />
                        <Text className="ml-2 text-white">Save/Share PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-gray-500 px-4 py-2 rounded-lg flex-row items-center"
                    onPress={() => setShowWebView(false)}
                  >
                    <ArrowLeft size={20} color="white" />
                    <Text className="ml-2 text-white">Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* WebView for displaying HTML content */}
            <View style={{ flex: 1 }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={{ marginTop: 10 }}>Loading report...</Text>
                  </View>
                )}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default ReportsScreen;
