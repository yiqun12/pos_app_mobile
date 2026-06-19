import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { normalizeAmountInput } from "@/lib/pos/amountInput";
import {
  deleteDishRevisionOption,
  getInitialDishRevisionDraft,
  getNextDishRevisionDraftAfterConfirm,
  MENU_EDITOR_DETAILS_LABELS,
  toggleDishRevisionMultiSelect,
  upsertDishRevisionOption,
} from "@/lib/pos/menuEditorLayout";
import { uploadMenuImage } from "@/lib/pos/menuImageUpload";
import {
  coerceAvailabilityPeriods,
  DEFAULT_AVAILABILITY_PERIODS,
  DEFAULT_MENU_IMAGE_URL,
} from "@/lib/pos/menuTransforms";
import { getTableTimingMenuHint } from "@/lib/pos/tableTiming";
import { Ingredient, MenuAvailability, OptionChoice, OptionGroup } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export type MenuEditorSavePayload = {
  rawName: string;
  nameCN?: string;
  name: string;
  price: number;
  imageUrl?: string;
  availability: MenuAvailability;
  optionGroups?: OptionGroup[];
  ingredients?: Ingredient[];
};

interface MenuEditorModalProps {
  visible: boolean;
  initialItemId?: string;
  initialName?: string;
  initialRawName?: string;
  initialNameCN?: string;
  initialPrice?: number;
  initialImageUrl?: string;
  initialAvailability?: MenuAvailability;
  initialOptionGroups?: OptionGroup[];
  initialIngredients?: Ingredient[];
  saving?: boolean;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (payload: MenuEditorSavePayload) => Promise<void> | void;
}

function splitDisplayName(displayName: string): { rawName: string; nameCN?: string } {
  const [rawName, nameCN] = displayName.split(/\s+\/\s+/, 2);
  return {
    rawName: rawName?.trim() || displayName,
    nameCN: nameCN?.trim() || undefined,
  };
}

