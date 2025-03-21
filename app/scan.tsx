import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Camera as CameraIcon } from "lucide-react-native";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from "expo-file-system";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [useFlash, setUseFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        if (!photo || !photo.uri) {
          throw new Error("Failed to capture image");
        }
        
        // Create a unique filename
        const timestamp = new Date().getTime();
        const newUri = `${FileSystem.documentDirectory}receipt_${timestamp}.jpg`;
        
        // Copy the file to a persistent location
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newUri
        });
        
        // Navigate to receipt details with the image URI
        router.push({
          pathname: "/receipt-details",
          params: { imageUri: newUri },
        });
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to capture image. Please try again.");
      }
    } else {
      Alert.alert("Camera not ready", "Please wait until the camera is ready.");
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
              onPress={toggleFlash}
              style={styles.controlButton}
            >
              <Text style={styles.controlText}>
                {useFlash ? "Flash: ON" : "Flash: OFF"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={toggleCameraType}
              style={styles.controlButton}
            >
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>
          </View>

          {/* Overlay text */}
          <View style={styles.overlayTextContainer}>
            <Text style={styles.overlayText}>
              Position receipt in frame
            </Text>
          </View>

          {/* Camera Controls at the bottom */}
          <View style={styles.captureContainer}>
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={!isCameraReady}
              style={[
                styles.captureButton,
                !isCameraReady && styles.captureButtonDisabled
              ]}
            >
              <CameraIcon size={32} color="#000" />
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
    justifyContent: "flex-end",
    padding: 16,
  },
  controlButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
  },
  controlText: {
    color: "#fff",
    fontSize: 12,
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
});
