import React, { useState } from "react";
import { Modal, View, TouchableOpacity, Dimensions, Platform, Image, Text, ActivityIndicator } from "react-native";
import { X } from "lucide-react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

interface ImageViewerModalProps {
  isVisible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const ImageViewerModal = ({
  isVisible,
  imageUrl,
  onClose,
}: ImageViewerModalProps) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  // Process the image URI for different platforms
  const getProcessedImageUri = (uri: string) => {
    console.log("Modal Image URI:", uri);
    
    // No platform-specific processing needed, just return the URI as is
    return uri;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Reset scale if it's too small
      if (scale.value < 0.5) {
        scale.value = 1;
        savedScale.value = 1;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Reset zoom and position
        scale.value = 1;
        savedScale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        scale.value = 2;
        savedScale.value = 2;
      }
    });

  const composed = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const resetView = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onClose();
  };

  // Process the image URL
  const processedUri = getProcessedImageUri(imageUrl);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={resetView}
    >
      <View className="flex-1 bg-black/90 justify-center items-center">
        <TouchableOpacity
          className="absolute top-10 right-5 z-10 p-2 bg-black/50 rounded-full"
          onPress={resetView}
        >
          <X size={24} color="white" />
        </TouchableOpacity>

        {/* Debug info */}
        <Text className="absolute top-20 left-5 text-white text-xs">
          Image URL: {imageUrl ? imageUrl.substring(0, 30) + '...' : 'none'}
        </Text>

        <GestureDetector gesture={composed}>
          <Animated.View
            className="w-full h-full justify-center items-center"
            style={animatedStyle}
          >
            {imageError ? (
              <View className="p-4 bg-red-500/50 rounded-lg">
                <Text className="text-white text-center">Failed to load image</Text>
                <Text className="text-white text-xs mt-2">{imageError}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: processedUri }}
                style={{ width: '100%', height: '66%', resizeMode: 'contain' }}
                onLoadStart={() => {
                  setIsLoading(true);
                  setImageLoaded(false);
                }}
                onError={(e) => {
                  console.log("Modal image loading error:", e.nativeEvent.error);
                  setImageError(e.nativeEvent.error || 'Unknown error');
                  setIsLoading(false);
                }}
                onLoad={() => {
                  console.log("Image loaded successfully");
                  setImageLoaded(true);
                  setIsLoading(false);
                }}
              />
            )}
            
            {isLoading && !imageError && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white mt-4 font-medium">Loading image...</Text>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

export default ImageViewerModal;
