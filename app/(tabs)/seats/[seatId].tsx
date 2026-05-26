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
import { useModalAction } from "@/hooks/useModalAction";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/auth";
import { useStoreSelection } from "@/context/store";
import { useStore } from "@/hooks/firestore/useStore";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export default function SeatScreen() {
  const { seatId } = useLocalSearchParams<{ seatId: string; openModal?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(false);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [priceEditItem, setPriceEditItem] = useState<OrderItem | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Find the tableName matching the seatId
  const tableName = useMemo(() => {
    if (!store?.seatLayout?.tables) return seatId;
    const seatObj = store.seatLayout.tables.find((t) => t.id === seatId);
    return seatObj ? seatObj.name : seatId;
  }, [store, seatId]);

  // Firestore listener
  useEffect(() => {
    if (!user || !currentStoreId || !tableName) return;

    const docId = `${currentStoreId}-${tableName}`;
    const docRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "Table", docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.product) {
          try {
            const parsed = JSON.parse(data.product);
            if (Array.isArray(parsed)) {
              setRawProducts(parsed);
              
              const uiItems: OrderItem[] = parsed.map((item: any) => {
                const priceVal = item.subtotal ?? item.price;
                const price = typeof priceVal === "number" ? priceVal : parseFloat(priceVal || "0");
                return {
                  id: item.count ? String(item.count) : (item.id || `item-${Date.now()}-${Math.random()}`),
                  name: item.name || "Untitled",
                  price: price,
                  quantity: typeof item.quantity === "number" ? item.quantity : 1,
                  count: item.count,
                } as OrderItem;
              });
              setItems(uiItems);
              return;
            }
          } catch (e) {
            console.error("Error parsing table product:", e);
          }
        }
      }
      setRawProducts([]);
      setItems([]);
    }, (error) => {
      console.error("Error listening to table updates:", error);
    });

    return () => unsubscribe();
  }, [user, currentStoreId, tableName]);

  // Save updates helper
  const saveToFirestore = async (newRawProducts: any[]) => {
    if (!user || !currentStoreId || !tableName) return;
    const docId = `${currentStoreId}-${tableName}`;
    const docRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "Table", docId);
    
    const dateTime = new Date().toISOString();
    const dateStr = dateTime.slice(0, 10) + '-' + dateTime.slice(11, 13) + '-' + dateTime.slice(14, 16) + '-' + dateTime.slice(17, 19) + '-' + dateTime.slice(20, 22);
    
    const docData = {
      product: JSON.stringify(newRawProducts),
      date: dateStr
    };
    
    try {
      await setDoc(docRef, docData);
    } catch (e) {
      console.error("Error writing to Table collection:", e);
      Alert.alert(t("common.error"), "Failed to update table in database");
    }
  };

  useModalAction((modalName) => {
    if (modalName === "menu") setMenuModalVisible(true);
    else if (modalName === "adjustment") setAdjustmentModalVisible(true);
    else if (modalName === "payment") setPaymentModalVisible(true);
    else if (modalName === "serviceFee") setServiceFeeEnabled(true);
    else if (modalName === "printOrder") {
      Alert.alert(
        t("seats.printing"),
        t("seats.printingOrderForSeat", { seatId: seatId ?? "-" })
      );
    } else if (modalName === "printReceipt") {
      Alert.alert(
        t("seats.printing"),
        t("seats.printingReceiptForSeat", { seatId: seatId ?? "-" })
      );
    }
  });

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

  const handleAddItem = (orderItem: OrderItem) => {
    const menuItems = store?.menu?.items || [];
    const menuItem = menuItems.find((i) => i.name === orderItem.name);
    const menuItemId = menuItem ? menuItem.id : orderItem.id;
    
    const existingIndex = rawProducts.findIndex((p) => p.name === orderItem.name);
    let newRaw: any[];
    if (existingIndex > -1) {
      newRaw = [...rawProducts];
      const existing = newRaw[existingIndex];
      const newQty = existing.quantity + 1;
      const basePrice = parseFloat(existing.subtotal || "0");
      newRaw[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemTotalPrice: parseFloat((basePrice * newQty).toFixed(2))
      };
    } else {
      const basePrice = orderItem.price;
      const newProduct = {
        id: menuItemId,
        name: orderItem.name,
        subtotal: basePrice.toFixed(2),
        quantity: 1,
        itemTotalPrice: basePrice,
        count: Date.now() + Math.floor(Math.random() * 1000),
        attributeSelected: {},
        attributesArr: [],
        CHI: (menuItem as any)?.CHI || "",
      };
      newRaw = [newProduct, ...rawProducts];
    }
    saveToFirestore(newRaw);
  };

  const handleIncrement = (id: string) => {
    const newRaw = rawProducts.map((p) => {
      if (String(p.count) === id) {
        const newQty = p.quantity + 1;
        const basePrice = parseFloat(p.subtotal || "0");
        return {
          ...p,
          quantity: newQty,
          itemTotalPrice: parseFloat((basePrice * newQty).toFixed(2))
        };
      }
      return p;
    });
    saveToFirestore(newRaw);
  };

  const handleDecrement = (id: string) => {
    const newRaw = rawProducts.map((p) => {
      if (String(p.count) === id) {
        const newQty = p.quantity - 1;
        if (newQty <= 0) return null;
        const basePrice = parseFloat(p.subtotal || "0");
        return {
          ...p,
          quantity: newQty,
          itemTotalPrice: parseFloat((basePrice * newQty).toFixed(2))
        };
      }
      return p;
    }).filter(Boolean);
    saveToFirestore(newRaw);
  };

  const handleEditPriceSave = (newPrice: number) => {
    if (priceEditItem) {
      const newRaw = rawProducts.map((p) => {
        if (String(p.count) === priceEditItem.id) {
          return {
            ...p,
            subtotal: newPrice.toFixed(2),
            itemTotalPrice: parseFloat((newPrice * p.quantity).toFixed(2)),
          };
        }
        return p;
      });
      saveToFirestore(newRaw);
    }
  };

  const handlePayment = (method: "cash" | "card" | "split", amount: number) => {
    setPaidAmount((prev) => prev + amount);
    Alert.alert(
      t("seats.paymentSuccessful"),
      t("seats.paidViaMethod", { amount: amount.toFixed(2), method })
    );
  };

  const handlePrint = (type: "order" | "receipt") => {
    Alert.alert(
      t("seats.printing"),
      t("seats.printingTypeForSeat", { type, seatId: seatId ?? "-" })
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          {t("seats.seatOrder", { seatId: seatId ?? "-" })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              t("seats.options"),
              t("seats.selectAction"),
              [
                {
                  text: t("seats.changeSeat"),
                  onPress: () => console.log("Change Seat"),
                },
                { text: t("seats.markUnpaid"), onPress: () => setPaidAmount(0) },
                { text: t("common.cancel"), style: "cancel" },
              ]
            );
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 flex-col bg-slate-50 dark:bg-slate-950 md:flex-row">
        <View className="flex-1 px-4 py-4 md:mr-4 md:bg-transparent">
          <View className="h-full rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {t("seats.itemizedReceipt")}
              </Text>
              <Text className="text-sm text-slate-500">
                {t("seats.itemsCount", { count: items.length })}
              </Text>
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
                    {t("seats.noItemsInOrder")}
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
                label={t("seats.addItems")}
                icon="add"
                variant="ghost"
                className="mt-2 border border-dashed border-slate-300 dark:border-slate-700"
                onPress={() => setMenuModalVisible(true)}
              />
            </ScrollView>
          </View>
        </View>

        <View className="w-full bg-slate-50 p-4 pt-0 dark:bg-slate-950 md:w-[400px] md:pt-4">
          <OrderSummary order={order} />

          <View className="mt-6">
            <Button
              label={t("seats.payNow")}
              variant="primary"
              size="lg"
              icon="card"
              onPress={() => setPaymentModalVisible(true)}
              disabled={order.status === "paid"}
            />
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button
                label={t("seats.print")}
                variant="outline"
                icon="print"
                onPress={() => handlePrint("receipt")}
              />
            </View>
            <View className="flex-1">
              <Button
                label={t("seats.splitBill")}
                variant="outline"
                icon="git-branch"
                onPress={() => {}}
              />
            </View>
          </View>
          <View className="mt-3">
            <Button
              label={t("seats.shareOrder")}
              variant="secondary"
              icon="share-social"
              className="bg-slate-800 text-white dark:bg-slate-700"
              onPress={() => {}}
            />
          </View>

          <View className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="person" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-xs font-bold text-blue-900 dark:text-blue-100">
                  {t("seats.customerLoyalty")}
                </Text>
                <Text className="text-xs text-blue-600 dark:text-blue-300">
                  {t("seats.addPhoneOrScanCard")}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-slate-900">
              <Text className="text-slate-400">{t("seats.phoneNumber")}</Text>
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
