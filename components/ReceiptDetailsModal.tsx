import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { X, Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react-native';
import { Receipt, supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { getStorageUrl } from '../lib/storage-service';

type ReceiptDetailsModalProps = {
  isVisible: boolean;
  receipt: Receipt | null;
  onClose: () => void;
  onDelete?: (receiptId: string) => void;
  onEdit?: (receipt: Receipt) => void;
};

const getCategoryColor = (category: Receipt['category']) => {
  switch (category) {
    case 'GAS':
      return '#3B82F6'; // blue
    case 'FOOD':
      return '#F97316'; // orange
    case 'TRAVEL':
      return '#A855F7'; // purple
    case 'OTHER':
      return '#6B7280'; // gray
    default:
      return '#6B7280';
  }
};

const ReceiptDetailsModal = ({ 
  isVisible, 
  receipt, 
  onClose,
  onDelete,
  onEdit
}: ReceiptDetailsModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  if (!receipt) return null;

  // Get the image URL from the storage path
  const imageUrl = receipt.image_path ? getStorageUrl(receipt.image_path) : null;

  const deleteReceipt = async () => {
    try {
      setIsDeleting(true);
      console.log("Deleting receipt:", receipt.id);
      
      // Delete the receipt from Supabase
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receipt.id);
        
      if (error) {
        console.error("Error deleting receipt:", error);
        if (Platform.OS === 'web') {
          window.alert("Failed to delete receipt. Please try again.");
        } else {
          Alert.alert("Error", "Failed to delete receipt. Please try again.");
        }
      } else {
        console.log("Receipt deleted successfully:", receipt.id);
        setShowDeleteConfirm(false);
        // Call onDelete callback if provided
        if (onDelete) {
          onDelete(receipt.id);
        }
        // After successful deletion, close the modal
        onClose();
      }
    } catch (err) {
      console.error("Exception when deleting receipt:", err);
      if (Platform.OS === 'web') {
        window.alert("An unexpected error occurred. Please try again.");
      } else {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePress = () => {
    console.log("Delete button pressed for receipt:", receipt.id);
    
    // Use web alert for browser environment, React Native Alert for mobile
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this receipt? This action cannot be undone.")) {
        deleteReceipt();
      }
    } else {
      // Use the built-in Alert API for mobile
      Alert.alert(
        "Delete Receipt",
        "Are you sure you want to delete this receipt? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: deleteReceipt,
            style: "destructive"
          }
        ]
      );
    }
  };

  const handleEditPress = () => {
    console.log("Edit button pressed for receipt:", receipt.id);
    
    // If onEdit callback is provided, use it
    if (onEdit) {
      onEdit(receipt);
      return;
    }
    
    // Otherwise navigate to the receipt-details page with the receipt data
    router.push({
      pathname: "/receipt-details",
      params: {
        id: receipt.id,
        imageUri: imageUrl,
        category: receipt.category,
        notes: receipt.notes || '',
        location: receipt.location || '',
        amount: receipt.amount.toString(),
        vendor: receipt.vendor || '',
        isEditing: 'true'
      }
    });
    
    // Close the modal
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-4/5">
          {/* Header */}
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <Text className="text-xl font-bold">Receipt Details</Text>
            <TouchableOpacity 
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1 p-5">
            {/* Receipt Image */}
            {imageUrl ? (
              <View className="items-center mb-6">
                <Image 
                  source={{ uri: imageUrl }} 
                  className="w-full h-64 rounded-lg"
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View className="items-center justify-center mb-6 bg-gray-100 w-full h-64 rounded-lg">
                <Text className="text-gray-400">No Image Available</Text>
              </View>
            )}
            
            {/* Amount */}
            <View className="items-center mb-6">
              <Text className="text-gray-500 mb-1">Total Amount</Text>
              <Text className="text-3xl font-bold">${receipt.amount.toFixed(2)}</Text>
            </View>
            
            {/* Details */}
            <View className="bg-gray-50 rounded-xl p-5 mb-6">
              {/* Vendor */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500">Vendor</Text>
                <Text className="font-medium">{receipt.vendor || 'Not specified'}</Text>
              </View>
              
              {/* Category */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500">Category</Text>
                <View className="flex-row items-center">
                  <View 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getCategoryColor(receipt.category) }}
                  />
                  <Text className="font-medium">{receipt.category}</Text>
                </View>
              </View>
              
              {/* Date & Time */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-500">Date & Time</Text>
                <View className="flex-row items-center">
                  <Calendar size={14} color="#6b7280" className="mr-1" />
                  <Text className="font-medium mr-2">{receipt.date}</Text>
                  {receipt.time && (
                    <>
                      <Clock size={14} color="#6b7280" className="mr-1" />
                      <Text className="font-medium">{receipt.time}</Text>
                    </>
                  )}
                </View>
              </View>
              
              {/* Location */}
              {receipt.location && (
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-gray-500">Location</Text>
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#6b7280" className="mr-1" />
                    <Text className="font-medium">{receipt.location}</Text>
                  </View>
                </View>
              )}
              
              {/* Notes */}
              {receipt.notes && (
                <View className="mb-4">
                  <Text className="text-gray-500 mb-2">Notes</Text>
                  <View className="bg-white p-3 rounded-lg border border-gray-200">
                    <Text>{receipt.notes}</Text>
                  </View>
                </View>
              )}
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row justify-between mb-6">
              <TouchableOpacity 
                className="flex-1 mr-2 bg-blue-500 py-3 rounded-lg items-center"
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium">Edit Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 ml-2 py-3 rounded-lg items-center"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                onPress={handleDeletePress}
                disabled={isDeleting}
                activeOpacity={0.7}
              >
                <Text 
                className="font-medium" 
                style={{ color: '#EF4444' }}>{isDeleting ? 'Deleting...' : 'Delete Receipt'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReceiptDetailsModal;
