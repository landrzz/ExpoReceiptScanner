import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Camera as CameraIcon, Zap, ZapOff, RefreshCw, ArrowLeft } from "lucide-react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from 'expo-image-manipulator';
import { compressImage } from "../lib/storage-service";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [useFlash, setUseFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCameraReady = () => {
    setIsCameraReady(true);
    
    // Start the fade-out animation after 5 seconds
    setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 1000, // 1 second fade-out duration
        useNativeDriver: true,
      }).start();
    }, 5000); // 5 seconds delay before starting fade-out
  };

  const handleTakePhoto = async () => {
    if (!isCameraReady) {
      Alert.alert("Camera not ready", "Please wait until the camera is ready.");
      return;
    }

    if (isProcessing) {
      Alert.alert("Processing", "Please wait while the previous image is being processed.");
      return;
    }

    try {
      setIsProcessing(true);
      let photo;
      
      if (Platform.OS === 'web') {
        // Web-specific implementation
        if (cameraRef.current) {
          const webCameraView = cameraRef.current as any;
          
          // Access the underlying video element and canvas
          const video = webCameraView._videoRef?.current;
          if (!video) {
            throw new Error("Video element not found");
          }
          
          // Create a canvas to capture the image
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current video frame to the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error("Failed to get canvas context");
          }
          
          // Flip horizontally if using front camera
          if (cameraType === 'front') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get the image as a data URL with compression
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress at capture time for web
          
          // Create a photo object similar to what takePictureAsync returns
          photo = {
            uri: dataUrl,
            width: canvas.width,
            height: canvas.height
          };
        } else {
          throw new Error("Camera reference not available");
        }
      } else {
        // Native implementation (iOS, Android)
        if (cameraRef.current) {
          photo = await cameraRef.current.takePictureAsync({
            quality: 0.7, // Initial compression at capture time
          });
        } else {
          throw new Error("Camera reference not available");
        }
      }
      
      if (!photo || !photo.uri) {
        throw new Error("Failed to capture image");
      }
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      let newUri = `${FileSystem.documentDirectory}receipt_${timestamp}.jpg`;
      
      // For web, we need to handle the image differently
      if (Platform.OS === 'web') {
        // On web, we can use the data URL directly or convert it to a blob
        // For simplicity, we'll just use the data URL
        setCapturedImage(photo.uri);
        
        // Navigate to receipt details with the image URI
        router.push({
          pathname: "/receipt-details",
          params: { imageUri: photo.uri },
        });
      } else {
        // Compress the image before saving to local storage
        console.log("Compressing captured image...");
        const compressedUri = await compressImage(photo.uri);
        
        // Copy the compressed file to a persistent location (for native platforms)
        await FileSystem.copyAsync({
          from: compressedUri,
          to: newUri
        });
        
        console.log("Image saved to:", newUri);
        
        // Navigate to receipt details with the image URI
        router.push({
          pathname: "/receipt-details",
          params: { imageUri: newUri },
        });
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to capture image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setUseFlash(current => !current);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No access to camera</Text>
        <Text style={styles.description}>
          Camera permission is required to scan receipts
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, { marginTop: 8 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={useFlash}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.cameraContainer}>
          {/* Camera Controls at the top */}
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.rightControls}>
              <TouchableOpacity 
                onPress={toggleFlash}
                style={styles.controlButton}
              >
                {useFlash ? (
                  <Zap size={24} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <ZapOff size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleCameraType}
                style={styles.controlButton}
              >
                <RefreshCw size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Overlay text */}
          <Animated.View 
            style={[
              styles.overlayTextContainer, 
              { opacity: overlayOpacity }
            ]}
          >
            <Text style={styles.overlayText}>
              Position receipt in frame
            </Text>
          </Animated.View>

          {/* Camera Controls at the bottom */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={!isCameraReady || isProcessing}
              style={[
                styles.captureButton,
                (!isCameraReady || isProcessing) && styles.captureButtonDisabled
              ]}
            >
              {isProcessing ? (
                <Text style={styles.processingText}>...</Text>
              ) : (
                <CameraIcon size={32} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  text: {
    color: "#fff",
    fontSize: 18,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
  description: {
    color: "#aaa",
    textAlign: "center",
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  rightControls: {
    flexDirection: "row",
  },
  controlButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTextContainer: {
    position: "absolute",
    top: "33%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  overlayText: {
    color: "#fff",
    fontSize: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  captureContainer: {
    paddingBottom: 40,
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonDisabled: {
    backgroundColor: "#aaa",
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  }
});
