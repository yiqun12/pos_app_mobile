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
import { useModalAction } from "@/hooks/useModalAction"; // 注意检查你的相对路径是否正确
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SeatScreen() {
  const { seatId, openModal } = useLocalSearchParams<{ seatId: string; openModal?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

 // AI 跳转并打开弹窗/执行操作
 // 使用 Hook 集中处理 AI 传来的指令
 useModalAction((modalName) => {
  if (modalName === "menu") setMenuModalVisible(true);
  else if (modalName === "adjustment") setAdjustmentModalVisible(true);
  else if (modalName === "payment") setPaymentModalVisible(true);
  else if (modalName === "serviceFee") setServiceFeeEnabled(true);
  else if (modalName === "printOrder") Alert.alert("Printing...", `Printing order for Seat ${seatId}`);
  else if (modalName === "printReceipt") Alert.alert("Printing...", `Printing receipt for Seat ${seatId}`);
}); 

  // --- State ---
  const [items, setItems] = useState<OrderItem[]>([]);
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  // Modals
  const [priceEditItem, setPriceEditItem] = useState<OrderItem | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

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
      id: `ORD-${seatId}-${Date.now()}`,
      seatId: seatId!,
      items,
      subtotal,
      taxRate,
      taxAmount,
      serviceFee,
      manualAdjustment,
      total,
      status:
        paidAmount >= total
          ? "paid"
          : paidAmount > 0
            ? "partially_paid"
            : "unpaid",
      paidAmount,
      createdAt: Date.now(),
    };
  }, [items, serviceFeeEnabled, manualAdjustment, paidAmount, seatId]);

  // --- Handlers ---

  const handleAddItem = (orderItem: OrderItem) => {
    // The item already comes with all properties from MenuSelectionModal
    setItems((prev) => [...prev, orderItem]);
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

  const handleEditPriceSave = (newPrice: number) => {
    if (priceEditItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === priceEditItem.id
            ? {
                ...item,
                price: newPrice,
                originalPrice: item.originalPrice ?? item.price,
              }
            : item
        )
      );
    }
  };

  const handlePayment = (method: "cash" | "card" | "split", amount: number) => {
    setPaidAmount((prev) => prev + amount);
    // In real app: create payment record
    Alert.alert(
      "Payment Successful",
      `Paid $${amount.toFixed(2)} via ${method}`
    );
  };

  const handlePrint = (type: "order" | "receipt") => {
    Alert.alert("Printing...", `Printing ${type} for Seat ${seatId}`);
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          Seat {seatId} Order
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Options", "Select action", [
              {
                text: "Change Seat",
                onPress: () => console.log("Change Seat"),
              },
              { text: "Mark Unpaid", onPress: () => setPaidAmount(0) },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Content - Responsive Grid */}
      <View className="flex-1 flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
        
        {/* Left: Itemized Receipt */}
        <View className="flex-1 px-4 py-4 md:mr-4 md:bg-transparent">
          <View className="bg-white rounded-xl shadow-sm p-4 h-full dark:bg-slate-900">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Itemized Receipt</Text>
                <Text className="text-sm text-slate-500">{items.length} Items</Text>
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {items.length === 0 ? (
                <View className="items-center justify-center py-20">
                    <Ionicons
                    name="cart-outline"
                    size={64}
                    color={colors.tabIconDefault}
                    />
                    <Text className="mt-4 text-slate-500">
                    No items added to this order yet.
                    </Text>
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

                <Button
                label="Add Items"
                icon="add"
                variant="ghost"
                className="mt-2 border border-dashed border-slate-300 dark:border-slate-700"
                onPress={() => setMenuModalVisible(true)}
                />
            </ScrollView>
          </View>
        </View>

        {/* Right: Summary & Actions */}
        <View className="w-full md:w-[400px] bg-slate-50 dark:bg-slate-950 p-4 pt-0 md:pt-4">
            <OrderSummary order={order} />
            
            {/* Pay Now Button */}
            <View className="mt-6">
                <Button
                    label="Pay Now"
                    variant="primary" // Orange
                    size="lg"
                    icon="card"
                    onPress={() => setPaymentModalVisible(true)}
                    disabled={order.status === "paid"}
                />
            </View>

            {/* Secondary Actions */}
            <View className="flex-row gap-3 mt-4">
                <View className="flex-1">
                    <Button
                        label="Print"
                        variant="outline"
                        icon="print"
                        onPress={() => handlePrint("receipt")}
                    />
                </View>
                <View className="flex-1">
                    <Button
                        label="Split Bill"
                        variant="outline"
                        icon="git-branch"
                        onPress={() => {}}
                    />
                </View>
            </View>
            <View className="mt-3">
                <Button
                    label="Share Order"
                    variant="secondary"
                    icon="share-social"
                    className="bg-slate-800 text-white dark:bg-slate-700"
                    onPress={() => {}}
                />
            </View>

            {/* Customer Loyalty */}
            <View className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                        <Ionicons name="person" size={20} color="#3b82f6" />
                    </View>
                    <View>
                        <Text className="font-bold text-blue-900 dark:text-blue-100 text-xs">CUSTOMER LOYALTY</Text>
                        <Text className="text-blue-600 dark:text-blue-300 text-xs">Add phone or scan card</Text>
                    </View>
                </View>
                <View className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex-row justify-between items-center">
                    <Text className="text-slate-400">Phone Number</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                </View>
            </View>
        </View>
      </View>

      <AdjustmentModal
        visible={adjustmentModalVisible}
        onClose={() => setAdjustmentModalVisible(false)}
        onConfirm={setManualAdjustment}
      />

      <MenuSelectionModal
        visible={menuModalVisible}
        onClose={() => setMenuModalVisible(false)}
        onSelect={handleAddItem}
      />

      {/* Modals */}
      {priceEditItem && (
        <PriceEditModal
          visible={!!priceEditItem}
          initialPrice={priceEditItem.price}
          itemName={priceEditItem.name}
          onClose={() => setPriceEditItem(null)}
          onSave={handleEditPriceSave}
        />
      )}

      <PaymentModal
        visible={paymentModalVisible}
        total={order.total}
        remaining={order.total - order.paidAmount}
        onClose={() => setPaymentModalVisible(false)}
        onPayment={handlePayment}
      />
    </View>
  );
}
