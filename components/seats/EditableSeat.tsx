import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import type { Seat } from "@/lib/firestore/types";
import { snapToSeatGrid } from "@/lib/pos/seatLayout";
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface EditableSeatProps {
  seat: Seat;
  isSelected: boolean;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  containerWidth: number;
  containerHeight: number;
  isSeatDragging: SharedValue<boolean>;
}

function clampSeatPosition(
  x: number,
  y: number,
  seatWidth: number,
  seatHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  "worklet";
  let nextX = snapToSeatGrid(x);
  let nextY = snapToSeatGrid(y);

  if (nextX < 0) nextX = 0;
  if (nextX > containerWidth - seatWidth) nextX = containerWidth - seatWidth;
  if (nextY < 0) nextY = 0;
  if (nextY > containerHeight - seatHeight) nextY = containerHeight - seatHeight;

  return { x: nextX, y: nextY };
}

export function EditableSeat({
  seat,
  isSelected,
  onUpdatePosition,
  onSelect,
  containerWidth,
  containerHeight,
  isSeatDragging,
}: EditableSeatProps) {
  const responsive = useResponsiveLayout();
  const seatWidth = seat.width || responsive.seatSize;
  const seatHeight = seat.height || responsive.seatSize;
  const minSide = Math.min(seatWidth, seatHeight);
  const isCircle = seat.type === "circle";

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);
  const nameFontSize = Math.round(clamp(minSide * 0.34, 12, responsive.isTablet ? 20 : 18));
  const nameLineHeight = Math.round(nameFontSize * 1.12);

  const translateX = useSharedValue(seat.x);
  const translateY = useSharedValue(seat.y);
  const isDragging = useSharedValue(false);
  const scale = useSharedValue(1);
  const startX = useSharedValue(seat.x);
  const startY = useSharedValue(seat.y);

  useEffect(() => {
    translateX.value = withSpring(seat.x);
    translateY.value = withSpring(seat.y);
    startX.value = seat.x;
    startY.value = seat.y;
  }, [seat.x, seat.y]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .minDistance(4)
    .onStart(() => {
      isDragging.value = true;
      isSeatDragging.value = true;
      scale.value = withSpring(1.08);
      startX.value = translateX.value;
      startY.value = translateY.value;
      runOnJS(onSelect)(seat.id);
    })
    .onUpdate((event) => {
      const snapped = clampSeatPosition(
        startX.value + (event.translationX ?? 0),
        startY.value + (event.translationY ?? 0),
        seatWidth,
        seatHeight,
        containerWidth,
        containerHeight
      );
      translateX.value = snapped.x;
      translateY.value = snapped.y;
    })
    .onEnd(() => {
      isDragging.value = false;
      isSeatDragging.value = false;
      scale.value = withSpring(1);
      runOnJS(onUpdatePosition)(seat.id, translateX.value, translateY.value);
    })
    .onFinalize(() => {
      isDragging.value = false;
      isSeatDragging.value = false;
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .maxDistance(12)
    .onEnd(() => {
      runOnJS(onSelect)(seat.id);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value || isSelected ? 100 : 1,
    opacity: isDragging.value ? 0.85 : 1,
  }));

  const borderRadius = isCircle ? minSide / 2 : responsive.seatBorderRadius;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            width: seatWidth,
            height: seatHeight,
            position: "absolute",
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            borderRadius,
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: isSelected ? 3 : 1,
            backgroundColor: "rgba(150, 111, 51, 0.85)",
            borderColor: isSelected ? "#6699FF" : "#805c28",
          }}
          className="shadow-sm"
        >
          <Text
            style={{
              fontSize: nameFontSize,
              lineHeight: nameLineHeight,
              textAlign: "center",
              paddingHorizontal: 2,
              flexShrink: 0,
            }}
            className="font-bold text-white"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {seat.name}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
