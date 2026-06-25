import { ItemOptionsModal } from "@/components/menu/modals/ItemOptionsModal";
import { MenuSelectionModal } from "@/components/menu/modals/MenuSelectionModal";
import { AdjustmentModal } from "@/components/seats/modals/AdjustmentModal";
import { CashPaymentModal } from "@/components/seats/modals/CashPaymentModal";
import { PaymentModal } from "@/components/seats/modals/PaymentModal";
import { ServiceFeeModal } from "@/components/seats/modals/ServiceFeeModal";
import { SplitPaymentModal, type SplitPaymentPayload } from "@/components/seats/modals/SplitPaymentModal";
import { TableTimingModal } from "@/components/seats/modals/TableTimingModal";
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
import { Alert, AppState, Modal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useAuth } from "@/context/auth";
import { useMenu } from "@/context/menu";
import { useStoreSelection } from "@/context/store";
import { useStore } from "@/hooks/firestore/useStore";
import { useTableStatus } from "@/hooks/firestore/useTableStatus";
import { db, functions } from "@/lib/firebase";
import {
  buildChangeDeskProducts,
  buildMigratedTableTimingTimer,
  parseTableProducts,
} from "@/lib/pos/changeDesk";
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
import { resolveMenuImageUrl } from "@/lib/pos/menuTransforms";
import {
  buildSplitPaymentBreakdown,
  type SplitPaymentBreakdown,
} from "@/lib/pos/splitPayment";
import {
  BILLING_RULES,
  calculateTableTimingFee,
  createTableTimingProduct,
  endTableTimingProduct,
  getTableTimingBasePrice,
  getTableTimingElapsedMinutes,
  getTableTimingStartTimestamp,
  isActiveTableTimingProduct,
  isTableTimingMenuItem,
  type BillingRuleId,
  type CustomBillingRule,
  type TimerAction,
} from "@/lib/pos/tableTiming";
import {
  loadTableTimingTimers,
  removeTableTimingTimer,
  removeTableTimingTimersForProduct,
  saveTableTimingTimer,
} from "@/lib/pos/tableTimingStorage";
import { formatWebDate } from "@/lib/pos/webDate";
import type { MenuItem } from "@/types/menu";
import { httpsCallable } from "firebase/functions";
import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";

