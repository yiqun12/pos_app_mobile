import { Button } from "@/components/ui/Button";
import { normalizeAmountInput, parseAmountInput } from "@/lib/pos/amountInput";
import { applyGlobalModificationBulkPrice } from "@/lib/pos/globalModificationTransforms";
import type { GlobalCustomization } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type DraftCustomization = {
  id: string;
  type: string;
  priceText: string;
  typeCategory: "要求添加" | "要求减少";
};

type GlobalChangesModalProps = {
  visible: boolean;
  initialItems: GlobalCustomization[];
  saving?: boolean;
  onClose: () => void;
  onSave: (items: GlobalCustomization[]) => Promise<void>;
};

function makeDraftId(): string {
  return `global-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDraft(item: GlobalCustomization): DraftCustomization {
  return {
    id: item.id || makeDraftId(),
    type: item.type,
    priceText: String(item.price ?? 0),
    typeCategory: item.typeCategory === "要求减少" ? "要求减少" : "要求添加",
  };
}

function toCustomization(item: DraftCustomization): GlobalCustomization {
  return {
    id: item.id,
    type: item.type.trim(),
    price: parseAmountInput(item.priceText),
    typeCategory: item.typeCategory === "要求减少" ? "要求减少" : "要求添加",
  };
}

function toDraftFromCustomization(item: GlobalCustomization): DraftCustomization {
  return {
    id: item.id,
    type: item.type,
    priceText: String(item.price ?? 0),
    typeCategory: item.typeCategory,
  };
}

function createEmptyDraft(): DraftCustomization {
  return {
    id: makeDraftId(),
    type: "",
    priceText: "0",
    typeCategory: "要求添加",
  };
}

export function GlobalChangesModal({
  visible,
  initialItems,
  saving = false,
  onClose,
  onSave,
}: GlobalChangesModalProps) {
  const { width } = useWindowDimensions();
  const [draftItems, setDraftItems] = useState<DraftCustomization[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPriceText, setBulkPriceText] = useState("0");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) return;
    setDraftItems(
      initialItems.length > 0 ? initialItems.map(toDraft) : [createEmptyDraft()]
    );
    setBulkMode(false);
    setBulkPriceText("0");
    setSelectedIds(new Set());
  }, [initialItems, visible]);

  const displayItems = useMemo(
    () => draftItems.map((item, index) => ({ item, originalIndex: index })).reverse(),
    [draftItems]
  );
  const isCompact = width < 700;

  const duplicateType = useMemo(() => {
    const seen = new Set<string>();
    for (const item of draftItems) {
      const type = item.type.trim().toLowerCase();
      if (!type) continue;
      if (seen.has(type)) return item.type.trim();
      seen.add(type);
    }
    return "";
  }, [draftItems]);

  const updateDraft = (
    id: string,
    updates: Partial<Omit<DraftCustomization, "id">>
  ) => {
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addRow = () => {
    const next = createEmptyDraft();
    setDraftItems((current) => [...current, next]);
    if (bulkMode) {
      setSelectedIds((current) => new Set([...current, next.id]));
    }
  };

  const deleteRow = (id: string) => {
    setDraftItems((current) => current.filter((item) => item.id !== id));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const applyBulkPrice = () => {
    if (selectedIds.size === 0) {
      Alert.alert("Bulk Price", "Select at least one row.");
      return;
    }
    const updated = applyGlobalModificationBulkPrice(
      draftItems.map(toCustomization),
      selectedIds,
      parseAmountInput(bulkPriceText)
    );
    setDraftItems(updated.map(toDraftFromCustomization));
  };

  const handleSave = async () => {
    if (duplicateType) {
      Alert.alert("Duplicate item", `${duplicateType} already exists.`);
      return;
    }

    const nextItems = draftItems
      .map(toCustomization)
      .filter((item) => item.type.length > 0);

    await onSave(nextItems);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-white dark:bg-slate-950"
      >
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <Text className="min-w-0 flex-1 text-lg font-bold text-slate-900 dark:text-white">
            Global Food Customization Option Manager
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="close" size={22} color="#334155" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-amber-100 px-4 py-2 dark:bg-amber-950/40">
          <Ionicons name="information-circle" size={16} color="#475569" />
          <Text className="ml-2 text-sm text-slate-700 dark:text-slate-200">
            Use Bulk Price to modify prices in bulk.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2 px-4 py-3">
          <Button
            label="Add New Item"
            icon="add"
            disabled={saving}
            onPress={addRow}
          />
          <Button
            label={saving ? "Saving..." : "Global Save"}
            variant="secondary"
            loading={saving}
            disabled={saving}
            onPress={handleSave}
          />
          <Button
            label="Bulk Price"
            variant={bulkMode ? "primary" : "outline"}
            icon="pricetag-outline"
            disabled={saving}
            onPress={() => {
              setBulkMode((value) => !value);
              setSelectedIds(new Set());
            }}
          />
        </View>

        {bulkMode ? (
          <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/50 dark:bg-orange-950/30">
            <TextInput
              value={bulkPriceText}
              onChangeText={(value) => {
                const normalized = normalizeAmountInput(value);
                if (normalized !== null) setBulkPriceText(normalized);
              }}
              keyboardType="decimal-pad"
              className="h-11 min-w-[96px] rounded-lg border border-orange-200 bg-white px-3 text-slate-900 dark:border-orange-900 dark:bg-slate-950 dark:text-white"
              placeholder="0"
              placeholderTextColor="#94a3b8"
            />
            <Button
              label={`Apply (${selectedIds.size})`}
              size="sm"
              disabled={saving || selectedIds.size === 0}
              onPress={applyBulkPrice}
            />
            <Button
              label="All"
              size="sm"
              variant="outline"
              disabled={saving}
              onPress={() => setSelectedIds(new Set(draftItems.map((item) => item.id)))}
            />
          </View>
        ) : null}

        {isCompact ? (
          <ScrollView
            className="flex-1 bg-slate-50 dark:bg-slate-950"
            contentContainerStyle={{ padding: 12, paddingBottom: 24, gap: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            {displayItems.map(({ item }) => {
              const selected = selectedIds.has(item.id);
              return (
                <View
                  key={item.id}
                  className={`rounded-xl border p-3 ${
                    selected
                      ? "border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    {bulkMode ? (
                      <TouchableOpacity
                        onPress={() => toggleSelected(item.id)}
                        disabled={saving}
                        className="flex-row items-center"
                      >
                        <View
                          className={`mr-2 h-6 w-6 items-center justify-center rounded border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected ? <Ionicons name="checkmark" size={16} color="white" /> : null}
                        </View>
                        <Text className="text-sm font-semibold text-slate-600">Bulk</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="text-sm font-bold text-slate-900 dark:text-white">
                        Global Option
                      </Text>
                    )}
                    <TouchableOpacity
                      disabled={saving}
                      onPress={() => deleteRow(item.id)}
                      className="h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30"
                    >
                      <Ionicons name="close" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <Text className="mb-1 text-xs font-bold uppercase text-slate-500">Type</Text>
                  <TextInput
                    value={item.type}
                    onChangeText={(value) => updateDraft(item.id, { type: value })}
                    editable={!saving}
                    className="mb-3 h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Type"
                    placeholderTextColor="#94a3b8"
                  />

                  <View className="flex-row gap-3">
                    <View className="w-[96px]">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        Price
                      </Text>
                      <TextInput
                        value={item.priceText}
                        onChangeText={(value) => {
                          const normalized = normalizeAmountInput(value);
                          if (normalized !== null) {
                            updateDraft(item.id, { priceText: normalized });
                          }
                        }}
                        keyboardType="decimal-pad"
                        editable={!saving}
                        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="mb-1 text-xs font-bold uppercase text-slate-500">
                        Type Category
                      </Text>
                      <TextInput
                        value={item.typeCategory}
                        onChangeText={(value) =>
                          updateDraft(item.id, {
                            typeCategory: value === "要求减少" ? "要求减少" : "要求添加",
                          })
                        }
                        editable={!saving}
                        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="要求添加"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full">
              <View className="flex-row bg-slate-50 dark:bg-slate-900">
                {bulkMode ? (
                  <Text className="w-[64px] px-3 py-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    Bulk
                  </Text>
                ) : null}
                <Text className="flex-[1.6] px-3 py-3 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Type
                </Text>
                <Text className="w-[112px] px-3 py-3 text-center text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Price
                </Text>
                <Text className="flex-1 px-3 py-3 text-center text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Type Category
                </Text>
                <Text className="w-[72px] px-3 py-3 text-center text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Delete
                </Text>
              </View>

              {displayItems.map(({ item }) => {
                const selected = selectedIds.has(item.id);
                return (
                  <View
                    key={item.id}
                    className={`flex-row items-center border-b border-slate-200 dark:border-slate-800 ${
                      selected ? "bg-blue-50 dark:bg-blue-950/30" : "bg-white dark:bg-slate-950"
                    }`}
                  >
                    {bulkMode ? (
                      <TouchableOpacity
                        onPress={() => toggleSelected(item.id)}
                        disabled={saving}
                        className="w-[64px] items-center justify-center px-3 py-3"
                      >
                        <View
                          className={`h-6 w-6 items-center justify-center rounded border ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected ? <Ionicons name="checkmark" size={16} color="white" /> : null}
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    <View className="flex-[1.6] px-3 py-3">
                      <TextInput
                        value={item.type}
                        onChangeText={(value) => updateDraft(item.id, { type: value })}
                        editable={!saving}
                        className="h-10 rounded-lg border border-transparent px-2 text-slate-900 dark:text-white"
                        placeholder="Type"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View className="w-[112px] px-3 py-3">
                      <TextInput
                        value={item.priceText}
                        onChangeText={(value) => {
                          const normalized = normalizeAmountInput(value);
                          if (normalized !== null) {
                            updateDraft(item.id, { priceText: normalized });
                          }
                        }}
                        keyboardType="decimal-pad"
                        editable={!saving}
                        textAlign="center"
                        className="h-10 rounded-lg border border-transparent px-2 text-slate-900 dark:text-white"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <View className="flex-1 px-3 py-3">
                      <TextInput
                        value={item.typeCategory}
                        onChangeText={(value) =>
                          updateDraft(item.id, {
                            typeCategory: value === "要求减少" ? "要求减少" : "要求添加",
                          })
                        }
                        editable={!saving}
                        textAlign="center"
                        className="h-10 rounded-lg border border-transparent px-2 text-slate-900 dark:text-white"
                        placeholder="要求添加"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                    <TouchableOpacity
                      disabled={saving}
                      onPress={() => deleteRow(item.id)}
                      className="w-[72px] items-center justify-center px-3 py-3"
                    >
                      <Ionicons name="close" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
