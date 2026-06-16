import { Button } from "@/components/ui/Button";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  BILLING_RULES,
  calculateTableTimingFee,
  getTableTimingBasePrice,
  getTableTimingElapsedMinutes,
  getTableTimingStartTimestamp,
  type BillingRuleId,
  type CustomBillingRule,
  type TableTimingProduct,
  type TimerAction,
} from "@/lib/pos/tableTiming";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const BILLING_RULE_OPTIONS: Array<{ id: BillingRuleId; label: string }> = [
  { id: BILLING_RULES.RULE_1, label: "Rule: Hour Block / 15-min" },
  { id: BILLING_RULES.RULE_2, label: "Rule: 30-min Block, then Hour Block / 15-min" },
  { id: BILLING_RULES.RULE_3, label: "Rule: Hour Block / 30-min" },
  { id: BILLING_RULES.RULE_4, label: "Rule: Hour Block / Minute" },
  { id: BILLING_RULES.RULE_5, label: "Rule: Exact Minute" },
  { id: BILLING_RULES.RULE_6, label: "Rule: First 40-min -> 30-min or 1-hour / 10-min" },
  { id: BILLING_RULES.CUSTOM_RULE, label: "Custom Rule" },
];

const TIMER_ACTION_OPTIONS: TimerAction[] = ["No Action", "Auto Checkout", "Continue Billing"];
const NUMBER_PAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "00"],
  ["C", "back"],
];

type NumberField =
  | "timerDuration"
  | "customInitialSegment"
  | "customSubsequentSegment"
  | "customDuration"
  | "finalFee"
  | "none";