export default function SeatScreen() {
  const { seatId } = useLocalSearchParams<{ seatId: string; openModal?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { height: screenHeight } = useWindowDimensions();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useTranslation();

  const { user } = useAuth();
  const { currentStoreId } = useStoreSelection();
  const { data: store } = useStore();
  const { data: tableStatus } = useTableStatus();
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
  const [splitPaymentModalVisible, setSplitPaymentModalVisible] = useState(false);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [serviceFeeModalVisible, setServiceFeeModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [mobileActionsVisible, setMobileActionsVisible] = useState(false);
  const [changeDeskVisible, setChangeDeskVisible] = useState(false);
  const [changeDeskProcessing, setChangeDeskProcessing] = useState(false);
  const [tableTimingContext, setTableTimingContext] = useState<{
    menuItem: MenuItem;
    product?: any;
  } | null>(null);

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
  const hasOrderItems = rawProducts.length > 0;

  const targetTables = useMemo(() => {
    const statusByName = new Map((tableStatus ?? []).map((table) => [table.name, table]));
    return (store?.seatLayout?.tables ?? [])
      .filter((table) => table.name !== tableName)
      .map((table) => {
        const status = statusByName.get(table.name);
        return {
          ...table,
          status: status?.status ?? table.status ?? "vacant",
          itemCount: status?.itemCount ?? table.itemCount ?? 0,
        };
      });
  }, [store?.seatLayout?.tables, tableName, tableStatus]);

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
                  imageUrl: resolveMenuImageUrl(item.imageUrl, item.image),
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
                  isTableItem: Boolean(item.isTableItem),
                  tableRemarks: item.tableRemarks,
                  tableTimingStartedAt: item.tableTimingStartedAt,
                  tableTimingEndedAt: item.tableTimingEndedAt,
                  notes: item.tableRemarks,
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

  const writeSplitSuccessPayment = async (
    breakdown: SplitPaymentBreakdown,
    receiptProducts: Array<Record<string, any>>
  ) => {
    if (!user || !currentStoreId || !store || !tableName) return;
    const dateStr = formatWebDate();
    const paymentTotal = breakdown.basePayment;

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
        metadata: breakdown.metadata,
        next_action: null,
        object: "payment_intent",
        on_behalf_of: null,
        payment_method: "pm_none",
        payment_method_configuration_details: null,
        payment_method_options: {},
        card_present: {},
        request_extended_authorization: false,
        request_incremental_authorization_support: false,
        payment_method_types: ["Split_Payment"],
        powerBy: "Split Payment",
        processing: null,
        receiptData: JSON.stringify(cleanProductData(receiptProducts)),
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

  const writeKitchenEvents = async ({ silent = false }: { silent?: boolean } = {}) => {
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
    if (!silent) {
      Alert.alert("Kitchen", cleanedAdded.length || cleanedDeleted.length ? "Order sent to kitchen" : "No kitchen changes to send");
    }
  };

  const writeListOrderEvent = async () => {
    const date = formatWebDate();
    const data = cleanProductData(rawProducts);
    await writeStoreEvent("listOrder", {
      date,
      data,
      selectedTable: tableName,
      discount: order.discount ?? (manualAdjustment < 0 ? Math.abs(manualAdjustment) : 0),
      service_fee: order.serviceFee,
      total: order.total,
    });
    Alert.alert(t("seats.printing"), t("seats.printingTypeForSeat", { type: "order", seatId: tableName ?? seatId ?? "-" }));
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
    Alert.alert(t("seats.printing"), t("seats.printingTypeForSeat", { type: "receipt", seatId: tableName ?? seatId ?? "-" }));
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
    if (menuItem && isTableTimingMenuItem(menuItem)) {
      setTableTimingContext({ menuItem });
      setMenuModalVisible(false);
      return;
    }

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
      if (isSurchargeCartItem(p) || p.isTableItem || isActiveTableTimingProduct(p)) return p;
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
      if (isSurchargeCartItem(p) || p.isTableItem || isActiveTableTimingProduct(p)) return p;
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

  const handleDeleteItem = async (id: string) => {
    const removedProducts = rawProducts.filter((product) => getCartProductKey(product) === id);
    const newRaw = rawProducts.filter((product) => getCartProductKey(product) !== id);
    await saveToFirestore(newRaw);
    if (currentStoreId && tableName) {
      await Promise.all(removedProducts
        .filter((product) => product.isTableItem || product.attributeSelected?.["开台商品"])
        .map((product) => removeTableTimingTimersForProduct({
          storeId: currentStoreId,
          tableName,
          itemId: String(product.id),
          count: product.count,
        }))
      );
    }
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
    if ((isActiveTableTimingProduct(rawProduct) || rawProduct.isTableItem) && !rawProduct.tableTimingEndedAt) {
      setTableTimingContext({
        product: rawProduct,
        menuItem: menuItem ?? {
          id: rawProduct.id,
          categoryId: "",
          name: rawProduct.name ?? "Table Timing",
          rawName: rawProduct.name,
          nameCN: rawProduct.CHI,
          price: getTableTimingBasePrice(rawProduct),
          imageUrl: resolveMenuImageUrl(rawProduct.imageUrl, rawProduct.image),
          attributesArr: rawProduct.attributesArr,
        },
      });
      return;
    }

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
    if (orderItem.isTableItem && orderItem.tableTimingEndedAt) return;
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

  const activeTableTimingProducts = useMemo(
    () => rawProducts.filter((product) => isActiveTableTimingProduct(product)),
    [rawProducts]
  );

  const confirmProceedWithActiveTiming = () => {
    if (activeTableTimingProducts.length === 0) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Table Timing",
        "There are active table timing items that have not been ended. End table first for accurate billing.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Continue", style: "destructive", onPress: () => resolve(true) },
        ]
      );
    });
  };

  const handleStartTableTiming = async ({
    remarks,
    billingRule,
    customRule,
    timerDurationMinutes,
    timerAction,
  }: {
    remarks: string;
    billingRule: BillingRuleId;
    customRule?: CustomBillingRule;
    timerDurationMinutes?: number;
    timerAction: TimerAction;
  }) => {
    if (!tableTimingContext?.menuItem || !currentStoreId || !tableName) return;
    const startedAt = Date.now();
    const product = createTableTimingProduct({
      menuItem: tableTimingContext.menuItem,
      count: startedAt + Math.floor(Math.random() * 1000),
      startedAt,
      remarks,
      billingRule,
      customRule,
    });
    if (timerDurationMinutes && timerDurationMinutes > 0 && timerAction !== "No Action") {
      product.tableTimingTimer = {
        durationMinutes: timerDurationMinutes,
        action: timerAction,
        timerSetAt: startedAt,
        absoluteEndTime: startedAt + timerDurationMinutes * 60000,
      };
    }
    await saveToFirestore([product, ...rawProducts]);

    if (timerDurationMinutes && timerDurationMinutes > 0 && timerAction !== "No Action") {
      await saveTableTimingTimer({
        storeId: currentStoreId,
        tableName,
        itemId: product.id,
        count: product.count,
        action: timerAction,
        billingRule,
        customRule,
        timerSetAt: startedAt,
        durationMs: timerDurationMinutes * 60000,
        absoluteEndTime: startedAt + timerDurationMinutes * 60000,
      });
    }

    setTableTimingContext(null);
  };

  const handleEndTableTiming = async ({
    finalFee,
    endedAt,
    remarks,
    billingRule,
    customRule,
  }: {
    finalFee: number;
    endedAt: number;
    remarks: string;
    billingRule: BillingRuleId;
    customRule?: CustomBillingRule;
  }) => {
    if (!tableTimingContext?.product) return;
    const target = tableTimingContext.product;
    const newRaw = rawProducts.map((product) => {
      if (getCartProductKey(product) !== getCartProductKey(target)) return product;
      const attributeSelected = {
        ...(product.attributeSelected ?? {}),
        ...(remarks.trim().length > 0 ? { "备注": [remarks.trim()] } : {}),
      };
      if (remarks.trim().length === 0) {
        delete attributeSelected["备注"];
      }
      return endTableTimingProduct({
        product: {
          ...product,
          attributeSelected,
          tableRemarks: remarks,
          tableTimingBillingRule: billingRule,
          tableTimingCustomRule: customRule,
          tableTimingTimer: undefined,
        },
        finalFee,
        endedAt,
      });
    });
    await saveToFirestore(newRaw);
    if (currentStoreId && tableName) {
      await removeTableTimingTimersForProduct({
        storeId: currentStoreId,
        tableName,
        itemId: String(target.id),
        count: target.count,
      });
    }
    setTableTimingContext(null);
  };

  const processExpiredTableTimingTimers = async () => {
    if (!currentStoreId || !tableName || rawProducts.length === 0) return;
    const entries = await loadTableTimingTimers();
    const now = Date.now();
    let nextProducts = rawProducts;
    let changedProducts = false;

    for (const entry of entries) {
      const timer = entry.timer;
      if (timer.storeId !== currentStoreId || timer.tableName !== tableName) continue;
      if (timer.absoluteEndTime > now) continue;

      const target = nextProducts.find((product) =>
        String(product.id) === String(timer.itemId)
        && String(product.count) === String(timer.count)
      );

      if (target && timer.action === "Auto Checkout" && isActiveTableTimingProduct(target)) {
        const startedAt = getTableTimingStartTimestamp(target);
        const basePrice = getTableTimingBasePrice(target);
        const totalMinutes = getTableTimingElapsedMinutes(startedAt, now);
        const finalFee = calculateTableTimingFee({
          totalMinutes,
          hourlyRate: basePrice,
          ruleId: timer.billingRule,
          customRule: timer.customRule,
        });
        nextProducts = nextProducts.map((product) =>
          String(product.id) === String(timer.itemId)
          && String(product.count) === String(timer.count)
            ? endTableTimingProduct({
                product: { ...product, tableTimingTimer: undefined },
                finalFee,
                endedAt: now,
              })
            : product
        );
        changedProducts = true;
      }

      await removeTableTimingTimer(entry.key);
    }

    for (const product of nextProducts) {
      const timer = product.tableTimingTimer;
      if (!timer || timer.absoluteEndTime > now || !isActiveTableTimingProduct(product)) continue;

      if (timer.action === "Auto Checkout") {
        const startedAt = getTableTimingStartTimestamp(product);
        const basePrice = getTableTimingBasePrice(product);
        const totalMinutes = getTableTimingElapsedMinutes(startedAt, now);
        const finalFee = calculateTableTimingFee({
          totalMinutes,
          hourlyRate: basePrice,
          ruleId: product.tableTimingBillingRule ?? BILLING_RULES.RULE_6,
          customRule: product.tableTimingCustomRule,
        });
        nextProducts = nextProducts.map((candidate) =>
          String(candidate.id) === String(product.id)
          && String(candidate.count) === String(product.count)
            ? endTableTimingProduct({
                product: { ...candidate, tableTimingTimer: undefined },
                finalFee,
                endedAt: now,
              })
            : candidate
        );
        changedProducts = true;
      } else if (timer.action === "Continue Billing") {
        nextProducts = nextProducts.map((candidate) =>
          String(candidate.id) === String(product.id)
          && String(candidate.count) === String(product.count)
            ? { ...candidate, tableTimingTimer: undefined }
            : candidate
        );
        changedProducts = true;
      }
    }

    if (changedProducts) {
      await saveToFirestore(nextProducts);
    }
  };

  useEffect(() => {
    void processExpiredTableTimingTimers();
  }, [currentStoreId, tableName, rawProducts]);

  useEffect(() => {
    if (!currentStoreId || !tableName || rawProducts.length === 0) return undefined;
    const interval = setInterval(() => {
      void processExpiredTableTimingTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStoreId, tableName, rawProducts]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void processExpiredTableTimingTimers();
    });
    return () => subscription.remove();
  }, [currentStoreId, tableName, rawProducts]);

  const handleCashPayment = async (breakdown: ReturnType<typeof buildCashPaymentBreakdown>) => {
    try {
      const canProceed = await confirmProceedWithActiveTiming();
      if (!canProceed) return;
      await writeKitchenEvents({ silent: true });
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
    const canProceed = await confirmProceedWithActiveTiming();
    if (!canProceed) return;

    if (method === "cash") {
      try {
        await writeKitchenEvents({ silent: true });
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
        await writeKitchenEvents({ silent: true });
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

  const handleOpenSplitPayment = async () => {
    if (rawProducts.length === 0) return;
    try {
      await writeKitchenEvents({ silent: true });
      setSplitPaymentModalVisible(true);
    } catch (e) {
      console.error("Error preparing split payment:", e);
      Alert.alert(t("common.error"), "Failed to prepare split payment");
    }
  };

  const handleSplitPayment = async (payload: SplitPaymentPayload): Promise<boolean> => {
    try {
      const canProceed = await confirmProceedWithActiveTiming();
      if (!canProceed) return false;
      const breakdown = buildSplitPaymentBreakdown({
        order: { ...order, tips: tipAmount },
        amount: payload.amount,
        paidAmount,
      });
      if (breakdown.basePayment <= 0) return false;

      await writeSplitSuccessPayment(breakdown, payload.products);

      if (breakdown.isFullPayment) {
        await clearTableInFirestore();
        resetPaymentState();
        setSplitPaymentModalVisible(false);
      } else {
        setPaidAmount(breakdown.nextPaidAmount);
      }

      Alert.alert(
        t("seats.paymentSuccessful"),
        t("seats.paidViaMethod", { amount: breakdown.basePayment.toFixed(2), method: "split" })
      );
      return true;
    } catch (e) {
      console.error("Error writing split payment:", e);
      Alert.alert(t("common.error"), "Failed to write split payment");
      return false;
    }
  };

  const handleMarkAsUnpaid = async () => {
    if (!hasOrderItems) {
      setPaidAmount(0);
      return;
    }

    try {
      const canProceed = await confirmProceedWithActiveTiming();
      if (!canProceed) return;
      await writeKitchenEvents({ silent: true });
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
    if (!hasOrderItems) return;
    try {
      if (type === "order") {
        await writeListOrderEvent();
      } else {
        await writeReceiptEvents();
      }
    } catch (e) {
      console.error(`Error writing ${type} print event:`, e);
      Alert.alert(t("common.error"), `Failed to print ${type}`);
    }
  };

  const handleChangeDesk = async (target: { id: string; name: string }) => {
    if (!user || !currentStoreId || !tableName) return;
    if (rawProducts.length === 0) {
      Alert.alert(t("common.error"), "Current table has no items to move.");
      return;
    }
    if (target.name === tableName) return;

    setChangeDeskProcessing(true);
    try {
      await writeKitchenEvents({ silent: true });

      const date = formatWebDate();
      const sourceTableDocId = `${currentStoreId}-${tableName}`;
      const targetTableDocId = `${currentStoreId}-${target.name}`;
      const basePath = ["stripe_customers", user.uid, "TitleLogoNameContent", currentStoreId] as const;
      const sourceTableRef = doc(db, ...basePath, "Table", sourceTableDocId);
      const targetTableRef = doc(db, ...basePath, "Table", targetTableDocId);
      const sourceSentRef = doc(db, ...basePath, "TableIsSent", `${sourceTableDocId}-isSent`);
      const targetSentRef = doc(db, ...basePath, "TableIsSent", `${targetTableDocId}-isSent`);

      const [targetTableSnap, targetSentSnap] = await Promise.all([
        getDoc(targetTableRef),
        getDoc(targetSentRef),
      ]);
      const targetProducts = parseTableProducts(targetTableSnap.data()?.product);
      const targetSentProducts = parseTableProducts(targetSentSnap.data()?.product);
      const nextTargetProducts = buildChangeDeskProducts({
        sourceProducts: rawProducts,
        targetProducts,
      });
      const nextTargetSentProducts = buildChangeDeskProducts({
        sourceProducts: rawProducts,
        targetProducts: targetSentProducts,
      });

      const batch = writeBatch(db);
      batch.set(targetTableRef, { product: JSON.stringify(nextTargetProducts), date }, { merge: true });
      batch.set(sourceTableRef, { product: "[]", date }, { merge: true });
      batch.set(targetSentRef, { product: JSON.stringify(nextTargetSentProducts), date }, { merge: true });
      batch.set(sourceSentRef, { product: "[]", date }, { merge: true });
      await batch.commit();

      const activeProductKeys = new Set(
        rawProducts
          .filter((product) => product.isTableItem || product.attributeSelected?.["开台商品"])
          .map((product) => `${product.id}-${product.count}`)
      );
      const timers = await loadTableTimingTimers();
      await Promise.all(timers
        .filter(({ timer }) =>
          timer.storeId === currentStoreId
          && timer.tableName === tableName
          && activeProductKeys.has(`${timer.itemId}-${timer.count}`)
        )
        .map(async ({ key, timer }) => {
          await removeTableTimingTimer(key);
          await saveTableTimingTimer(buildMigratedTableTimingTimer(timer, target.name));
        })
      );

      setChangeDeskVisible(false);
      resetPaymentState();
      router.replace(`/(tabs)/seats/${target.id}` as any);
    } catch (error) {
      console.error("Error changing desk:", error);
      Alert.alert(t("common.error"), "Failed to change desk");
    } finally {
      setChangeDeskProcessing(false);
    }
  };

  const closeMobileActions = () => {
    setMobileActionsVisible(false);
  };

  const renderOrderActions = () => (
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
          disabled={!hasOrderItems}
        />
      </View>

      <View className="mt-4 flex-row gap-2">
        <View className="flex-1">
          <Button
            label={serviceFeeAmount > 0 ? `Service Fee $${serviceFeeAmount.toFixed(2)}` : "Service Fee"}
            variant={serviceFeeAmount > 0 ? "primary" : "outline"}
            icon="receipt"
            onPress={() => {
              closeMobileActions();
              setServiceFeeModalVisible(true);
            }}
            disabled={!hasOrderItems}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Adjust Total"
            variant="outline"
            icon="create"
            onPress={() => {
              closeMobileActions();
              setAdjustmentModalVisible(true);
            }}
            disabled={!hasOrderItems}
          />
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1">
          <Button
            label="Print Order"
            variant="outline"
            icon="restaurant"
            onPress={() => {
              closeMobileActions();
              void handlePrint("order");
            }}
            disabled={!hasOrderItems}
          />
        </View>
        <View className="flex-1">
          <Button
            label="Print Receipt"
            variant="outline"
            icon="print"
            onPress={() => {
              closeMobileActions();
              void handlePrint("receipt");
            }}
            disabled={!hasOrderItems}
          />
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        <View className="flex-1">
          <Button
            label="Split Payment"
            variant="outline"
            icon="git-branch"
            onPress={() => {
              closeMobileActions();
              void handleOpenSplitPayment();
            }}
            disabled={!hasOrderItems}
          />
        </View>
        <View className="flex-1">
          <Button
            label={t("seats.markUnpaid")}
            variant="outline"
            icon="alert-circle"
            onPress={() => {
              closeMobileActions();
              void handleMarkAsUnpaid();
            }}
            disabled={!hasOrderItems}
          />
        </View>
      </View>

      <View className="mt-4">
        <Button
          label={t("seats.payNow")}
          variant="primary"
          size="lg"
          icon="card"
          onPress={() => {
            closeMobileActions();
            setPaymentModalVisible(true);
          }}
          disabled={!hasOrderItems || order.status === "paid"}
        />
      </View>
    </ScrollView>
  );

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
          {t("seats.seatOrder", { seatId: tableName ?? seatId ?? "-" })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              t("seats.options"),
              t("seats.selectAction"),
              hasOrderItems
                ? [
                    {
                      text: t("seats.changeSeat"),
                      onPress: () => setChangeDeskVisible(true),
                    },
                    { text: t("seats.markUnpaid"), onPress: () => void handleMarkAsUnpaid() },
                    { text: t("common.cancel"), style: "cancel" },
                  ]
                : [{ text: t("common.cancel"), style: "cancel" }]
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
                    onDelete={(id) => void handleDeleteItem(id)}
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

        <View className="hidden bg-slate-50 p-3 pt-0 dark:bg-slate-950 md:flex md:h-full md:w-[380px] md:pt-3">
          {renderOrderActions()}
        </View>
      </View>

      <View className="border-t border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setMobileActionsVisible(true)}
          className="flex-row items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900 dark:bg-orange-950/30"
        >
          <View>
            <Text className="text-sm font-semibold text-slate-900 dark:text-white">
              Order Actions
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              {items.length} items · tap to expand
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-orange-600">
              ${order.total.toFixed(2)}
            </Text>
            <Ionicons name="chevron-up" size={18} color="#f97316" />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={mobileActionsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeMobileActions}
      >
        <View className="flex-1 justify-center bg-black/45 px-3 md:hidden">
          <View
            className="rounded-2xl bg-white p-3 shadow-lg dark:bg-slate-900"
            style={{ height: Math.min(screenHeight * 0.78, 640) }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  Order Actions
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  {t("seats.seatOrder", { seatId: tableName ?? seatId ?? "-" })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeMobileActions}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            {renderOrderActions()}
          </View>
        </View>
      </Modal>

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

      <Modal
        visible={changeDeskVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!changeDeskProcessing) setChangeDeskVisible(false);
        }}
      >
        <View className="flex-1 justify-center bg-black/50 px-4">
          <View className="max-h-[80%] rounded-xl bg-white p-4 shadow-lg dark:bg-slate-900">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  Change Desk
                </Text>
                <Text className="mt-1 text-sm text-slate-500">
                  Current: {tableName}
                </Text>
              </View>
              <TouchableOpacity
                disabled={changeDeskProcessing}
                onPress={() => setChangeDeskVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {targetTables.length === 0 ? (
              <View className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <Text className="text-center text-sm text-slate-500">
                  No target desks available.
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {targetTables.map((table) => {
                  const occupied = table.status === "occupied" || (table.itemCount ?? 0) > 0;
                  return (
                    <TouchableOpacity
                      key={table.id}
                      disabled={changeDeskProcessing}
                      onPress={() => void handleChangeDesk({ id: table.id, name: table.name })}
                      className={`mb-2 rounded-lg border p-3 ${
                        occupied
                          ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-base font-semibold text-slate-900 dark:text-white">
                            {table.name}
                          </Text>
                          <Text className="mt-1 text-sm text-slate-500">
                            {occupied ? "In use" : "Empty"} · {table.itemCount ?? 0} items
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={occupied ? "#f97316" : colors.tabIconDefault}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View className="mt-3 flex-row gap-2">
              <View className="flex-1">
                <Button
                  label={changeDeskProcessing ? "Moving..." : t("common.cancel")}
                  variant="outline"
                  onPress={() => setChangeDeskVisible(false)}
                  disabled={changeDeskProcessing}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

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

      <SplitPaymentModal
        visible={splitPaymentModalVisible}
        products={rawProducts}
        total={order.total}
        remaining={Math.max(0, order.total - order.paidAmount)}
        onClose={() => setSplitPaymentModalVisible(false)}
        onConfirm={handleSplitPayment}
      />

      <TableTimingModal
        visible={!!tableTimingContext}
        tableName={tableName ?? ""}
        menuItem={tableTimingContext?.menuItem ?? null}
        product={tableTimingContext?.product}
        onClose={() => setTableTimingContext(null)}
        onStart={(payload) => void handleStartTableTiming(payload)}
        onEnd={(payload) => void handleEndTableTiming(payload)}
      />
    </View>
  );
}
