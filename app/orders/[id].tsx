import {
  Order,
  OrderDetailContent,
} from "@/components/revenue/OrderDetailModal";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data generator for demo purposes
const getMockOrder = (id: string): Order => {
  return {
    id: id,
    guest: "Table 5",
    time: "Just now",
    amount: 48.5,
    channel: "Dine-In",
    items: [
      {
        name: "Kung Pao Chicken",
        quantity: 1,
        price: 18.5,
        total: 18.5,
      },
      {
        name: "Mapo Tofu",
        quantity: 1,
        price: 14.0,
        total: 14.0,
      },
      {
        name: "Steamed Rice",
        quantity: 2,
        price: 2.0,
        total: 4.0,
      },
      {
        name: "Spring Rolls",
        quantity: 1,
        price: 6.0,
        total: 6.0,
      },
    ],
    subtotal: 42.5,
    serviceFee: 0,
    tax: 6.0,
    gratuity: 0,
    total: 48.5,
  };
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setOrder(getMockOrder(id));
    }
  }, [id]);

  const handlePay = () => {
    Alert.alert("Success", "Payment processed successfully", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <OrderDetailContent
        order={order}
        colors={colors}
        onClose={() => router.back()}
        onPay={handlePay}
      />
    </SafeAreaView>
  );
}
