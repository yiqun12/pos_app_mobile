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

      {/* Main Content */}
      <View className="flex-1 flex-row">
        {/* Left: Items List */}
        <View className="flex-1 px-4 py-4">
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
              label="Add Item"
              icon="add-circle"
              variant="outline"
              className="mt-4 border-dashed"
              onPress={() => setMenuModalVisible(true)}
            />
          </ScrollView>
        </View>

        {/* Right (or Bottom on small screens): Summary & Actions */}
        {/* For now assuming single column mobile view, so this is bottom fixed */}
      </View>

      {/* Footer Actions */}
      <OrderSummary order={order} />

      <View className="border-t border-slate-200 bg-white p-4 pb-8 dark:border-slate-800 dark:bg-slate-950">
        {/* Action Grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 gap-x-4"
        >
          <Button
            label={serviceFeeEnabled ? "Remove Fee" : "Add Service Fee"}
            size="sm"
            className="mr-3"
            variant={serviceFeeEnabled ? "primary" : "secondary"}
            onPress={() => setServiceFeeEnabled(!serviceFeeEnabled)}
          />
          <Button
            label="Adjust Total"
            size="sm"
            className="mr-3"
            variant="secondary"
            onPress={() => setAdjustmentModalVisible(true)}
          />
          <Button
            label="Print Order"
            size="sm"
            className="mr-3"
            variant="secondary"
            icon="print"
            onPress={() => handlePrint("order")}
          />
          <Button
            label="Unpaid Items"
            size="sm"
            variant="secondary"
            // icon="alert-circle"
            onPress={() => {}}
          />
        </ScrollView>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Print Receipt"
              variant="outline"
              icon="receipt"
              onPress={() => handlePrint("receipt")}
            />
          </View>
          <View className="flex-[2]">
            <Button
              label={`Pay $${(order.total - order.paidAmount).toFixed(2)}`}
              variant={order.status === "paid" ? "secondary" : "primary"}
              disabled={order.status === "paid"}
              // className=""
              icon="card"
              onPress={() => setPaymentModalVisible(true)}
            />
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
