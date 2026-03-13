import { Seat, SeatsLegend, ViewOnlySeat } from "@/components/seats";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/Header";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { db } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Mock data for seats as fallback
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

// Zoom constraints
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

/**
 * Parse restaurant seat arrangement from Firestore JSON
 * Expected format: { table: [{ type, left, top, width, height, tableName, id, scaleX, scaleY, angle, ... }, ...] }
 */
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
  const isTablet = responsive.isTablet;
  const adminTextSize = isTablet ? 14 : 12;
  const areaTabTextSize = isTablet ? 15 : 14;

  // Canvas transform values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Pinch focal point for zoom centering
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Fetch seat arrangement from Firestore
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
            const parsedSeats = parseSeatArrangement(
              data.restaurant_seat_arrangement,
            );
            setSeats(parsedSeats);
            setDataNotice(null);
          } else {
            setSeats(MOCK_SEATS);
            setDataNotice("未读取到云端座位图，当前显示演示数据");
          }
        } else {
          setSeats(MOCK_SEATS);
          setDataNotice("未找到云端座位配置，当前显示演示数据");
        }
      } catch (error) {
        console.log("Error fetching seats (using mock):", error);
        setSeats(MOCK_SEATS);
        setDataNotice("数据库连接失败，当前显示演示数据");
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, []);

  const handleSeatPress = (seatId: string) => {
    router.push(`/(tabs)/seats/${seatId}`);
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

  // Pan gesture for dragging the canvas
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      savedScale.value = scale.value;
      // Store focal point at start
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      // Calculate new scale with clamping
      const newScale = Math.min(
        Math.max(savedScale.value * event.scale, MIN_SCALE),
        MAX_SCALE
      );

      // Zoom centered on pinch focal point
      // Adjust translation to keep focal point stationary
      const scaleDiff = newScale / savedScale.value;
      const focalOffsetX = focalX.value - containerLayout.width / 2;
      const focalOffsetY = focalY.value - containerLayout.height / 2;

      translateX.value =
        savedTranslateX.value - focalOffsetX * (scaleDiff - 1);
      translateY.value =
        savedTranslateY.value - focalOffsetY * (scaleDiff - 1);

      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine pan and pinch gestures to work simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style for the canvas container
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
        title="7美元POS机" 
        subtitle="10:30 AM - 2026年3月6日"
        rightElement={
          <View className="flex-row items-center gap-3">
             <View className="flex-row items-center gap-2 mr-2">
                <Text className="text-slate-500" style={{ fontSize: adminTextSize }}>
                  Admin Mode | 管理员模式
                </Text>
                <View className="w-10 h-6 bg-slate-200 rounded-full p-1 items-start justify-center">
                    <View className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </View>
             </View>
             {/* 区域切换模拟 */}
             <View className="flex-row bg-slate-100 rounded-lg p-1 mr-4 hidden md:flex">
                <View className="bg-white shadow-sm rounded-md px-3 py-1">
                  <Text
                    className="font-medium text-orange-600"
                    style={{ fontSize: areaTabTextSize }}
                  >
                    Main Hall
                  </Text>
                </View>
                <View className="px-3 py-1">
                  <Text className="text-slate-500" style={{ fontSize: areaTabTextSize }}>
                    VIP Rooms
                  </Text>
                </View>
                <View className="px-3 py-1">
                  <Text className="text-slate-500" style={{ fontSize: areaTabTextSize }}>
                    Terrace
                  </Text>
                </View>
             </View>
          </View>
        }
      >
        <View
          className="flex-row"
          style={{
            gap: buttonContainerGap,
          }}
        >
          <Button
            variant="outline"
            label="Reset View"
            icon="refresh"
            onPress={handleResetView}
          />
          <Button
            variant="primary" // Changed to primary for better visibility
            label="Pickup"
            icon="bag-add"
            onPress={handleNewPickupOrder}
          />
        </View>
      </ScreenHeader>

      <View
        className="flex-1 bg-white dark:bg-slate-900 overflow-hidden relative rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
        style={{ margin: responsive.mediumSpacing }}
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
            <Text className="mt-4 text-slate-500">Loading seats...</Text>
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
