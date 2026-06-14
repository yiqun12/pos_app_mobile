import { ItemOptionsModal } from "@/components/menu/modals/ItemOptionsModal";
import { MenuSelectionModal } from "@/components/menu/modals/MenuSelectionModal";
import { AdjustmentModal } from "@/components/seats/modals/AdjustmentModal";
import { CashPaymentModal } from "@/components/seats/modals/CashPaymentModal";
import { PaymentModal } from "@/components/seats/modals/PaymentModal";
import { ServiceFeeModal } from "@/components/seats/modals/ServiceFeeModal";
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
import { useMenu } from "@/context/menu";
import { useStoreSelection } from "@/context/store";
import { useStore } from "@/hooks/firestore/useStore";
import { db, functions } from "@/lib/firebase";
import {
  calculateWebOrderTotals,
  applyTargetTotalAdjustment,
  applyCustomPriceReviseToProduct,
  buildEditedWebCartItem,
  buildCashPaymentBreakdown,
  cartItemToEditableSelections,
  cartItemSignature,
  cleanProductData,
  createWebCartItem,
  diffKitchenChanges,
  getCartProductKey,
  getProductsSubtotal,
  getSurchargeTotal,
  isSurchargeCartItem,
} from "@/lib/pos/orderTransforms";
import { formatWebDate } from "@/lib/pos/webDate";
import type { MenuItem } from "@/types/menu";
import { httpsCallable } from "firebase/functions";
import { addDoc, collection, doc, onSnapshot, setDoc } from "firebase/firestore";

