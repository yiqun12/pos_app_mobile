import { Seat, SeatsLegend, ViewOnlySeat } from "@/components/seats";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { db } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const MOCK_SEATS: Seat[] = [
  { id: "1", name: "A1", status: "vacant", x: 20, y: 20 },
  { id: "2", name: "A2", status: "reserved", x: 120, y: 20 },
  { id: "3", name: "A3", status: "occupied", itemCount: 3, x: 220, y: 20 },
  { id: "4", name: "B1", status: "vacant", x: 20, y: 120 },
  { id: "5", name: "B2", status: "occupied", itemCount: 1, x: 120, y: 120 },
  { id: "6", name: "B3", status: "vacant", x: 220, y: 120 },
  { id: "7", name: "C1", status: "reserved", x: 20, y: 220 },
  { id: "8", name: "C2", status: "occupied", itemCount: 2, x: 120, y: 220 },
];

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

function parseSeatArrangement(jsonString: string): Seat[] {
  try {
    if (!jsonString) return MOCK_SEATS;

    const parsed = JSON.parse(jsonString);
    if (!parsed.table || !Array.isArray(parsed.table)) {
      return MOCK_SEATS;
    }

    return parsed.table.map((table: any, index: number) => ({
      id: table.id || `seat-${index}`,
      name: table.tableName || `T${index + 1}`,
      status: "vacant" as const,
      x: table.left || 0,
      y: table.top || 0,
      width: table.width || 60,
      height: table.height || 60,
    }));
  } catch (error) {
    console.error("Error parsing seat arrangement:", error);
    return MOCK_SEATS;
  }
}

export default function SeatsScreen() {
  const [seats, setSeats] = useState<Seat[]>(MOCK_SEATS);
  const [loading, setLoading] = useState(true);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        setDataNotice(null);
        const docRef = doc(db, "TitleLogoNameContent", "aapp-sf-90011-38");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as {
            restaurant_seat_arrangement?: string;
          };
          if (data.restaurant_seat_arrangement) {
            const parsedSeats = parseSeatArrangement(data.restaurant_seat_arrangement);
            setSeats(parsedSeats);
            setDataNotice(null);
          } else {
            setSeats(MOCK_SEATS);
            setDataNotice(t("seats.cloudSeatMapMissing"));
          }
        } else {
          setSeats(MOCK_SEATS);
          setDataNotice(t("seats.cloudSeatConfigMissing"));
        }
      } catch (error) {
        console.log("Error fetching seats (using mock):", error);
        setSeats(MOCK_SEATS);
        setDataNotice(t("seats.databaseConnectionFailed"));
      } finally {
        setLoading(false);
      }
    };

    void fetchSeats();
  }, [t]);

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
        {dataNotice ? (
          <View className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <Text className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {dataNotice}
            </Text>
          </View>
        ) : null}

        {loading ? (
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
                    seat={seat}
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
