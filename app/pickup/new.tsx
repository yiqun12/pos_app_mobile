import { MenuSelectionModal } from "@/components/menu/modals/MenuSelectionModal";
import { AdjustmentModal } from "@/components/seats/modals/AdjustmentModal";
import { PaymentModal } from "@/components/seats/modals/PaymentModal";
import { PriceEditModal } from "@/components/seats/modals/PriceEditModal";
import { OrderItemRow } from "@/components/seats/order/OrderItemRow";
import { OrderSummary } from "@/components/seats/order/OrderSummary";
import { Order, OrderItem } from "@/components/seats/types";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewPickupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // --- State ---
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Modals
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [priceEditItem, setPriceEditItem] = useState<OrderItem | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);

  // --- Calculations ---
  const order = useMemo<Order>(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.08875;
    const taxAmount = subtotal * taxRate;
    const serviceFee = serviceFeeEnabled ? subtotal * 0.18 : 0;
    const total = subtotal + taxAmount + serviceFee + manualAdjustment;

    return {
      id: `PU-${Date.now()}`, // PU for Pickup
      seatId: "pickup", // Placeholder
      items,
      subtotal,
      taxRate,
      taxAmount,
      serviceFee,
      manualAdjustment,
      total,
      status: paidAmount >= total ? "paid" : "unpaid",
      paidAmount,
      createdAt: Date.now(),
    };
  }, [items, serviceFeeEnabled, manualAdjustment, paidAmount]);

  // --- Handlers ---
  const handleAddItem = (menuItem: any) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      originalPrice: menuItem.price,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleIncrement = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handlePayment = (method: string, amount: number) => {
    setPaidAmount((prev) => prev + amount);
    Alert.alert("Success", `Received $${amount.toFixed(2)} via ${method}`);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-950"
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-1">
        {/* Helper Modals */}
        <MenuSelectionModal
          visible={menuModalVisible}
          onClose={() => setMenuModalVisible(false)}
          onSelect={(item) => {
            handleAddItem(item);
            setMenuModalVisible(false);
          }}
        />
        <AdjustmentModal
          visible={adjustmentModalVisible}
          onClose={() => setAdjustmentModalVisible(false)}
          // currentAdjustment={manualAdjustment}
          // serviceFeeEnabled={serviceFeeEnabled}
          onConfirm={(adjustment) => {
            setManualAdjustment(adjustment);
            setAdjustmentModalVisible(false);
          }}
        />
        <PaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          total={order.total}
          remaining={order.total - paidAmount}
          onPayment={handlePayment}
        />
        <PriceEditModal
          visible={!!priceEditItem}
          onClose={() => setPriceEditItem(null)}
          itemName={priceEditItem ? priceEditItem.name : ""}
          initialPrice={priceEditItem ? priceEditItem.price : 0}
          onSave={(newPrice) => {
            if (priceEditItem) {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === priceEditItem.id ? { ...i, price: newPrice } : i
                )
              );
              setPriceEditItem(null);
            }
          }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-white">
            DoorDash Pickup
          </Text>
          <View className="w-10" />
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-4 py-4">
          {/* Customer Info Input */}
          <View className="mb-4">
            <Text className="mb-2 font-medium text-slate-700 dark:text-slate-300">
              Customer Name / ID
            </Text>
            <TextInput
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="e.g. John D. or #4492"
              placeholderTextColor="#94a3b8"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>

          {/* Items List */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                Items
              </Text>
              <Button
                label="Add Item"
                size="sm"
                onPress={() => setMenuModalVisible(true)}
                icon="add"
              />
            </View>

            {items.length === 0 ? (
              <View className="items-center justify-center rounded-xl border border-dashed border-slate-300 py-8 dark:border-slate-700">
                <Text className="text-slate-500">No items added yet</Text>
              </View>
            ) : (
              items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onPress={setPriceEditItem}
                />
              ))
            )}
          </View>

          {/* Summary & Adjustments */}
          <View className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <OrderSummary order={order} />
            <TouchableOpacity
              onPress={() => setAdjustmentModalVisible(true)}
              className="mt-4 flex-row items-center justify-center"
            >
              <Ionicons name="options" size={20} color={colors.tint} />
              <Text className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                Adjustments & Fees
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
          <View className="flex-row gap-3">
            <Button
              label="Complete Order"
              variant="outline"
              className="flex-1"
              onPress={() => {
                Alert.alert("Order Completed", "Pickup order saved.");
                router.back();
              }}
            />
            <Button
              label={`Pay $${(order.total - paidAmount).toFixed(2)}`}
              className="flex-[2]"
              onPress={() => setPaymentModalVisible(true)}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