export default function SeatScreen() {
  const { seatId } = useLocalSearchParams<{ seatId: string; openModal?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();
  const { items: menuItems, globalCustomizations } = useMenu();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [sentProducts, setSentProducts] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);
  const [serviceFeeAmount, setServiceFeeAmount] = useState(0);
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [taxExempt, setTaxExempt] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);

  const [optionEditContext, setOptionEditContext] = useState<{
    orderItem: OrderItem;
    rawProduct: any;
    menuItem: MenuItem;
  } | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cashPaymentModalVisible, setCashPaymentModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [serviceFeeModalVisible, setServiceFeeModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  const availableMenuItems = useMemo(
    () => (menuItems.length > 0 ? menuItems : ((store?.menu?.items ?? []) as MenuItem[])),
    [menuItems, store?.menu?.items]
  );

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
              if (parsed.length === 0) {
                setPaidAmount(0);
                setManualAdjustment(0);
                setTipAmount(0);
                setTaxExempt(false);
                setServiceFeeAmount(0);
              }
              
              const uiItems: OrderItem[] = parsed.map((item: any) => {
                const priceVal = item.subtotal ?? item.price;
                const price = typeof priceVal === "number" ? priceVal : parseFloat(priceVal || "0");
                const count = item.count;
                const menuItem = availableMenuItems.find((menuItem) => menuItem.id === item.id);
                const editableSelections = cartItemToEditableSelections({
                  product: item,
                  menuItem,
                  globalCustomizations,
                });
                return {
                  id: getCartProductKey(item),
                  menuItemId: item.id,
                  name: item.CHI && item.CHI !== item.name ? `${item.name} / ${item.CHI}` : (item.name || "Untitled"),
                  rawName: item.name,
                  nameCN: item.CHI,
                  price,
                  quantity: typeof item.quantity === "number" ? item.quantity : 1,
                  count,
                  imageUrl: item.image,
                  attributesArr: item.attributesArr,
                  attributeSelected: item.attributeSelected,
                  selectedOptions: editableSelections.selectedOptions.length > 0
                    ? editableSelections.selectedOptions
                    : undefined,
                  selectedIngredients: editableSelections.selectedIngredients.length > 0
                    ? editableSelections.selectedIngredients
                    : undefined,
                  selectedGlobalCustomizations: editableSelections.selectedGlobalCustomizations.length > 0
                    ? editableSelections.selectedGlobalCustomizations
                    : undefined,
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
      setPaidAmount(0);
      setManualAdjustment(0);
      setTipAmount(0);
      setTaxExempt(false);
      setServiceFeeAmount(0);
    }, (error) => {
      console.error("Error listening to table updates:", error);
    });

    return () => unsubscribe();
  }, [user, currentStoreId, tableName, availableMenuItems, globalCustomizations]);

  useEffect(() => {
    if (!user || !currentStoreId) return;

    const terminalsRef = collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "terminals");
    const unsubscribe = onSnapshot(terminalsRef, (snapshot) => {
      const nextTerminals = snapshot.docs
        .map((terminal) => ({ id: terminal.id, ...terminal.data() }))
        .sort((a: any, b: any) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
      setTerminals(nextTerminals);
    }, (error) => {
      console.error("Error listening to terminals:", error);
    });

    return () => unsubscribe();
  }, [user, currentStoreId]);

  useEffect(() => {
    if (!user || !currentStoreId || !tableName) return;

    const tableDocId = `${currentStoreId}-${tableName}`;
    const sentRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "TableIsSent", `${tableDocId}-isSent`);
    const unsubscribe = onSnapshot(sentRef, (docSnap) => {
      if (!docSnap.exists()) {
        setSentProducts([]);
        return;
      }
      const product = docSnap.data().product;
      if (typeof product !== "string" || product.length === 0) {
        setSentProducts([]);
        return;
      }
      try {
        const parsed = JSON.parse(product);
        setSentProducts(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSentProducts([]);
      }
    }, (error) => {
      console.error("Error listening to TableIsSent:", error);
    });

    return () => unsubscribe();
  }, [user, currentStoreId, tableName]);

  // Save updates helper
  const saveToFirestore = async (newRawProducts: any[]) => {
    if (!user || !currentStoreId || !tableName) return;
    const docId = `${currentStoreId}-${tableName}`;
    const docRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "Table", docId);
    
    const dateStr = formatWebDate();
    
    const docData = {
      product: JSON.stringify(newRawProducts),
      date: dateStr
    };
    
    try {
      await setDoc(docRef, docData, { merge: true });
    } catch (e) {
      console.error("Error writing to Table collection:", e);
      Alert.alert(t("common.error"), "Failed to update table in database");
    }
  };

  const clearTableInFirestore = async () => {
    if (!user || !currentStoreId || !tableName) return;
    const tableDocId = `${currentStoreId}-${tableName}`;
    const tableRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "Table", tableDocId);
    const sentRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "TableIsSent", `${tableDocId}-isSent`);
    const dateStr = formatWebDate();

    await Promise.all([
      setDoc(tableRef, { product: "[]", date: dateStr }, { merge: true }),
      setDoc(sentRef, { product: "[]", date: dateStr }, { merge: true }),
    ]);
  };

  const writeCashSuccessPayment = async (baseAmount: number, currentOrder: Order, extraTip = 0) => {
    if (!user || !currentStoreId || !store || !tableName) return;
    const dateStr = formatWebDate();
    const discount = currentOrder.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0);
    const paymentRatio = currentOrder.total > 0 ? Math.min(1, baseAmount / currentOrder.total) : 1;
    const paymentTotal = baseAmount + extraTip;

    await addDoc(
      collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment"),
      {
        amount: Math.round(paymentTotal * 100),
        amount_capturable: 0,
        amount_details: { tip: { amount: 0 } },
        amount_received: Math.round(paymentTotal * 100),
        application: "",
        application_fee_amount: 0,
        automatic_payment_methods: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: "automatic",
        client_secret: "pi_none",
        confirmation_method: "automatic",
        created: 0,
        currency: "usd",
        customer: null,
        dateTime: dateStr,
        description: null,
        id: "pi_none",
        invoice: null,
        last_payment_error: null,
        latest_charge: "ch_none",
        livemode: true,
        metadata: {
          discount: Number((discount * paymentRatio).toFixed(2)),
          isDine: true,
          service_fee: Number((currentOrder.serviceFee * paymentRatio).toFixed(2)),
          subtotal: Number(((currentOrder.taxableSubtotal ?? currentOrder.subtotal) * paymentRatio).toFixed(2)),
          tax: Number((currentOrder.taxAmount * paymentRatio).toFixed(2)),
          tips: Number((tipAmount * paymentRatio + extraTip).toFixed(2)),
          total: Number(paymentTotal.toFixed(2)),
        },
        next_action: null,
        object: "payment_intent",
        on_behalf_of: null,
        payment_method: "pm_none",
        payment_method_configuration_details: null,
        payment_method_options: {},
        card_present: {},
        request_extended_authorization: false,
        request_incremental_authorization_support: false,
        payment_method_types: ["Paid_by_Cash"],
        powerBy: "Paid by Cash",
        processing: null,
        receiptData: JSON.stringify(cleanProductData(rawProducts)),
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: "succeeded",
        store: currentStoreId,
        storeOwnerId: user.uid,
        stripe_store_acct: store.stripeStoreAcct ?? "",
        tableNum: tableName,
        transfer_data: null,
        transfer_group: null,
        uid: user.uid,
        user_email: user.email,
      }
    );
  };

  const writeUnpaidSuccessPayment = async (currentOrder: Order) => {
    if (!user || !currentStoreId || !store || !tableName) return;
    const dateStr = formatWebDate();
    const discount = currentOrder.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0);

    await addDoc(
      collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "success_payment"),
      {
        amount: Math.round(currentOrder.total * 100),
        amount_capturable: 0,
        amount_details: { tip: { amount: 0 } },
        amount_received: Math.round(currentOrder.total * 100),
        application: "",
        application_fee_amount: 0,
        automatic_payment_methods: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: "automatic",
        client_secret: "pi_none",
        confirmation_method: "automatic",
        created: 0,
        currency: "usd",
        customer: null,
        dateTime: dateStr,
        description: null,
        id: "pi_none",
        invoice: null,
        last_payment_error: null,
        latest_charge: "ch_none",
        livemode: true,
        metadata: {
          discount,
          isDine: true,
          service_fee: currentOrder.serviceFee,
          subtotal: currentOrder.taxableSubtotal ?? currentOrder.subtotal,
          tax: currentOrder.taxAmount,
          tips: tipAmount,
          total: currentOrder.total,
        },
        next_action: null,
        object: "payment_intent",
        on_behalf_of: null,
        payment_method: "pm_none",
        payment_method_configuration_details: null,
        payment_method_options: {},
        card_present: {},
        request_extended_authorization: false,
        request_incremental_authorization_support: false,
        payment_method_types: ["Mark_as_Unpaid"],
        powerBy: "Unpaid",
        processing: null,
        receiptData: JSON.stringify(cleanProductData(rawProducts)),
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: "succeeded",
        store: currentStoreId,
        storeOwnerId: user.uid,
        stripe_store_acct: store.stripeStoreAcct ?? "",
        tableNum: tableName,
        transfer_data: null,
        transfer_group: null,
        uid: user.uid,
        user_email: user.email,
      }
    );
  };

  const writeStoreEvent = async (
    collectionName:
      | "SendToKitchen"
      | "DeletedSendToKitchen"
      | "MerchantReceipt"
      | "CustomerReceipt"
      | "OpenCashDraw"
      | "listOrder",
    data: Record<string, unknown>
  ) => {
    if (!user || !currentStoreId || !tableName) return;
    await addDoc(
      collection(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, collectionName),
      data
    );
  };

  const writeKitchenEvents = async () => {
    if (!user || !currentStoreId || !tableName) return;
    const { added, deleted } = diffKitchenChanges(sentProducts, rawProducts);
    const date = formatWebDate();
    const cleanedAdded = cleanProductData(added);
    const cleanedDeleted = cleanProductData(deleted);
    const writes: Promise<unknown>[] = [];

    if (cleanedAdded.length > 0) {
      writes.push(writeStoreEvent("SendToKitchen", {
        date,
        data: cleanedAdded,
        selectedTable: tableName,
      }));
      writes.push(writeStoreEvent("listOrder", {
        date,
        data: cleanedAdded,
        selectedTable: tableName,
        discount: order.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0),
        service_fee: order.serviceFee,
        total: order.total,
      }));
    }

    if (cleanedDeleted.length > 0) {
      writes.push(writeStoreEvent("DeletedSendToKitchen", {
        date,
        data: cleanedDeleted,
        selectedTable: tableName,
      }));
    }

    const tableDocId = `${currentStoreId}-${tableName}`;
    const sentRef = doc(db, "stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId, "TableIsSent", `${tableDocId}-isSent`);
    writes.push(setDoc(sentRef, { product: JSON.stringify(rawProducts), date }, { merge: true }));

    await Promise.all(writes);
    Alert.alert("Kitchen", cleanedAdded.length || cleanedDeleted.length ? "Order sent to kitchen" : "No kitchen changes to send");
  };

  const writeReceiptEvents = async () => {
    const date = formatWebDate();
    const data = cleanProductData(rawProducts);
    const payload = {
      date,
      data,
      selectedTable: tableName,
      discount: order.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0),
      service_fee: order.serviceFee,
      total: order.total,
    };

    await Promise.all([
      writeStoreEvent("MerchantReceipt", payload),
      writeStoreEvent("CustomerReceipt", payload),
    ]);
    Alert.alert(t("seats.printing"), t("seats.printingTypeForSeat", { type: "receipt", seatId: seatId ?? "-" }));
  };

  const writeOpenCashDrawerEvent = async () => {
    await writeStoreEvent("OpenCashDraw", {
      date: formatWebDate(),
      data: cleanProductData(rawProducts),
      selectedTable: tableName,
    });
  };

  const requestTerminalPayment = async (amount: number) => {
    if (!user || !currentStoreId || !store || !tableName) return;
    if (!store.stripeStoreAcct) {
      Alert.alert(t("common.error"), "Stripe is not connected for this store");
      return;
    }

    const terminal = terminals[0];
    const readerId = terminal?.readerId ?? terminal?.reader_id;
    if (!readerId) {
      Alert.alert(t("common.error"), "No available card terminal for this store");
      return;
    }

    const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
    const processPayment = httpsCallable(functions, "processPayment");
    const discount = order.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0);
    const intentResponse: any = await createPaymentIntent({
      amount: Math.round(amount * 100),
      connected_stripe_account_id: store.stripeStoreAcct,
      receipt_JSON: JSON.stringify(cleanProductData(rawProducts)),
      storeID: currentStoreId,
      selectedTable: tableName,
      uid: user.uid,
      user_email: user.email,
      discount,
      service_fee: order.serviceFee,
    });
    const paymentIntentId = intentResponse.data?.id;
    if (!paymentIntentId) throw new Error("createPaymentIntent did not return an id");

    await processPayment({
      reader_id: readerId,
      payment_intent_id: paymentIntentId,
      connected_stripe_account_id: store.stripeStoreAcct,
      amount: Math.round(amount * 100),
    });
    Alert.alert("Card payment", "Payment sent to terminal. Waiting for terminal confirmation.");
  };

  useModalAction((modalName) => {
    if (modalName === "menu") setMenuModalVisible(true);
    else if (modalName === "adjustment") setAdjustmentModalVisible(true);
    else if (modalName === "payment") setPaymentModalVisible(true);
    else if (modalName === "serviceFee") setServiceFeeModalVisible(true);
    else if (modalName === "printOrder") {
      void handlePrint("order");
    } else if (modalName === "printReceipt") {
      void handlePrint("receipt");
    }
  });

  const order = useMemo<Order>(() => {
    const itemsSubtotal = getProductsSubtotal(rawProducts, { includeSurcharge: false });
    const taxRate = store?.taxRate ?? 0;
    const discount = manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0;
    const surcharge = getSurchargeTotal(rawProducts);
    const totals = calculateWebOrderTotals({
      itemsSubtotal,
      taxRate,
      discount,
      surcharge,
      serviceFee: serviceFeeAmount,
      tip: tipAmount,
      taxExempt,
    });

    return {
      id: `ORD-${seatId}-${Date.now()}`,
      seatId: seatId!,
      items,
      subtotal: totals.subtotal,
      taxableSubtotal: totals.taxableSubtotal,
      taxRate: taxRate / 100,
      taxAmount: totals.tax,
      serviceFee: totals.serviceFee,
      manualAdjustment,
      discount: totals.totalDiscount,
      surcharge: totals.surcharge,
      taxExempt,
      total: totals.total,
      status:
        paidAmount >= totals.total
          ? "paid"
          : paidAmount > 0
            ? "partially_paid"
            : "unpaid",
      paidAmount,
      createdAt: Date.now(),
    };
  }, [items, rawProducts, serviceFeeAmount, manualAdjustment, paidAmount, seatId, store?.taxRate, taxExempt, tipAmount]);

  const handleAddItem = (orderItem: OrderItem) => {
    const menuItem = availableMenuItems.find((i) => i.id === orderItem.menuItemId);
    const newProduct = createWebCartItem({
      orderItem,
      menuItem,
      count: Date.now() + Math.floor(Math.random() * 1000),
    });
    const newSignature = cartItemSignature(newProduct);
    const existingIndex = rawProducts.findIndex((p) => cartItemSignature({
      id: p.id,
      attributeSelected: p.attributeSelected ?? {},
    }) === newSignature);
    let newRaw: any[];
    if (existingIndex > -1) {
      newRaw = [...rawProducts];
      const existing = newRaw[existingIndex];
      const newQty = (existing.quantity ?? 1) + 1;
      const basePrice = parseFloat(existing.subtotal || "0");
      newRaw[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemTotalPrice: parseFloat((basePrice * newQty).toFixed(2))
      };
    } else {
      newRaw = [newProduct, ...rawProducts];
    }
    saveToFirestore(newRaw);
  };

  const handleIncrement = (id: string) => {
    const newRaw = rawProducts.map((p) => {
      if (isSurchargeCartItem(p)) return p;
      if (String(p.count) === id) {
        const newQty = (p.quantity ?? 1) + 1;
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
      if (isSurchargeCartItem(p)) return p;
      if (String(p.count) === id) {
        const newQty = (p.quantity ?? 1) - 1;
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

  const findRawProductForOrderItem = (orderItem: OrderItem) =>
    rawProducts.find((product) => getCartProductKey(product) === orderItem.id);

  const handleOpenOptionsEdit = (orderItem: OrderItem) => {
    const rawProduct = findRawProductForOrderItem(orderItem);
    if (!rawProduct) {
      Alert.alert(t("common.error"), "Unable to find this item in the current table order.");
      return;
    }

    const menuItem = availableMenuItems.find((item) => item.id === rawProduct.id);
    if (!menuItem) {
      Alert.alert(t("common.error"), "Unable to find this item in the current menu.");
      return;
    }

    setOptionEditContext({
      orderItem,
      rawProduct,
      menuItem: {
        ...menuItem,
        attributesArr: {
          ...(menuItem.attributesArr ?? {}),
          ...(rawProduct.attributesArr ?? {}),
        },
      },
    });
  };

  const handleOrderItemPress = (orderItem: OrderItem) => {
    if (orderItem.menuItemId === "SURCHARGE_ITEM") return;
    handleOpenOptionsEdit(orderItem);
  };

  const handleOptionsEditSave = (
    selectedOptions: NonNullable<OrderItem["selectedOptions"]>,
    selectedIngredients: NonNullable<OrderItem["selectedIngredients"]>,
    selectedGlobalCustomizations?: NonNullable<OrderItem["selectedGlobalCustomizations"]>
  ) => {
    if (!optionEditContext) return;

    const newRaw = rawProducts.map((product) => {
      if (getCartProductKey(product) !== optionEditContext.orderItem.id) return product;
      return buildEditedWebCartItem({
        product,
        menuItem: optionEditContext.menuItem,
        selectedOptions,
        selectedIngredients,
        selectedGlobalCustomizations: selectedGlobalCustomizations ?? [],
      });
    });

    void saveToFirestore(newRaw);
    setOptionEditContext(null);
  };

  const handleOptionEditCustomPriceChange = ({
    reason,
    amount,
    increase,
  }: {
    reason: string;
    amount: number;
    increase: boolean;
  }) => {
    if (!optionEditContext) return false;

    try {
      let nextRawProduct: any | null = null;
      const newRaw = rawProducts.map((product) => {
        if (getCartProductKey(product) !== optionEditContext.orderItem.id) return product;
        nextRawProduct = applyCustomPriceReviseToProduct({
          product,
          reason,
          amount,
          increase,
        });
        return nextRawProduct;
      });

      if (!nextRawProduct) {
        Alert.alert(t("common.error"), "Unable to update this item in the current table order.");
        return false;
      }

      setOptionEditContext((current) => current
        ? {
            ...current,
            rawProduct: nextRawProduct,
            menuItem: {
              ...current.menuItem,
              attributesArr: {
                ...(current.menuItem.attributesArr ?? {}),
                ...(nextRawProduct?.attributesArr ?? {}),
              },
            },
          }
        : current
      );
      void saveToFirestore(newRaw);
      return true;
    } catch (error) {
      Alert.alert(
        t("common.error"),
        error instanceof Error ? error.message : "Failed to update custom price"
      );
      return false;
    }
  };

  const handleAdjustTotal = (amountDifference: number, nextTaxExempt = taxExempt) => {
    const baseSubtotal = getProductsSubtotal(rawProducts, { includeSurcharge: false });
    const result = applyTargetTotalAdjustment({
      products: rawProducts,
      targetSubtotal: baseSubtotal + amountDifference,
      taxRate: store?.taxRate ?? 0,
      taxExempt: nextTaxExempt,
      count: Date.now(),
    });

    setManualAdjustment(result.manualAdjustment);
    setTaxExempt(nextTaxExempt);
    void saveToFirestore(result.products);
  };

  const resetPaymentState = () => {
    setPaidAmount(0);
    setManualAdjustment(0);
    setTipAmount(0);
    setTaxExempt(false);
    setServiceFeeAmount(0);
  };

  const handleCashPayment = async (breakdown: ReturnType<typeof buildCashPaymentBreakdown>) => {
    try {
      await writeCashSuccessPayment(breakdown.basePayment, order, breakdown.gratuity);
      const nextPaidAmount = paidAmount + breakdown.basePayment;
      if (breakdown.isFullPayment || nextPaidAmount >= order.total) {
        await clearTableInFirestore();
        resetPaymentState();
      } else {
        setPaidAmount(nextPaidAmount);
      }
      Alert.alert(
        t("seats.paymentSuccessful"),
        t("seats.paidViaMethod", { amount: breakdown.paymentTotal.toFixed(2), method: "cash" })
      );
    } catch (e) {
      console.error("Error writing cash payment:", e);
      Alert.alert(t("common.error"), "Failed to write cash payment");
    }
  };

  const handlePayment = async (method: "cash" | "card" | "split", amount: number) => {
    if (method === "cash") {
      try {
        const breakdown = buildCashPaymentBreakdown({
          amountDue: Math.max(0, order.total - paidAmount),
          cashReceived: amount,
        });
        await writeCashSuccessPayment(breakdown.basePayment, order, breakdown.gratuity);
        const nextPaidAmount = paidAmount + breakdown.basePayment;
        if (nextPaidAmount >= order.total) {
          await clearTableInFirestore();
          resetPaymentState();
        } else {
          setPaidAmount(nextPaidAmount);
        }
        Alert.alert(
          t("seats.paymentSuccessful"),
          t("seats.paidViaMethod", { amount: breakdown.paymentTotal.toFixed(2), method })
        );
      } catch (e) {
        console.error("Error writing cash payment:", e);
        Alert.alert(t("common.error"), "Failed to write cash payment");
      }
      return;
    }

    if (method === "card") {
      try {
        await requestTerminalPayment(amount);
      } catch (e) {
        console.error("Error starting terminal payment:", e);
        Alert.alert(t("common.error"), "Failed to start terminal payment");
      }
      return;
    }

    setPaidAmount((prev) => prev + amount);
    Alert.alert(
      t("seats.paymentSuccessful"),
      t("seats.paidViaMethod", { amount: amount.toFixed(2), method })
    );
  };

  const handleMarkAsUnpaid = async () => {
    if (rawProducts.length === 0) {
      setPaidAmount(0);
      return;
    }

    try {
      await writeUnpaidSuccessPayment(order);
      await clearTableInFirestore();
      setPaidAmount(0);
      setManualAdjustment(0);
      setTipAmount(0);
      setTaxExempt(false);
      setServiceFeeAmount(0);
      Alert.alert("Unpaid", "Order marked as unpaid and table cleared.");
    } catch (e) {
      console.error("Error marking order unpaid:", e);
      Alert.alert(t("common.error"), "Failed to mark order unpaid");
    }
  };

  const handlePrint = async (type: "order" | "receipt") => {
    try {
      if (type === "order") {
        await writeKitchenEvents();
      } else {
        await writeReceiptEvents();
      }
    } catch (e) {
      console.error(`Error writing ${type} print event:`, e);
      Alert.alert(t("common.error"), `Failed to print ${type}`);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-row items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900 dark:text-white">
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
                { text: t("seats.markUnpaid"), onPress: () => void handleMarkAsUnpaid() },
                { text: t("common.cancel"), style: "cancel" },
              ]
            );
          }}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Ionicons name="ellipsis-horizontal" size={19} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 flex-col bg-slate-50 dark:bg-slate-950 md:flex-row">
        <View className="flex-1 px-3 py-3 md:mr-3 md:bg-transparent">
          <View className="h-full rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-900 dark:text-white">
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
                    onPress={handleOrderItemPress}
                    onEdit={handleOpenOptionsEdit}
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

        <View className="w-full bg-slate-50 p-3 pt-0 dark:bg-slate-950 md:h-full md:w-[380px] md:pt-3">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <OrderSummary order={order} />

            <View className="mt-4">
              <Button
                label={taxExempt ? "✓ Tax Exempt" : "Tax Exempt"}
                variant={taxExempt ? "primary" : "outline"}
                icon="pricetag"
                onPress={() => setTaxExempt((enabled) => !enabled)}
              />
            </View>

            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={serviceFeeAmount > 0 ? `Service Fee $${serviceFeeAmount.toFixed(2)}` : "Service Fee"}
                  variant={serviceFeeAmount > 0 ? "primary" : "outline"}
                  icon="receipt"
                  onPress={() => setServiceFeeModalVisible(true)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Adjust Total"
                  variant="outline"
                  icon="create"
                  onPress={() => setAdjustmentModalVisible(true)}
                />
              </View>
            </View>

            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Print Order"
                  variant="outline"
                  icon="restaurant"
                  onPress={() => void handlePrint("order")}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Print Receipt"
                  variant="outline"
                  icon="print"
                  onPress={() => void handlePrint("receipt")}
                />
              </View>
            </View>

            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Split Payment"
                  variant="outline"
                  icon="git-branch"
                  onPress={() => setPaymentModalVisible(true)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t("seats.markUnpaid")}
                  variant="outline"
                  icon="alert-circle"
                  onPress={() => void handleMarkAsUnpaid()}
                />
              </View>
            </View>

            <View className="mt-4">
              <Button
                label={t("seats.payNow")}
                variant="primary"
                size="lg"
                icon="card"
                onPress={() => setPaymentModalVisible(true)}
                disabled={order.status === "paid"}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      <AdjustmentModal
        visible={adjustmentModalVisible}
        baseAmount={getProductsSubtotal(rawProducts, { includeSurcharge: false })}
        currentAmount={
          getProductsSubtotal(rawProducts, { includeSurcharge: false })
          + getSurchargeTotal(rawProducts)
          + Math.min(0, manualAdjustment)
        }
        mode="targetTotal"
        taxExempt={taxExempt}
        onClose={() => setAdjustmentModalVisible(false)}
        onConfirm={handleAdjustTotal}
        onTaxExemptChange={setTaxExempt}
      />

      <ServiceFeeModal
        visible={serviceFeeModalVisible}
        baseAmount={getProductsSubtotal(rawProducts)}
        currentAmount={serviceFeeAmount}
        onClose={() => setServiceFeeModalVisible(false)}
        onConfirm={setServiceFeeAmount}
      />

      <MenuSelectionModal
        visible={menuModalVisible}
        onClose={() => setMenuModalVisible(false)}
        onSelect={handleAddItem}
      />

      {optionEditContext && (() => {
        const selections = cartItemToEditableSelections({
          product: optionEditContext.rawProduct,
          menuItem: optionEditContext.menuItem,
          globalCustomizations,
        });
        return (
          <ItemOptionsModal
            visible={!!optionEditContext}
            item={optionEditContext.menuItem}
            initialSelectedOptions={selections.selectedOptions}
            initialSelectedIngredients={selections.selectedIngredients}
            initialSelectedGlobalCustomizations={selections.selectedGlobalCustomizations}
            confirmLabel="Save Changes"
            onClose={() => setOptionEditContext(null)}
            onConfirm={handleOptionsEditSave}
            onCustomPriceChange={handleOptionEditCustomPriceChange}
          />
        );
      })()}

      <PaymentModal
        visible={paymentModalVisible}
        total={order.total}
        remaining={order.total - order.paidAmount}
        onClose={() => setPaymentModalVisible(false)}
        onPayment={handlePayment}
        onCashPress={() => setCashPaymentModalVisible(true)}
      />

      <CashPaymentModal
        visible={cashPaymentModalVisible}
        amountDue={Math.max(0, order.total - order.paidAmount)}
        tipBaseAmount={order.taxableSubtotal ?? order.subtotal}
        onClose={() => setCashPaymentModalVisible(false)}
        onPayment={(breakdown) => void handleCashPayment(breakdown)}
        onOpenCashDrawer={() => void writeOpenCashDrawerEvent()}
      />
    </View>
  );
}
