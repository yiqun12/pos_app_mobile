import { EditableSeat, SeatCanvasGrid, SeatsLegend, ViewOnlySeat } from "@/components/seats";
import { AddTableModal } from "@/components/seats/modals/AddTableModal";
import { Button } from "@/components/ui/Button";
import { CurrentStoreBadge } from "@/components/ui/CurrentStoreBadge";
import { ScreenHeader } from "@/components/ui/Header";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useSeats } from "@/hooks/firestore/useSeats";
import { useTableStatus } from "@/hooks/firestore/useTableStatus";
import { saveSeatLayout } from "@/lib/firestore/repositories/store";
import { MOCK_SEATS } from "@/lib/firestore/mocks";
import type { Seat as FsSeat } from "@/lib/firestore/types";
import {
  defaultPlacement,
  generateSeatId,
  getSeatCanvasSize,
  SEAT_CANVAS_BACKGROUND,
  snapSeatPosition,
  stripSeatForEditing,
} from "@/lib/pos/seatLayout";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
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
  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();

  const baseTables: FsSeat[] = useMemo(() => {
    if (layout?.tables && layout.tables.length > 0) return layout.tables;
    if (layoutError && __DEV__) return MOCK_SEATS;
    return [];
  }, [layout, layoutError]);

  const seats: FsSeat[] = useMemo(() => {
    if (!liveStatus) return baseTables;
    const statusByName = new Map(liveStatus.map((s) => [s.name, s]));
    return baseTables.map((seat) => {
      const live = statusByName.get(seat.name);
      return live
        ? { ...seat, status: live.status, itemCount: live.itemCount }
        : seat;
    });
  }, [baseTables, liveStatus]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingSeats, setEditingSeats] = useState<FsSeat[]>([]);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [addTableModalVisible, setAddTableModalVisible] = useState(false);
  const [pendingTableShape, setPendingTableShape] = useState<"rect" | "circle" | null>(null);
  const [saving, setSaving] = useState(false);

  const [containerLayout, setContainerLayout] = useState({
    width: 0,
    height: 0,
  });
  const router = useRouter();
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const isSeatDragging = useSharedValue(false);

  const canvasSize = useMemo(
    () => getSeatCanvasSize(containerLayout.width, containerLayout.height),
    [containerLayout.width, containerLayout.height]
  );

  const displaySeats = isAdminMode ? editingSeats : seats;

  const handleSeatPress = (nextSeatId: string) => {
    if (isAdminMode) {
      setSelectedSeatId(nextSeatId);
      return;
    }
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

  const handleEnterAdminMode = () => {
    setEditingSeats(baseTables.map(stripSeatForEditing));
    setSelectedSeatId(null);
    setIsAdminMode(true);
  };

  const handleDiscardChanges = () => {
    setIsAdminMode(false);
    setEditingSeats([]);
    setSelectedSeatId(null);
  };

  const handleSaveLayout = async () => {
    if (!user || !currentStoreId) return;
    setSaving(true);
    try {
      await saveSeatLayout(
        user.uid,
        currentStoreId,
        { tables: editingSeats },
        layout
      );
      Alert.alert(t("seats.admin.saveSuccess"));
      setIsAdminMode(false);
      setEditingSeats([]);
      setSelectedSeatId(null);
    } catch {
      Alert.alert(t("common.error"), t("seats.admin.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedSeatId) {
      Alert.alert(t("seats.admin.selectTableToDelete"));
      return;
    }
    setEditingSeats((prev) => prev.filter((seat) => seat.id !== selectedSeatId));
    setSelectedSeatId(null);
  };

  const handleUpdatePosition = useCallback((id: string, x: number, y: number) => {
    const snapped = snapSeatPosition(x, y);
    setEditingSeats((prev) =>
      prev.map((seat) => (seat.id === id ? { ...seat, ...snapped } : seat))
    );
  }, []);

  const openAddTableModal = (shape: "rect" | "circle") => {
    setPendingTableShape(shape);
    setAddTableModalVisible(true);
  };

  const handleAddTable = (name: string) => {
    if (!pendingTableShape) return;
    const id = generateSeatId();
    const { x, y } = defaultPlacement(editingSeats.length);
    const nextSeat: FsSeat =
      pendingTableShape === "circle"
        ? {
            id,
            name,
            type: "circle",
            radius: 30,
            x,
            y,
            width: 60,
            height: 60,
          }
        : {
            id,
            name,
            type: "rect",
            x,
            y,
            width: 60,
            height: 60,
          };

    setEditingSeats((prev) => [...prev, nextSeat]);
    setSelectedSeatId(id);
    setAddTableModalVisible(false);
    setPendingTableShape(null);
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isSeatDragging.value) return;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (isSeatDragging.value) return;
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      if (isSeatDragging.value) return;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
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

  const renderToolbar = () => {
    if (isAdminMode) {
      const adminButtonProps = {
        className: "flex-1",
        size: "sm" as const,
        stacked: true,
      };

      return (
        <View
          className="flex-row items-stretch"
          style={{ gap: buttonContainerGap }}
        >
          <Button
            {...adminButtonProps}
            variant="outline"
            label={t("seats.admin.toolbarReset")}
            icon="refresh"
            onPress={handleResetView}
          />
          <Button
            {...adminButtonProps}
            variant="primary"
            label={t("seats.admin.toolbarAdd")}
            icon="square-outline"
            onPress={() => openAddTableModal("rect")}
          />
          <Button
            {...adminButtonProps}
            variant="primary"
            label={t("seats.admin.toolbarAdd")}
            icon="ellipse-outline"
            onPress={() => openAddTableModal("circle")}
          />
          <Button
            {...adminButtonProps}
            variant="danger"
            label={t("seats.admin.toolbarDelete")}
            icon="trash-outline"
            onPress={handleDeleteSelected}
          />
          <Button
            {...adminButtonProps}
            variant="outline"
            label={t("seats.admin.toolbarCancel")}
            icon="close-circle-outline"
            onPress={handleDiscardChanges}
          />
          <Button
            {...adminButtonProps}
            variant="primary"
            label={t("seats.admin.toolbarSave")}
            icon="cloud-upload-outline"
            loading={saving}
            onPress={handleSaveLayout}
          />
        </View>
      );
    }

    return (
      <View
        className="flex-row items-stretch"
        style={{ gap: buttonContainerGap }}
      >
        <Button
          className="flex-1"
          size="sm"
          variant="outline"
          label={t("seats.resetView")}
          icon="refresh"
          onPress={handleResetView}
        />
        <Button
          className="flex-1"
          size="sm"
          variant="primary"
          label={t("seats.pickup")}
          icon="bag-add"
          onPress={handleNewPickupOrder}
        />
        <Button
          className="flex-1"
          size="sm"
          variant="danger"
          label={t("seats.adminMode")}
          icon="person-circle-outline"
          onPress={handleEnterAdminMode}
        />
      </View>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScreenHeader
        title={t("seats.headerTitle")}
        subtitle={t("seats.headerSubtitle")}
        rightElement={<CurrentStoreBadge expanded />}
      >
        {renderToolbar()}
      </ScreenHeader>

      <View
        className="relative m-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
        onLayout={(e) => setContainerLayout(e.nativeEvent.layout)}
      >
        {layoutLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 text-slate-500">{t("seats.loadingSeats")}</Text>
          </View>
        ) : (
          <Animated.View
            style={[
              {
                width: canvasSize.width,
                height: canvasSize.height,
                backgroundColor: SEAT_CANVAS_BACKGROUND,
              },
              animatedCanvasStyle,
            ]}
          >
            <GestureDetector gesture={pinchGesture}>
              <View
                style={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
              >
                <GestureDetector gesture={panGesture}>
                  <View style={StyleSheet.absoluteFill}>
                    {containerLayout.width > 0 && (
                      <SeatCanvasGrid width={canvasSize.width} height={canvasSize.height} />
                    )}
                  </View>
                </GestureDetector>
                {containerLayout.width > 0 &&
                  displaySeats.map((seat) =>
                    isAdminMode ? (
                      <EditableSeat
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatId === seat.id}
                        onUpdatePosition={handleUpdatePosition}
                        onSelect={handleSeatPress}
                        containerWidth={canvasSize.width}
                        containerHeight={canvasSize.height}
                        isSeatDragging={isSeatDragging}
                      />
                    ) : (
                      <ViewOnlySeat
                        key={seat.id}
                        seat={{ ...seat, status: seat.status ?? "vacant" }}
                        onPress={handleSeatPress}
                      />
                    )
                  )}
              </View>
            </GestureDetector>
          </Animated.View>
        )}
      </View>
      <SeatsLegend />
      <AddTableModal
        visible={addTableModalVisible}
        existingNames={editingSeats.map((seat) => seat.name)}
        onClose={() => {
          setAddTableModalVisible(false);
          setPendingTableShape(null);
        }}
        onAdd={handleAddTable}
      />
    </GestureHandlerRootView>
  );
}