function parseNumber(value: string, fallback = 0): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatClock(timestamp: number | null): string {
  if (!timestamp) return "--:--:--";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${datePart} ${formatClock(timestamp)}`;
}

function formatDuration(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatMoney(value: number): string {
  return `$${(Math.round(value * 100) / 100).toFixed(2)}`;
}

function normalizePositiveInteger(value: string, fallback: string): string {
  if (value.trim() === "") return "";
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : fallback;
}

interface TableTimingModalProps {
  visible: boolean;
  tableName: string;
  menuItem: Record<string, any> | null;
  product?: TableTimingProduct | Record<string, any> | null;
  onClose: () => void;
  onStart: (payload: {
    remarks: string;
    billingRule: BillingRuleId;
    customRule?: CustomBillingRule;
    timerDurationMinutes?: number;
    timerAction: TimerAction;
  }) => void;
  onEnd: (payload: {
    finalFee: number;
    endedAt: number;
    remarks: string;
    billingRule: BillingRuleId;
    customRule?: CustomBillingRule;
  }) => void;
}

export function TableTimingModal({
  visible,
  tableName,
  menuItem,
  product,
  onClose,
  onStart,
  onEnd,
}: TableTimingModalProps) {
  const responsive = useResponsiveLayout();
  const [now, setNow] = useState(Date.now());
  const [remarks, setRemarks] = useState("");
  const [billingRule, setBillingRule] = useState<BillingRuleId>(BILLING_RULES.RULE_6);
  const [customFirstBlock, setCustomFirstBlock] = useState("60");
  const [customInitialSegment, setCustomInitialSegment] = useState("15");
  const [customSubsequentSegment, setCustomSubsequentSegment] = useState("15");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState("");
  const [timerAction, setTimerAction] = useState<TimerAction>("No Action");
  const [customDuration, setCustomDuration] = useState("");
  const [finalFeeInput, setFinalFeeInput] = useState("");
  const [activeInputField, setActiveInputField] = useState<NumberField>("none");
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [isEditingBillingRule, setIsEditingBillingRule] = useState(false);

  const displayItem = product ?? menuItem;
  const startedAt = product ? getTableTimingStartTimestamp(product) : null;
  const isActive = Boolean(product && startedAt && !product.tableTimingEndedAt);
  const basePrice = useMemo(() => getTableTimingBasePrice(product ?? menuItem), [menuItem, product]);
  const usedMinutes = getTableTimingElapsedMinutes(startedAt, now);
  const feeMinutes = customDuration.trim().length > 0 ? parseNumber(customDuration, usedMinutes) : usedMinutes;
  const customRule = useMemo<CustomBillingRule>(() => ({
    firstBlockDuration: parseNumber(customFirstBlock, 60),
    initialSegmentMinutes: parseNumber(customInitialSegment, 15),
    subsequentSegmentMinutes: parseNumber(customSubsequentSegment, 15),
  }), [customFirstBlock, customInitialSegment, customSubsequentSegment]);
  const calculatedFee = calculateTableTimingFee({
    totalMinutes: feeMinutes,
    hourlyRate: basePrice,
    ruleId: billingRule,
    customRule,
  });
  const finalFee = finalFeeInput.trim().length > 0
    ? parseNumber(finalFeeInput, calculatedFee)
    : calculatedFee;
  const currentStatus = isActive ? "In Service" : "Not Started";
  const showBillingEditor = !isActive || isEditingBillingRule;
  const showRemarksEditor = !isActive || isEditingRemarks;
  const activeTimer = product?.tableTimingTimer;

  useEffect(() => {
    if (!visible) return undefined;
    const existingRule = product?.tableTimingBillingRule as BillingRuleId | undefined;
    const existingCustom = product?.tableTimingCustomRule as CustomBillingRule | undefined;
    const existingRemarks = product?.tableRemarks
      ?? product?.attributeSelected?.["备注"]?.[0]
      ?? "";
    setNow(Date.now());
    setRemarks(String(existingRemarks));
    setBillingRule(existingRule ?? BILLING_RULES.RULE_6);
    setCustomFirstBlock(String(existingCustom?.firstBlockDuration ?? 60));
    setCustomInitialSegment(String(existingCustom?.initialSegmentMinutes ?? 15));
    setCustomSubsequentSegment(String(existingCustom?.subsequentSegmentMinutes ?? 15));
    setTimerEnabled(false);
    setTimerDuration("");
    setTimerAction("No Action");
    setCustomDuration("");
    setFinalFeeInput("");
    setIsEditingRemarks(false);
    setIsEditingBillingRule(false);
    setActiveInputField(isActive ? "finalFee" : "none");
    return undefined;
  }, [
    isActive,
    product?.attributeSelected,
    product?.count,
    product?.tableRemarks,
    product?.tableTimingBillingRule,
    product?.tableTimingCustomRule,
    visible,
  ]);

  useEffect(() => {
    if (!visible || !isActive) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive, visible]);

  const currentFieldValue = (field: NumberField) => {
    switch (field) {
      case "timerDuration":
        return timerDuration;
      case "customInitialSegment":
        return customInitialSegment;
      case "customSubsequentSegment":
        return customSubsequentSegment;
      case "customDuration":
        return customDuration;
      case "finalFee":
        return finalFeeInput;
      default:
        return "";
    }
  };

  const setFieldValue = (field: NumberField, value: string) => {
    switch (field) {
      case "timerDuration":
        setTimerDuration(normalizePositiveInteger(value, timerDuration));
        break;
      case "customInitialSegment":
        setCustomInitialSegment(normalizePositiveInteger(value, customInitialSegment));
        break;
      case "customSubsequentSegment":
        setCustomSubsequentSegment(normalizePositiveInteger(value, customSubsequentSegment));
        break;
      case "customDuration":
        setCustomDuration(normalizePositiveInteger(value, customDuration));
        break;
      case "finalFee":
        setFinalFeeInput(value);
        break;
      default:
        break;
    }
  };

  const activateInputField = (field: NumberField) => {
    setActiveInputField(field);
  };

  const handleNumberPadPress = (key: string) => {
    if (activeInputField === "none") return;
    const current = currentFieldValue(activeInputField);
    if (key === "C") {
      setFieldValue(activeInputField, "");
      return;
    }
    if (key === "back") {
      setFieldValue(activeInputField, current.slice(0, -1));
      return;
    }
    if (key === "." && current.includes(".")) return;
    setFieldValue(activeInputField, `${current}${key}`);
  };

  const handleSaveBillingRule = () => {
    setCustomInitialSegment(normalizePositiveInteger(customInitialSegment, "15") || "15");
    setCustomSubsequentSegment(normalizePositiveInteger(customSubsequentSegment, "15") || "15");
    setIsEditingBillingRule(false);
  };

  if (!displayItem) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 p-4">
        <View className="max-h-[94%] w-full max-w-5xl self-center overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
          <View className="border-b border-slate-100 p-4 dark:border-slate-800">
            <Text className="text-lg font-bold text-slate-900 dark:text-white">
              Table Timing - {displayItem.name ?? displayItem.CHI ?? tableName}
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              {tableName} · {isActive ? "In Service" : "Not Started"}
            </Text>
          </View>

          <View className={responsive.isTablet ? "flex-row" : "flex-1"}>
            <ScrollView
              className={responsive.isTablet ? "max-h-[640px] flex-1 p-4" : "p-4"}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <View className="gap-3">
                <View className="gap-2">
                  <View className="flex-row gap-3">
                    <StatusField
                      label="Base Price"
                      value={formatMoney(basePrice)}
                      tone="alert"
                    />
                    <StatusField
                      label="Current Status"
                      value={currentStatus}
                      tone={isActive ? "active" : "alert"}
                    />
                  </View>
                  <View className="flex-row gap-3">
                    <StatusField
                      label="Start Time"
                      value={startedAt ? formatDateTime(startedAt) : "--:--:--"}
                    />
                    <CurrentTimeField visible={visible} />
                  </View>
                  <StatusField
                    label="Used Duration"
                    value={isActive ? formatDuration(usedMinutes) : "--:--:--"}
                    fullWidth
                  />
                </View>

                {!isActive && (
                  <View className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <TouchableOpacity
                      onPress={() => {
                        const next = !timerEnabled;
                        setTimerEnabled(next);
                        setActiveInputField(next ? "timerDuration" : "none");
                      }}
                      className="flex-row items-center justify-between"
                    >
                      <Text className="font-semibold text-slate-800 dark:text-white">
                        Timer Settings
                      </Text>
                      <View className={`h-7 w-12 justify-center rounded-full px-1 ${
                        timerEnabled ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}>
                        <View className={`h-5 w-5 rounded-full bg-white shadow ${
                          timerEnabled ? "self-end" : "self-start"
                        }`} />
                      </View>
                    </TouchableOpacity>

                    {timerEnabled && (
                      <View className="mt-3 gap-3">
                        <TextInput
                          value={timerDuration}
                          onChangeText={(value) => setFieldValue("timerDuration", value)}
                          onFocus={() => activateInputField("timerDuration")}
                          keyboardType="number-pad"
                          placeholder="Timer duration in minutes"
                          className={`rounded-lg border px-3 py-2 text-slate-900 dark:text-white ${
                            activeInputField === "timerDuration"
                              ? "border-orange-500"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          placeholderTextColor="#94a3b8"
                        />
                        <View className="flex-row flex-wrap gap-2">
                          {TIMER_ACTION_OPTIONS.map((action) => (
                            <TouchableOpacity
                              key={action}
                              onPress={() => setTimerAction(action)}
                              className={`rounded-lg border px-3 py-2 ${
                                timerAction === action
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                              }`}
                            >
                              <Text className={timerAction === action ? "font-bold text-orange-600" : "font-semibold text-slate-600 dark:text-slate-300"}>
                                {action}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <View className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-semibold text-slate-700 dark:text-slate-300">
                      Billing Rule
                    </Text>
                    {isActive && (
                      <TouchableOpacity
                        onPress={() => {
                          if (isEditingBillingRule) handleSaveBillingRule();
                          else setIsEditingBillingRule(true);
                        }}
                        className="rounded-md border border-orange-500 px-3 py-1"
                      >
                        <Text className="text-sm font-semibold text-orange-600">
                          {isEditingBillingRule ? "Save" : "Edit Rule"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showBillingEditor ? (
                    <View className="flex-row flex-wrap gap-2">
                      {BILLING_RULE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() => setBillingRule(option.id)}
                          className={`min-h-[44px] items-center justify-center rounded-lg border px-3 py-2 ${
                            billingRule === option.id
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <Text
                            style={{ fontSize: responsive.captionFontSize }}
                            className={billingRule === option.id ? "text-center font-bold text-orange-600" : "text-center font-semibold text-slate-600 dark:text-slate-300"}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text className="rounded-lg bg-slate-50 p-3 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {BILLING_RULE_OPTIONS.find((option) => option.id === billingRule)?.label ?? "Billing Rule"}
                    </Text>
                  )}

                  {billingRule === BILLING_RULES.CUSTOM_RULE && showBillingEditor && (
                    <View className="mt-3 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <View className="flex-row gap-2">
                        {["30", "60"].map((value) => (
                          <TouchableOpacity
                            key={value}
                            onPress={() => setCustomFirstBlock(value)}
                            className={`min-h-[42px] flex-1 items-center justify-center rounded-lg border px-3 py-2 ${
                              customFirstBlock === value
                                ? "border-orange-500 bg-orange-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <Text className="text-center font-semibold text-slate-700">
                              {value === "30" ? "30 minutes" : "1 hour"}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View className="flex-row gap-2">
                        <TextInput
                          value={customInitialSegment}
                          onChangeText={(value) => setFieldValue("customInitialSegment", value)}
                          onFocus={() => activateInputField("customInitialSegment")}
                          keyboardType="number-pad"
                          placeholder="Initial segment"
                          className={`flex-1 rounded-lg border px-3 py-2 text-slate-900 dark:text-white ${
                            activeInputField === "customInitialSegment"
                              ? "border-orange-500"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                        <TextInput
                          value={customSubsequentSegment}
                          onChangeText={(value) => setFieldValue("customSubsequentSegment", value)}
                          onFocus={() => activateInputField("customSubsequentSegment")}
                          keyboardType="number-pad"
                          placeholder="Next segment"
                          className={`flex-1 rounded-lg border px-3 py-2 text-slate-900 dark:text-white ${
                            activeInputField === "customSubsequentSegment"
                              ? "border-orange-500"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {isActive && (
                  <View className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                    {activeTimer && (
                      <View className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
                        <Text className="text-xs font-semibold uppercase text-slate-500">
                          Active Timer
                        </Text>
                        <Text className="mt-1 font-semibold text-blue-900 dark:text-blue-100">
                          Timer Duration: {activeTimer.durationMinutes} minutes | Timer Action: {activeTimer.action}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">Custom Duration</Text>
                        <TextInput
                          value={customDuration}
                          onChangeText={(value) => setFieldValue("customDuration", value)}
                          onFocus={() => activateInputField("customDuration")}
                          keyboardType="number-pad"
                          placeholder={`${usedMinutes} minutes`}
                          className={`rounded-lg border bg-white px-3 py-2 text-slate-900 dark:bg-slate-900 dark:text-white ${
                            activeInputField === "customDuration"
                              ? "border-orange-500"
                              : "border-orange-200 dark:border-orange-800"
                          }`}
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">Final Fee</Text>
                        <TextInput
                          value={finalFeeInput}
                          onChangeText={(value) => setFieldValue("finalFee", value)}
                          onFocus={() => activateInputField("finalFee")}
                          keyboardType="decimal-pad"
                          placeholder={formatMoney(calculatedFee)}
                          className={`rounded-lg border bg-white px-3 py-2 text-slate-900 dark:bg-slate-900 dark:text-white ${
                            activeInputField === "finalFee"
                              ? "border-orange-500"
                              : "border-orange-200 dark:border-orange-800"
                          }`}
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>
                    <View className="mt-3 flex-row justify-between">
                      <Text className="font-semibold text-slate-700 dark:text-slate-300">
                        Calculated Fee
                      </Text>
                      <Text className="text-lg font-bold text-orange-600">
                        {formatMoney(calculatedFee)}
                      </Text>
                    </View>
                  </View>
                )}

                <View className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-semibold text-slate-700 dark:text-slate-300">
                      Remarks
                    </Text>
                    {isActive && (
                      <TouchableOpacity
                        onPress={() => setIsEditingRemarks((editing) => !editing)}
                        className="rounded-md border border-orange-500 px-3 py-1"
                      >
                        <Text className="text-sm font-semibold text-orange-600">
                          {isEditingRemarks ? "Save" : "Edit"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {showRemarksEditor ? (
                    <TextInput
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Enter remarks here..."
                      multiline
                      className="min-h-[76px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-white"
                      placeholderTextColor="#94a3b8"
                    />
                  ) : (
                    <Text className="min-h-[42px] rounded-lg bg-slate-50 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {remarks || "--"}
                    </Text>
                  )}
                </View>

                {!responsive.isTablet && (
                  <NumberPad
                    activeInputField={activeInputField}
                    calculatedFee={calculatedFee}
                    customDuration={customDuration}
                    finalFeeInput={finalFeeInput}
                    timerDuration={timerDuration}
                    onPress={handleNumberPadPress}
                  />
                )}
              </View>
            </ScrollView>

            {responsive.isTablet && (
              <View className="w-[300px] border-l border-slate-100 p-4 dark:border-slate-800">
                <NumberPad
                  activeInputField={activeInputField}
                  calculatedFee={calculatedFee}
                  customDuration={customDuration}
                  finalFeeInput={finalFeeInput}
                  timerDuration={timerDuration}
                  onPress={handleNumberPadPress}
                />
              </View>
            )}
          </View>

          <View className="flex-row gap-3 border-t border-slate-100 p-4 dark:border-slate-800">
            <View className="flex-1">
              <Button label="Cancel" variant="outline" onPress={onClose} />
            </View>
            <View className="flex-1">
              {isActive ? (
                <Button
                  label="End Table"
                  icon="stop"
                  onPress={() => onEnd({
                    finalFee,
                    endedAt: Date.now(),
                    remarks,
                    billingRule,
                    customRule: billingRule === BILLING_RULES.CUSTOM_RULE ? customRule : undefined,
                  })}
                />
              ) : (
                <Button
                  label="Start Table"
                  icon="play"
                  onPress={() => onStart({
                    remarks,
                    billingRule,
                    customRule: billingRule === BILLING_RULES.CUSTOM_RULE ? customRule : undefined,
                    timerDurationMinutes: timerEnabled ? parseNumber(timerDuration, 0) : undefined,
                    timerAction: timerEnabled ? timerAction : "No Action",
                  })}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function NumberPad({
  activeInputField,
  calculatedFee,
  customDuration,
  finalFeeInput,
  timerDuration,
  onPress,
}: {
  activeInputField: NumberField;
  calculatedFee: number;
  customDuration: string;
  finalFeeInput: string;
  timerDuration: string;
  onPress: (key: string) => void;
}) {
  const label = (() => {
    switch (activeInputField) {
      case "timerDuration":
        return `Timer Duration: ${timerDuration || "--"} minutes`;
      case "customInitialSegment":
        return "Initial Segment";
      case "customSubsequentSegment":
        return "Subsequent Segment";
      case "customDuration":
        return `Custom Duration: ${customDuration || "--"} minutes`;
      case "finalFee":
        return `Final Fee: ${finalFeeInput || formatMoney(calculatedFee)}`;
      default:
        return "Tap a numeric field";
    }
  })();

  return (
    <View className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <Text className="mb-3 font-semibold text-slate-700 dark:text-slate-300">
        Number Pad
      </Text>
      <Text className="mb-3 text-sm text-slate-500">{label}</Text>
      <View className="gap-2">
        {NUMBER_PAD_ROWS.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} className="flex-row gap-2">
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => onPress(key)}
                disabled={activeInputField === "none"}
                className={`min-h-[46px] flex-1 items-center justify-center rounded-lg border ${
                  key === "C"
                    ? "border-red-200 bg-red-50"
                    : key === "back"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                } ${activeInputField === "none" ? "opacity-50" : ""}`}
              >
                <Text className="text-base font-semibold text-slate-700 dark:text-slate-200">
                  {key === "back" ? "⌫" : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const StatusField = memo(function StatusField({
  label,
  value,
  tone = "neutral",
  fullWidth = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "alert" | "active";
  fullWidth?: boolean;
}) {
  const toneClass = tone === "alert"
    ? "border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20"
    : tone === "active"
      ? "border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20"
      : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800";
  const valueClass = tone === "alert"
    ? "text-red-700 dark:text-red-200"
    : tone === "active"
      ? "text-emerald-700 dark:text-emerald-200"
      : "text-slate-900 dark:text-white";

  return (
    <View className={fullWidth ? "w-full" : "min-w-0 flex-1"}>
      <Text className="mb-1 text-xs font-semibold uppercase text-slate-500">
        {label}
      </Text>
      <View className={`min-h-[44px] justify-center rounded-lg border px-3 py-2 ${toneClass}`}>
        <Text className={`text-center text-base font-bold ${valueClass}`}>
          {value}
        </Text>
      </View>
    </View>
  );
});

function CurrentTimeField({ visible }: { visible: boolean }) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!visible) return undefined;
    setCurrentTime(Date.now());
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <StatusField
      label="Current Time"
      value={formatDateTime(currentTime)}
    />
  );
}
