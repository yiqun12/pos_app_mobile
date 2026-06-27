import { Colors } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ColorMode = (typeof Colors)["light"];

export type Order = {
  id: string;
  guest: string;
  time: string;
  amount: number;
  channel: string;
  items?: OrderItem[];
  subtotal?: number;
  serviceFee?: number;
  tax?: number;
  gratuity?: number;
  total?: number;
  dateTime?: string;
  receiptData?: string;
  tableNum?: string;
  metadata?: Record<string, unknown>;
};

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
  selectedOptions?: {
    groupName: string;
    selectedChoices: { name: string }[];
  }[];
  selectedIngredients?: { name: string }[];
};

type OrderDetailModalProps = {
  visible: boolean;
  order: Order | null;
  colors: ColorMode;
  onClose: () => void;
  onAdjustOrder?: () => void;
  onBankReceipt?: () => void;
  onMerchantReceipt?: () => void;
  onCustomerReceipt?: () => void;
  busyAction?: string | null;
  actionStatus?: {
    tone: "info" | "success" | "error";
    message: string;
  } | null;
};

function MetaChip({ label, value }: { label: string; value: string }) {
  const responsive = useResponsiveLayout();

  return (
    <View className="min-w-[30%] flex-1 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
      <Text
        style={{ fontSize: responsive.captionFontSize }}
        className="font-medium text-slate-500 dark:text-slate-400"
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontSize: responsive.subheadingFontSize, marginTop: 2 }}
        className="font-bold text-slate-900 dark:text-white"
      >
        {value}
      </Text>
    </View>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();
  const nameSize = responsive.baseFontSize + 2;
  const priceSize = responsive.baseFontSize + 1;

  return (
    <View className="mb-3 flex-row rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
      <View
        style={{
          minWidth: 36,
          height: 36,
          borderRadius: 10,
          marginRight: 12,
          marginTop: 2,
        }}
        className="items-center justify-center bg-orange-100 dark:bg-orange-950"
      >
        <Text
          style={{ fontSize: responsive.subheadingFontSize }}
          className="font-bold text-orange-700 dark:text-orange-300"
        >
          ×{item.quantity}
        </Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text
          style={{ fontSize: nameSize, lineHeight: nameSize + 6 }}
          className="font-bold text-slate-900 dark:text-white"
        >
          {item.name}
        </Text>
        <Text
          style={{ fontSize: responsive.captionFontSize + 1, marginTop: 4 }}
          className="text-slate-500 dark:text-slate-400"
        >
          {t("revenue.itemQtyPrice", {
            quantity: item.quantity,
            price: item.price.toFixed(2),
          })}
        </Text>

        {item.selectedOptions?.map((option, optIdx) => (
          <Text
            key={optIdx}
            style={{ fontSize: responsive.captionFontSize + 1, marginTop: 4 }}
            className="text-slate-600 dark:text-slate-300"
          >
            {option.groupName}:{" "}
            {option.selectedChoices.map((c) => c.name).join(", ")}
          </Text>
        ))}

        {item.selectedIngredients && item.selectedIngredients.length > 0 && (
          <Text
            style={{ fontSize: responsive.captionFontSize + 1, marginTop: 4 }}
            className="text-slate-600 dark:text-slate-300"
          >
            {t("revenue.addOns")}:{" "}
            {item.selectedIngredients.map((i) => i.name).join(", ")}
          </Text>
        )}
      </View>

      <Text
        style={{
          fontSize: priceSize,
          lineHeight: priceSize + 4,
          marginLeft: 8,
          marginTop: 2,
        }}
        className="font-bold text-slate-900 dark:text-white"
      >
        ${item.total.toFixed(2)}
      </Text>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const responsive = useResponsiveLayout();
  const labelSize = emphasize ? responsive.baseFontSize + 1 : responsive.baseFontSize;
  const valueSize = emphasize ? responsive.headingFontSize : responsive.baseFontSize;

  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text
        style={{ fontSize: labelSize }}
        className={`${emphasize ? "font-bold" : "font-medium"} text-slate-600 dark:text-slate-300`}
      >
        {label}
      </Text>
      <Text
        style={{ fontSize: valueSize }}
        className={`${emphasize ? "font-bold text-green-600 dark:text-green-400" : "font-semibold text-slate-900 dark:text-white"}`}
      >
        {value}
      </Text>
    </View>
  );
}

