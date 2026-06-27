import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const BADGE_GREEN = "#01a13d";

interface TabNotificationIconProps {
  color: string;
  size: number;
  unreadCount: number;
}

export function TabNotificationIcon({
  color,
  size,
  unreadCount,
}: TabNotificationIconProps) {
  const translateX = useSharedValue(0);
  const prevCountRef = useRef(unreadCount);

  const triggerShake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(6, { duration: 100 }),
      withTiming(-4, { duration: 100 }),
      withTiming(2, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  }, [translateX]);

  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      triggerShake();
    }
    prevCountRef.current = unreadCount;
  }, [triggerShake, unreadCount]);

  useEffect(() => {
    if (unreadCount <= 0) return;

    const interval = setInterval(() => {
      triggerShake();
    }, 2000);

    return () => clearInterval(interval);
  }, [triggerShake, unreadCount]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Animated.View
      style={[
        {
          width: size + 14,
          height: size + 10,
          alignItems: "center",
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <Ionicons name="notifications" size={size} color={color} />
      {unreadCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -1,
            right: -1,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: BADGE_GREEN,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 10,
              fontWeight: "700",
              lineHeight: 12,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