export function MenuEditorModal({
  visible,
  initialItemId,
  initialName = "",
  initialRawName,
  initialNameCN,
  initialPrice,
  initialImageUrl,
  initialAvailability,
  initialOptionGroups = [],
  initialIngredients = [],
  saving = false,
  mode,
  onClose,
  onSave,
}: MenuEditorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { t } = useTranslation();

  const initialNames = splitDisplayName(initialName);
  const [rawName, setRawName] = useState(initialRawName ?? initialNames.rawName);
  const [nameCN, setNameCN] = useState(initialNameCN ?? initialNames.nameCN ?? "");
  const [price, setPrice] = useState(
    initialPrice ? initialPrice.toString() : ""
  );
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [availabilityPeriods, setAvailabilityPeriods] = useState<string[]>(
    coerceAvailabilityPeriods(initialAvailability)
  );
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(initialOptionGroups);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRevisionEditor, setShowRevisionEditor] = useState(false);
  const [showRevisionCategory, setShowRevisionCategory] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState(
    getInitialDishRevisionDraft().category
  );
  const [currentAttributeWasTyped, setCurrentAttributeWasTyped] = useState(false);
  const [currentVariation, setCurrentVariation] = useState({
    type: "",
    price: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const tableTimingHint = getTableTimingMenuHint(nameCN);

  useEffect(() => {
    if (visible) {
      const names = splitDisplayName(initialName);
      setRawName(initialRawName ?? names.rawName);
      setNameCN(initialNameCN ?? names.nameCN ?? "");
      setPrice(initialPrice ? initialPrice.toString() : "");
      setImageUrl(initialImageUrl ?? "");
      setAvailabilityPeriods(coerceAvailabilityPeriods(initialAvailability));
      setOptionGroups(initialOptionGroups);
      setIngredients(initialIngredients);
      setCurrentAttribute(getInitialDishRevisionDraft().category);
      setCurrentAttributeWasTyped(false);
      setCurrentVariation({ type: "", price: "" });
      setShowAdvanced(false);
      setShowRevisionEditor(false);
      setShowRevisionCategory(false);
    }
  }, [visible, mode, initialItemId]);

  const handleSave = async () => {
    const priceNum = parseFloat(price);
    if (!rawName.trim() || isNaN(priceNum)) return;
    setSubmitting(true);
    try {
      const cleanRawName = rawName.trim();
      const cleanNameCN = nameCN.trim() || undefined;
      await onSave({
        rawName: cleanRawName,
        nameCN: cleanNameCN,
        name: cleanNameCN ? `${cleanRawName} / ${cleanNameCN}` : cleanRawName,
        price: priceNum,
        imageUrl: imageUrl.trim() || undefined,
        availability: availabilityPeriods,
        optionGroups: optionGroups.length > 0 ? optionGroups : undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Photo library access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadMenuImage(result.assets[0]);
      setImageUrl(uploadedUrl);
    } catch (error) {
      console.error("Menu image upload failed:", error);
      Alert.alert("Upload Failed", "Unable to upload menu image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const addOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: `group-${Date.now()}`,
      name: "Option",
      type: "multi",
      required: false,
      choices: [],
    };
    setOptionGroups([...optionGroups, newGroup]);
  };

  const toggleAvailabilityPeriod = (period: string) => {
    setAvailabilityPeriods((previous) =>
      previous.includes(period)
        ? previous.filter((item) => item !== period)
        : [...previous, period]
    );
  };

  const confirmDishRevisionOption = () => {
    setOptionGroups((previous) =>
      upsertDishRevisionOption(previous, {
        category: currentAttribute,
        detail: currentVariation.type,
        price: Number.parseFloat(currentVariation.price) || 0,
      })
    );
    const resetDraft = getNextDishRevisionDraftAfterConfirm({
      category: currentAttribute,
      preserveCategory: currentAttributeWasTyped && currentAttribute.trim().length > 0,
    });
    setCurrentAttribute(resetDraft.category);
    setCurrentAttributeWasTyped(resetDraft.category.length > 0);
    setCurrentVariation({
      type: resetDraft.detail,
      price: resetDraft.price,
    });
  };

  const selectDishRevisionOption = (
    group: OptionGroup,
    choice: OptionChoice
  ) => {
    setCurrentAttribute(group.name);
    setCurrentAttributeWasTyped(false);
    setCurrentVariation({
      type: choice.name,
      price: String(choice.priceAdjustment ?? 0),
    });
    setShowRevisionEditor(true);
  };

  const deleteDishRevision = (group: OptionGroup, choice: OptionChoice) => {
    setOptionGroups((previous) =>
      deleteDishRevisionOption(previous, group.name, choice.name)
    );
  };

  const toggleDishRevisionGroup = (group: OptionGroup) => {
    setOptionGroups((previous) =>
      toggleDishRevisionMultiSelect(previous, group.name)
    );
  };

  const removeOptionGroup = (groupId: string) => {
    setOptionGroups(optionGroups.filter((g) => g.id !== groupId));
  };

  const updateOptionGroup = (
    groupId: string,
    field: string,
    value: unknown
  ) => {
    setOptionGroups(
      optionGroups.map((g) =>
        g.id === groupId ? { ...g, [field]: value } : g
      )
    );
  };

  const addChoiceToGroup = (groupId: string) => {
    const newChoice: OptionChoice = {
      id: `choice-${Date.now()}`,
      name: "",
    };
    setOptionGroups(
      optionGroups.map((g) =>
        g.id === groupId
          ? { ...g, choices: [...g.choices, newChoice] }
          : g
      )
    );
  };

  const updateChoice = (
    groupId: string,
    choiceId: string,
    field: string,
    value: unknown
  ) => {
    setOptionGroups(
      optionGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              choices: g.choices.map((c) =>
                c.id === choiceId ? { ...c, [field]: value } : c
              ),
            }
          : g
      )
    );
  };

  const removeChoice = (groupId: string, choiceId: string) => {
    setOptionGroups(
      optionGroups.map((g) =>
        g.id === groupId
          ? { ...g, choices: g.choices.filter((c) => c.id !== choiceId) }
          : g
      )
    );
  };

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: `ingredient-${Date.now()}`,
      name: t("menu.item.newIngredient"),
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter((i) => i.id !== ingredientId));
  };

  const updateIngredient = (
    ingredientId: string,
    field: string,
    value: unknown
  ) => {
    setIngredients(
      ingredients.map((i) =>
        i.id === ingredientId ? { ...i, [field]: value } : i
      )
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center bg-black/50 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="max-h-[90%]"
        >
          <ScrollView
            className="rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="font-bold text-slate-900 dark:text-white"
              >
                {mode === "add" ? t("menu.item.addItem") : t("menu.item.editItem")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              {/* Basic Info */}
              <View>
                <Text
                  style={{ fontSize: responsive.baseFontSize - 2 }}
                  className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  {t("menu.item.itemName")}
                </Text>
                <TextInput
                  value={rawName}
                  onChangeText={setRawName}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder={t("menu.item.itemNamePlaceholder")}
                  placeholderTextColor="#94a3b8"
                  autoFocus={mode === "add"}
                />
              </View>

              <View>
                <Text
                  style={{ fontSize: responsive.baseFontSize - 2 }}
                  className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  Chinese Name
                </Text>
                <TextInput
                  value={nameCN}
                  onChangeText={setNameCN}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder="Chinese Name"
                  placeholderTextColor="#94a3b8"
                />
                <View
                  className={`mt-2 flex-row rounded-xl border px-3 py-2 ${
                    tableTimingHint.enabled
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/30"
                      : "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30"
                  }`}
                >
                  <Ionicons
                    name={tableTimingHint.enabled ? "time" : "information-circle-outline"}
                    size={18}
                    color={tableTimingHint.enabled ? "#2563eb" : "#d97706"}
                    style={{ marginTop: 1, marginRight: 8 }}
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      className={`text-sm font-bold ${
                        tableTimingHint.enabled
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {tableTimingHint.title}
                    </Text>
                    <Text className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {tableTimingHint.body}
                    </Text>
                  </View>
                </View>
              </View>

              <View>
                <Text
                  style={{ fontSize: responsive.baseFontSize - 2 }}
                  className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  {MENU_EDITOR_DETAILS_LABELS.price}
                </Text>
                <TextInput
                  value={price}
                  onChangeText={(value) => {
                    const normalized = normalizeAmountInput(value);
                    if (normalized !== null) setPrice(normalized);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder={t("menu.item.pricePlaceholder")}
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </View>

              <View>
                <Text
                  style={{ fontSize: responsive.baseFontSize - 2 }}
                  className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  Image
                </Text>
                <TouchableOpacity
                  onPress={handlePickImage}
                  disabled={uploadingImage}
                  className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800"
                >
                  <View className="h-20 w-20 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700">
                    <Image
                      source={{ uri: imageUrl || DEFAULT_MENU_IMAGE_URL }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-slate-900 dark:text-white">
                      {uploadingImage ? "Uploading..." : "Tap To Change Image"}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                    >
                      {imageUrl || DEFAULT_MENU_IMAGE_URL}
                    </Text>
                  </View>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#f97316" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Edit Details Toggle */}
              <TouchableOpacity
                onPress={() => setShowAdvanced(!showAdvanced)}
                className="flex-row items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800"
              >
                <Text
                  style={{ fontSize: responsive.baseFontSize }}
                  className="font-semibold text-slate-900 dark:text-white"
                >
                  {showAdvanced
                    ? MENU_EDITOR_DETAILS_LABELS.expandedToggle
                    : MENU_EDITOR_DETAILS_LABELS.collapsedToggle}
                </Text>
                <Ionicons
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              {/* Edit Details */}
              {showAdvanced && (
                <>
                  <View>
                    <View className="mb-3">
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="font-bold text-slate-900 dark:text-white"
                      >
                        {MENU_EDITOR_DETAILS_LABELS.options}
                      </Text>
                    </View>

                    {showRevisionEditor ? (
                      <View className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                      <TouchableOpacity
                        onPress={() => setShowRevisionCategory((value) => !value)}
                        className="mb-3 self-start rounded-lg bg-slate-200 px-3 py-2 dark:bg-slate-800"
                      >
                        <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                          {MENU_EDITOR_DETAILS_LABELS.editDishRevisionCategory}
                        </Text>
                      </TouchableOpacity>

                      {showRevisionCategory ? (
                        <View className="mb-3">
                          <Text
                            style={{ fontSize: responsive.baseFontSize - 2 }}
                            className="mb-1 font-semibold text-slate-900 dark:text-white"
                          >
                            {MENU_EDITOR_DETAILS_LABELS.dishReviseCategory}
                          </Text>
                          <TextInput
                            value={currentAttribute}
                            onChangeText={(text) => {
                              setCurrentAttribute(text);
                              setCurrentAttributeWasTyped(text.trim().length > 0);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Size"
                            placeholderTextColor="#94a3b8"
                          />
                          <Text className="mt-1 text-xs font-semibold text-blue-500">
                            {MENU_EDITOR_DETAILS_LABELS.dishReviseCategoryHint}
                          </Text>
                        </View>
                      ) : null}

                      <View className="mb-3">
                        <Text
                          style={{ fontSize: responsive.baseFontSize - 2 }}
                          className="mb-1 font-semibold text-slate-900 dark:text-white"
                        >
                          {MENU_EDITOR_DETAILS_LABELS.dishReviseDetails}
                        </Text>
                        <TextInput
                          value={currentVariation.type}
                          onChangeText={(text) =>
                            setCurrentVariation((previous) => ({
                              ...previous,
                              type: text,
                            }))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          placeholder="BG"
                          placeholderTextColor="#94a3b8"
                        />
                        <Text className="mt-1 text-xs font-semibold text-blue-500">
                          {MENU_EDITOR_DETAILS_LABELS.dishReviseDetailsHint}
                        </Text>
                      </View>

                      <View className="mb-3">
                        <Text
                          style={{ fontSize: responsive.baseFontSize - 2 }}
                          className="mb-1 font-semibold text-slate-900 dark:text-white"
                        >
                          {MENU_EDITOR_DETAILS_LABELS.price}
                        </Text>
                        <TextInput
                          value={currentVariation.price}
                          onChangeText={(text) => {
                            const normalized = normalizeAmountInput(text);
                            if (normalized !== null) {
                              setCurrentVariation((previous) => ({
                                ...previous,
                                price: normalized,
                              }));
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          placeholder="1"
                          placeholderTextColor="#94a3b8"
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <TouchableOpacity
                        onPress={confirmDishRevisionOption}
                        className="self-start rounded-lg bg-orange-500 px-4 py-2"
                      >
                        <Text className="font-semibold text-white">
                          {MENU_EDITOR_DETAILS_LABELS.confirm}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    ) : null}

                    {!showRevisionEditor ? (
                      <TouchableOpacity
                        onPress={() => setShowRevisionEditor(true)}
                        className="mb-3 self-start rounded-lg bg-orange-100 px-3 py-2 dark:bg-orange-900/30"
                      >
                        <Text className="font-semibold text-orange-700 dark:text-orange-300">
                          {MENU_EDITOR_DETAILS_LABELS.adjustDishRevisionOption}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {optionGroups.map((group) => (
                      <View key={group.id} className="mb-3">
                        <View className="mb-1 flex-row items-center">
                          <TouchableOpacity
                            onPress={() => {
                              setCurrentAttribute(group.name);
                              setShowRevisionEditor(true);
                            }}
                          >
                            <Text className="font-semibold text-slate-900 dark:text-white">
                              {group.name}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleDishRevisionGroup(group)}
                            className="ml-3 flex-row items-center"
                          >
                            <View
                              className={`h-5 w-5 rounded border-2 ${
                                group.type === "multi"
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {group.type === "multi" ? (
                                <View className="flex-1 items-center justify-center">
                                  <Ionicons name="checkmark" size={12} color="white" />
                                </View>
                              ) : null}
                            </View>
                            <Text className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                              {MENU_EDITOR_DETAILS_LABELS.multiSelect}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap">
                          {group.choices.map((choice) => (
                            <TouchableOpacity
                              key={choice.id}
                              onPress={() => selectDishRevisionOption(group, choice)}
                              className="mb-2 mr-2 flex-row items-center rounded-lg bg-blue-100 px-3 py-2 dark:bg-blue-900/30"
                            >
                              <Text className="font-semibold text-slate-900 dark:text-white">
                                {choice.name}(
                                {(choice.priceAdjustment ?? 0) >= 0 ? "+" : "-"}$
                                {Math.abs(choice.priceAdjustment ?? 0).toFixed(2)})
                              </Text>
                              <TouchableOpacity
                                onPress={() => deleteDishRevision(group, choice)}
                                className="ml-2 rounded-full bg-white/80 p-1 dark:bg-slate-800"
                              >
                                <Ionicons name="close" size={12} color="#334155" />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                          {group.choices.length === 0 ? (
                            <Text
                              style={{ fontSize: responsive.captionFontSize }}
                              className="text-slate-400"
                            >
                              No revise details
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))}

                    {optionGroups.length === 0 ? (
                      <Text
                        style={{ fontSize: responsive.captionFontSize }}
                        className="mb-3 text-slate-400"
                      >
                        No revise options
                      </Text>
                    ) : null}
                  </View>

                  <View className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                    <Text
                      style={{ fontSize: responsive.baseFontSize }}
                      className="mb-3 font-semibold text-slate-900 dark:text-white"
                    >
                      {MENU_EDITOR_DETAILS_LABELS.timeRangeAvailability}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {DEFAULT_AVAILABILITY_PERIODS.map((period) => {
                        const selected = availabilityPeriods.includes(period);
                        return (
                          <TouchableOpacity
                            key={period}
                            onPress={() => toggleAvailabilityPeriod(period)}
                            className={`rounded-lg border px-3 py-2 ${
                              selected
                                ? "border-blue-300 bg-blue-100"
                                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                            }`}
                          >
                            <Text
                              className={`font-semibold ${
                                selected ? "text-blue-800" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {period}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <Button label={t("common.cancel")} variant="outline" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button
                    label={submitting || saving ? "Saving..." : t("common.save")}
                    onPress={handleSave}
                    disabled={!rawName.trim() || !price || submitting || saving || uploadingImage}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