function OrderTotals({ order }: { order: Order }) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const hasTotals = order.subtotal != null || order.total != null;

  if (!hasTotals) return null;

  return (
    <View className="border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
      {order.subtotal != null && (
        <SummaryRow
          label={t("revenue.subtotal")}
          value={`$${order.subtotal.toFixed(2)}`}
        />
      )}
      {order.serviceFee != null && (
        <SummaryRow
          label={t("revenue.serviceFee")}
          value={`$${order.serviceFee.toFixed(2)}`}
        />
      )}
      {order.tax != null && (
        <SummaryRow
          label={t("revenue.tax")}
          value={`$${order.tax.toFixed(2)}`}
        />
      )}
      {order.gratuity != null && (
        <SummaryRow
          label={t("revenue.gratuity")}
          value={`$${order.gratuity.toFixed(2)}`}
        />
      )}
      {order.total != null && (
        <>
          <View
            style={{ marginVertical: responsive.smallSpacing }}
            className="h-px bg-slate-200 dark:bg-slate-700"
          />
          <SummaryRow
            label={t("revenue.total")}
            value={`$${order.total.toFixed(2)}`}
            emphasize
          />
        </>
      )}
    </View>
  );
}

export function OrderDetailModal({
  visible,
  order,
  colors,
  onClose,
  onAdjustOrder,
  onBankReceipt,
  onMerchantReceipt,
  onCustomerReceipt,
  busyAction,
  actionStatus,
}: OrderDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
        <View
          className="rounded-t-3xl bg-white dark:bg-slate-950"
          style={{ height: "92%" }}
        >
          <OrderDetailContent
            order={order}
            colors={colors}
            onClose={onClose}
            onAdjustOrder={onAdjustOrder}
            onBankReceipt={onBankReceipt}
            onMerchantReceipt={onMerchantReceipt}
            onCustomerReceipt={onCustomerReceipt}
            busyAction={busyAction}
            actionStatus={actionStatus}
          />
        </View>
      </View>
    </Modal>
  );
}

