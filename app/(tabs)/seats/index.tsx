import { SeatsLegend, ViewOnlySeat } from "@/components/seats";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useSeats } from "@/hooks/firestore/useSeats";
import { useTableStatus } from "@/hooks/firestore/useTableStatus";
import { MOCK_SEATS } from "@/lib/firestore/mocks";
import type { Seat as FsSeat } from "@/lib/firestore/types";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export default function SeatsScreen() {
  const { data: layout, loading: layoutLoading, error: layoutError } = useSeats();
  const { data: liveStatus } = useTableStatus();

  const seats: FsSeat[] = useMemo(() => {
    const base =
      layout?.tables && layout.tables.length > 0
        ? layout.tables
        : layoutError && __DEV__
          ? MOCK_SEATS
          : [];
    if (!liveStatus) return base;
    const statusByName = new Map(liveStatus.map((s) => [s.name, s]));
    return base.map((seat) => {
      const live = statusByName.get(seat.name);
      return live
        ? { ...seat, status: live.status, itemCount: live.itemCount }
        : seat;
    });
  }, [layout, layoutError, liveStatus]);

  const [containerLayout, setContainerLayout] = useState({
    width: 0,
    height: 0,
  });
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const isTablet = responsive.isTablet;
  const adminTextSize = isTablet ? 14 : 12;
  const areaTabTextSize = isTablet ? 15 : 14;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const handleSeatPress = (nextSeatId: string) => {
    router.push(`/(tabs)/seats/${nextSeatId}`);
  };

  const handleNewPickupOrder = () => {
    router.push("/pickup/new");
  };

  const handleResetView = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      savedScale.value = scale.value;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const newScale = Math.min(
        Math.max(savedScale.value * event.scale, MIN_SCALE),
        MAX_SCALE
      );

      const scaleDiff = newScale / savedScale.value;
      const focalOffsetX = focalX.value - containerLayout.width / 2;
      const focalOffsetY = focalY.value - containerLayout.height / 2;

      translateX.value = savedTranslateX.value - focalOffsetX * (scaleDiff - 1);
      translateY.value = savedTranslateY.value - focalOffsetY * (scaleDiff - 1);

      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedCanvasStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const buttonContainerGap = responsive.isTablet ? responsive.baseSpacing : 8;

  return (
    <GestureHandlerRootView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScreenHeader
        title={t("seats.headerTitle")}
        subtitle={t("seats.headerSubtitle")}
        rightElement={
          <View className="flex-row items-center gap-3">
            <View className="mr-2 flex-row items-center gap-2">
              <Text className="text-slate-500" style={{ fontSize: adminTextSize }}>
                {t("seats.adminMode")}
              </Text>
              <View className="h-6 w-10 items-start justify-center rounded-full bg-slate-200 p-1">
                <View className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </View>
            </View>
            <View className="mr-4 hidden flex-row rounded-lg bg-slate-100 p-1 md:flex">
              <View className="rounded-md bg-white px-3 py-1 shadow-sm">
                <Text
                  className="font-medium text-orange-600"
                  style={{ fontSize: areaTabTextSize }}
                >
                  {t("seats.mainHall")}
                </Text>
              </View>
              <View className="px-3 py-1">
                <Text className="text-slate-500" style={{ fontSize: areaTabTextSize }}>
                  {t("seats.vipRooms")}
                </Text>
              </View>
              <View className="px-3 py-1">
                <Text className="text-slate-500" style={{ fontSize: areaTabTextSize }}>
                  {t("seats.terrace")}
                </Text>
              </View>
            </View>
          </View>
        }
      >
        <View className="flex-row" style={{ gap: buttonContainerGap }}>
          <Button
            variant="outline"
            label={t("seats.resetView")}
            icon="refresh"
            onPress={handleResetView}
          />
          <Button
            variant="primary"
            label={t("seats.pickup")}
            icon="bag-add"
            onPress={handleNewPickupOrder}
          />
        </View>
      </ScreenHeader>

      <View
        className="relative m-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        onLayout={(e) => setContainerLayout(e.nativeEvent.layout)}
      >
        {layoutLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 text-slate-500">{t("seats.loadingSeats")}</Text>
          </View>
        ) : (
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                {
                  flex: 1,
                  width: "100%",
                  height: "100%",
                },
                animatedCanvasStyle,
              ]}
            >
              {containerLayout.width > 0 &&
                seats.map((seat) => (
                  <ViewOnlySeat
                    key={seat.id}
                    seat={{ ...seat, status: seat.status ?? "vacant" }}
                    onPress={handleSeatPress}
                  />
                ))}
            </Animated.View>
          </GestureDetector>
        )}
      </View>
      <SeatsLegend />
    </GestureHandlerRootView>
  );
}
