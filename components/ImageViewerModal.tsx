import React from "react";
import { Modal, View, TouchableOpacity, Dimensions } from "react-native";
import { X } from "lucide-react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Image } from "expo-image";

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
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

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

        <GestureDetector gesture={composed}>
          <Animated.View
            className="w-full h-full justify-center items-center"
            style={animatedStyle}
          >
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-2/3"
              contentFit="contain"
              transition={200}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

export default ImageViewerModal;