export function OrderDetailContent({
  order,
  colors,
  onClose,
  onPay,
  onAdjustOrder,
  onBankReceipt,
  onMerchantReceipt,
  onCustomerReceipt,
  busyAction,
  actionStatus,
}: {
  order: Order | null;
  colors: ColorMode;
  onClose: () => void;
  onPay?: () => void;
  onAdjustOrder?: () => void;
  onBankReceipt?: () => void;
  onMerchantReceipt?: () => void;
  onCustomerReceipt?: () => void;
  busyAction?: string | null;
  actionStatus?: {
    tone: "info" | "success" | "error";
    message: string;
  } | null;
}) {
  const { t } = useTranslation();
  const responsive = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const hasItems = Boolean(order?.items && order.items.length > 0);
  const hasTotals = order?.subtotal != null || order?.total != null;
  const hasActions = Boolean(
    onAdjustOrder || onBankReceipt || onMerchantReceipt || onCustomerReceipt
  );

  if (!order) return null;

  return (
    <View className="flex-1">
      <View className="border-b border-slate-200 px-4 pb-3 pt-4 dark:border-slate-800">
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <Text
              style={{ fontSize: responsive.headingFontSize }}
              className="font-bold text-slate-900 dark:text-white"
            >
              {t("revenue.orderDetails")}
            </Text>
            <Text
              style={{ fontSize: responsive.subheadingFontSize, marginTop: 4 }}
              className="font-medium text-slate-500 dark:text-slate-400"
            >
              #{order.id}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full bg-slate-100 p-2.5 dark:bg-slate-800"
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View
          style={{ gap: responsive.smallSpacing, marginTop: responsive.mediumSpacing }}
          className="flex-row flex-wrap"
        >
          <MetaChip label={t("revenue.guest")} value={order.guest} />
          <MetaChip label={t("revenue.time")} value={order.time} />
          <MetaChip label={t("revenue.channel")} value={order.channel} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: responsive.mediumSpacing,
          paddingTop: responsive.mediumSpacing,
          paddingBottom: responsive.smallSpacing,
        }}
      >
        {hasItems ? (
          <>
            <Text
              style={{ fontSize: responsive.subheadingFontSize + 1, marginBottom: responsive.smallSpacing }}
              className="font-bold text-slate-900 dark:text-white"
            >
              {t("revenue.items")}
            </Text>
            {order.items!.map((item, idx) => (
              <OrderItemRow key={`${item.name}-${idx}`} item={item} />
            ))}
          </>
        ) : !hasTotals ? (
          <View className="rounded-2xl bg-slate-100 px-4 py-8 dark:bg-slate-800">
            <Text
              style={{ fontSize: responsive.baseFontSize }}
              className="text-center text-slate-500 dark:text-slate-400"
            >
              {t("revenue.detailUnavailable")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <OrderTotals order={order} />

      {hasActions && (
        <View className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          {actionStatus ? (
            <View
              className={`mb-3 rounded-xl border px-3 py-2 ${
                actionStatus.tone === "error"
                  ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                  : actionStatus.tone === "success"
                    ? "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/30"
                    : "border-orange-200 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/30"
              }`}
            >
              <Text
                style={{ fontSize: responsive.captionFontSize + 1 }}
                className={`font-semibold ${
                  actionStatus.tone === "error"
                    ? "text-red-700 dark:text-red-300"
                    : actionStatus.tone === "success"
                      ? "text-green-700 dark:text-green-300"
                      : "text-orange-700 dark:text-orange-300"
                }`}
              >
                {actionStatus.message}
              </Text>
            </View>
          ) : null}

          <Text
            style={{ fontSize: responsive.captionFontSize, marginBottom: 8 }}
            className="font-bold uppercase text-slate-500 dark:text-slate-400"
          >
            {t("revenue.adminActions")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <OrderActionButton
              label={t("revenue.adjustOrder")}
              icon="create-outline"
              colors={colors}
              disabled={!onAdjustOrder || Boolean(busyAction)}
              loading={busyAction === "adjust"}
              loadingLabel={t("revenue.saving")}
              onPress={onAdjustOrder}
            />
            <OrderActionButton
              label={t("revenue.bankReceipt")}
              icon="receipt-outline"
              colors={colors}
              disabled={!onBankReceipt || Boolean(busyAction)}
              loading={busyAction === "bank"}
              loadingLabel={t("revenue.queueing")}
              onPress={onBankReceipt}
            />
            <OrderActionButton
              label={t("revenue.merchantReceipt")}
              icon="print-outline"
              colors={colors}
              disabled={!onMerchantReceipt || Boolean(busyAction)}
              loading={busyAction === "merchant"}
              loadingLabel={t("revenue.queueing")}
              onPress={onMerchantReceipt}
            />
            <OrderActionButton
              label={t("revenue.customerReceipt")}
              icon="person-outline"
              colors={colors}
              disabled={!onCustomerReceipt || Boolean(busyAction)}
              loading={busyAction === "customer"}
              loadingLabel={t("revenue.queueing")}
              onPress={onCustomerReceipt}
            />
          </View>
        </View>
      )}

      <View
        className="flex-row gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 rounded-xl bg-slate-100 py-3.5 dark:bg-slate-800"
        >
          <Text
            style={{ fontSize: responsive.baseFontSize }}
            className="text-center font-bold text-slate-900 dark:text-white"
          >
            {t("common.close")}
          </Text>
        </TouchableOpacity>

        {onPay && (
          <TouchableOpacity
            onPress={onPay}
            className="flex-1 rounded-xl bg-blue-600 py-3.5"
          >
            <Text
              style={{ fontSize: responsive.baseFontSize }}
              className="text-center font-bold text-white"
            >
              {t("revenue.payAmount", {
                amount: (order.total || order.amount || 0).toFixed(2),
              })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function OrderActionButton({
  label,
  icon,
  colors,
  disabled,
  loading,
  loadingLabel,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ColorMode;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onPress?: () => void;
}) {
  const responsive = useResponsiveLayout();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`min-w-[47%] flex-1 flex-row items-center justify-center rounded-xl border border-orange-500 px-3 py-3 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.tint} />
      ) : (
        <Ionicons name={icon} size={18} color={colors.tint} />
      )}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={{ fontSize: responsive.captionFontSize + 1 }}
        className="ml-2 font-bold text-orange-600 dark:text-orange-400"
      >
        {loading ? loadingLabel ?? "..." : label}
      </Text>
    </TouchableOpacity>
  );
}
