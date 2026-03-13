import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Seat } from "./types";

interface DraggableSeatProps {
  seat: Seat;
  isEditing: boolean;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onPress: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
}

export const DraggableSeat: React.FC<DraggableSeatProps> = ({
  seat,
  isEditing,
  onUpdatePosition,
  onPress,
  containerWidth,
  containerHeight,
}) => {
  const responsive = useResponsiveLayout();
  const SEAT_SIZE = responsive.seatSize;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const nameFontSize = Math.round(clamp(SEAT_SIZE * 0.34, 12, responsive.isTablet ? 20 : 18));
  const statusFontSize = Math.round(clamp(SEAT_SIZE * 0.19, 9, responsive.isTablet ? 12 : 10));
  const showStatusText = SEAT_SIZE >= 62;
  const nameLineHeight = Math.round(nameFontSize * 1.12);

  const translateX = useSharedValue(seat.x);
  const translateY = useSharedValue(seat.y);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const startX = useSharedValue(seat.x);
  const startY = useSharedValue(seat.y);

  // Sync positions if they change externally
  useEffect(() => {
    translateX.value = withSpring(seat.x);
    translateY.value = withSpring(seat.y);
    startX.value = seat.x;
    startY.value = seat.y;
  }, [seat.x, seat.y]);

  const pan = Gesture.Pan()
    .enabled(isEditing)
    .activateAfterLongPress(200) // Short hold to activate drag, preventing accidental swipes
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.1);
      // capture starting position for this gesture
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      // use translationX/translationY provided by the gesture event
      const translationX = event.translationX ?? 0;
      const translationY = event.translationY ?? 0;
      let newX = startX.value + translationX;
      let newY = startY.value + translationY;

      // Boundary check
      if (newX < 0) newX = 0;
      if (newX > containerWidth - SEAT_SIZE) newX = containerWidth - SEAT_SIZE;
      if (newY < 0) newY = 0;
      if (newY > containerHeight - SEAT_SIZE)
        newY = containerHeight - SEAT_SIZE;

      translateX.value = newX;
      translateY.value = newY;
    })
    .onEnd(() => {
      isDragging.value = false;
      scale.value = withSpring(1);
      runOnJS(onUpdatePosition)(seat.id, translateX.value, translateY.value);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: isDragging.value ? 100 : 1,
      opacity: isDragging.value ? 0.8 : 1,
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "vacant":
        return "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600";
      case "reserved":
        return "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700";
      case "occupied":
        return "bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700";
      default:
        return "bg-slate-200 dark:bg-slate-700";
    }
  };

  const statusColor = getStatusColor(seat.status);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            width: SEAT_SIZE,
            height: SEAT_SIZE,
            position: "absolute",
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => !isEditing && onPress(seat.id)}
          activeOpacity={isEditing ? 1 : 0.7}
          disabled={isEditing} // Let the Gesture Handler take over in edit mode
          style={{
            borderRadius: responsive.seatBorderRadius,
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
          }}
          className={`${statusColor} shadow-sm`}
        >
          <Text
            style={{
              fontSize: nameFontSize,
              lineHeight: nameLineHeight,
              textAlign: "center",
              paddingHorizontal: 2,
            }}
            className="font-bold text-slate-700 dark:text-slate-100"
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            ellipsizeMode="tail"
          >
            {seat.name}
          </Text>
          {showStatusText && seat.itemCount ? (
            <Text
              style={{
                fontSize: statusFontSize,
                marginTop: SEAT_SIZE < 72 ? 2 : responsive.isTablet ? 6 : 4,
              }}
              className="text-slate-500 dark:text-slate-400"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {seat.itemCount} items
            </Text>
          ) : showStatusText ? (
            <Text
              style={{
                fontSize: statusFontSize,
                marginTop: SEAT_SIZE < 72 ? 2 : responsive.isTablet ? 6 : 4,
              }}
              className="text-slate-400 dark:text-slate-500 font-medium uppercase"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {seat.status}
            </Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({});
