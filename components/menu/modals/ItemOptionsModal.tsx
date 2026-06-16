import { Button } from "@/components/ui/Button";
import type { SelectedGlobalCustomization, SelectedOption } from "@/components/seats/types";
import { Colors } from "@/constants/theme";
import { useMenu } from "@/context/menu";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { appendAmountKey, normalizeAmountInput } from "@/lib/pos/amountInput";
import { GlobalCustomization, MenuItem, OptionGroup } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from "react-native-safe-area-context";

const ADD_REQUEST_CATEGORY: GlobalCustomization["typeCategory"] = "要求添加";
const REMOVE_REQUEST_CATEGORY: GlobalCustomization["typeCategory"] = "要求减少";
const CUSTOMIZED_OPTION_GROUP = "Customized Option";
const CUSTOM_TAX_EXEMPT_OPTION = "Tax Exempt";
const AMOUNT_KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "00"],
];

function parseOptionPrice(value: number | string | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function createWebAttributeOptionGroups(item: MenuItem): OptionGroup[] {
  const optionGroupNames = new Set((item.optionGroups ?? []).map((group) => group.name));
  const webAttributeGroups = Object.entries(item.attributesArr ?? {})
    .filter(([attributeName, attributeDetails]) =>
      !optionGroupNames.has(attributeName) && (attributeDetails.variations?.length ?? 0) > 0
    )
    .map(([attributeName, attributeDetails]) => ({
      id: attributeName,
      name: attributeName,
      type: attributeDetails.isSingleSelected ? "single" as const : "multi" as const,
      required: false,
      choices: (attributeDetails.variations ?? [])
        .filter((variation) => typeof variation.type === "string" && variation.type.length > 0)
        .map((variation) => ({
          id: `${attributeName}:${variation.type}`,
          name: variation.type ?? "",
          priceAdjustment: parseOptionPrice(variation.price),
        })),
    }));
  return [...(item.optionGroups ?? []), ...webAttributeGroups];
}

interface ItemOptionsModalProps {
  visible: boolean;
  item: MenuItem | null;
  initialSelectedOptions?: SelectedOption[];
  initialSelectedIngredients?: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
  initialSelectedGlobalCustomizations?: SelectedGlobalCustomization[];
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (
    selectedOptions: SelectedOption[],
    selectedIngredients: {
      id: string;
      name: string;
      priceAdjustment?: number;
    }[],
    selectedGlobalCustomizations?: SelectedGlobalCustomization[]
  ) => void;
  onCustomPriceChange?: (input: {
    reason: string;
    amount: number;
    increase: boolean;
  }) => boolean | void;
}

export function ItemOptionsModal({
  visible,
  item,
  initialSelectedOptions,
  initialSelectedIngredients,
  initialSelectedGlobalCustomizations,
  confirmLabel,
  onClose,
  onConfirm,
  onCustomPriceChange,
}: ItemOptionsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { t } = useTranslation();

  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<
    {
      id: string;
      name: string;
      priceAdjustment?: number;
    }[]
  >([]);
  const [selectedGlobalCustomizations, setSelectedGlobalCustomizations] = useState<
    SelectedGlobalCustomization[]
  >([]);
  const [customReason, setCustomReason] = useState("改价");
  const [customAmount, setCustomAmount] = useState("");
  const [customTaxExempt, setCustomTaxExempt] = useState(false);

  // Global customization groups come from the MenuProvider (firestore-backed).
  const { globalCustomizationGroups } = useMenu();

  // Reset selections whenever the modal opens for a new item.
  useEffect(() => {
    if (visible && item) {
      setSelectedOptions(initialSelectedOptions ?? []);
      setSelectedIngredients(initialSelectedIngredients ?? []);
      setSelectedGlobalCustomizations(initialSelectedGlobalCustomizations ?? []);
      const customChoice = (initialSelectedOptions ?? [])
        .find((option) => option.groupName === CUSTOMIZED_OPTION_GROUP)
        ?.selectedChoices[0];
      setCustomReason(customChoice?.name ?? "改价");
      setCustomAmount(
        customChoice?.priceAdjustment !== undefined
          ? Math.abs(customChoice.priceAdjustment).toString()
          : ""
      );
      setCustomTaxExempt(
        (initialSelectedOptions ?? []).some((option) =>
          option.groupName === CUSTOMIZED_OPTION_GROUP
          && option.selectedChoices.some((choice) => choice.name === CUSTOM_TAX_EXEMPT_OPTION)
        )
      );
    }
  }, [visible, item?.id]);

  if (!item) return null;
  const optionGroups = createWebAttributeOptionGroups(item);

  const handleOptionGroupChange = (
    groupId: string,
    groupName: string,
    choiceId: string,
    choiceName: string,
    priceAdjustment: number | undefined,
    isSingleSelect: boolean
  ) => {
    setSelectedOptions((prev) => {
      const existingGroup = prev.find((o) => o.groupId === groupId);

      if (!existingGroup) {
        return [
          ...prev,
          {
            groupId,
            groupName,
            selectedChoices: [{ id: choiceId, name: choiceName, priceAdjustment }],
          },
        ];
      }

      const choiceExists = existingGroup.selectedChoices.some(
        (c) => c.id === choiceId
      );

      if (choiceExists) {
        // Deselect if already selected
        const updatedChoices = existingGroup.selectedChoices.filter(
          (c) => c.id !== choiceId
        );
        if (updatedChoices.length === 0) {
          return prev.filter((o) => o.groupId !== groupId);
        }
        return prev.map((o) =>
          o.groupId === groupId ? { ...o, selectedChoices: updatedChoices } : o
        );
      }

      // For single-select, replace previous selection
      if (isSingleSelect) {
        return prev.map((o) =>
          o.groupId === groupId
            ? {
                ...o,
                selectedChoices: [{ id: choiceId, name: choiceName, priceAdjustment }],
              }
            : o
        );
      }

      // For multi-select, add to existing selections
      return prev.map((o) =>
        o.groupId === groupId
          ? {
              ...o,
              selectedChoices: [
                ...o.selectedChoices,
                { id: choiceId, name: choiceName, priceAdjustment },
              ],
            }
          : o
      );
    });
  };

  const handleIngredientToggle = (
    ingredientId: string,
    ingredientName: string,
    priceAdjustment: number | undefined
  ) => {
    setSelectedIngredients((prev) => {
      const exists = prev.some((i) => i.id === ingredientId);
      if (exists) {
        return prev.filter((i) => i.id !== ingredientId);
      }
      return [
        ...prev,
        { id: ingredientId, name: ingredientName, priceAdjustment },
      ];
    });
  };

  const isOptionGroupSelected = (groupId: string, choiceId: string) => {
    return selectedOptions.some(
      (o) => o.groupId === groupId && o.selectedChoices.some((c) => c.id === choiceId)
    );
  };

  const isIngredientSelected = (ingredientId: string) => {
    return selectedIngredients.some((i) => i.id === ingredientId);
  };

  const handleGlobalCustomizationToggle = (customization: GlobalCustomization) => {
    setSelectedGlobalCustomizations((prev) => {
      const exists = prev.some((c) => c.id === customization.id);
      if (exists) {
        return prev.filter((c) => c.id !== customization.id);
      }
      return [
        ...prev,
        {
          id: customization.id,
          type: customization.type,
          price: customization.price,
          typeCategory: customization.typeCategory,
        },
      ];
    });
  };

  const isGlobalCustomizationSelected = (id: string) => {
    return selectedGlobalCustomizations.some((c) => c.id === id);
  };

  const upsertCustomChoice = (
    choiceName: string,
    priceAdjustment: number,
    selected = true
  ) => {
    setSelectedOptions((prev) => {
      const existingGroup = prev.find((option) => option.groupName === CUSTOMIZED_OPTION_GROUP);
      const otherGroups = prev.filter((option) => option.groupName !== CUSTOMIZED_OPTION_GROUP);
      const existingChoices = existingGroup?.selectedChoices ?? [];
      const nextChoices = selected
        ? [
            ...existingChoices.filter((choice) => choice.name !== choiceName),
            {
              id: `${CUSTOMIZED_OPTION_GROUP}:${choiceName}`,
              name: choiceName,
              priceAdjustment,
            },
          ]
        : existingChoices.filter((choice) => choice.name !== choiceName);

      if (nextChoices.length === 0) return otherGroups;
      return [
        ...otherGroups,
        {
          groupId: CUSTOMIZED_OPTION_GROUP,
          groupName: CUSTOMIZED_OPTION_GROUP,
          selectedChoices: nextChoices,
        },
      ];
    });
  };

  const handleCustomPriceChange = (increase: boolean) => {
    const amount = parseFloat(customAmount);
    const reason = customReason.trim() || "改价";
    if (!Number.isFinite(amount)) return;
    const handled = onCustomPriceChange?.({ reason, amount: Math.abs(amount), increase });
    if (handled === false) return;
    const priceAdjustment = increase ? Math.abs(amount) : -Math.abs(amount);
    upsertCustomChoice(reason, priceAdjustment);
    setCustomReason("改价");
    setCustomAmount("");
  };

  const handleCustomPriceChoicePress = (choice: SelectedOption["selectedChoices"][number]) => {
    setCustomReason(choice.name);
    setCustomAmount(Math.abs(choice.priceAdjustment ?? 0).toString());
  };

  const handleCustomTaxExemptToggle = () => {
    const nextValue = !customTaxExempt;
    setCustomTaxExempt(nextValue);
    upsertCustomChoice(CUSTOM_TAX_EXEMPT_OPTION, 0, nextValue);
  };

  const handleAmountKeyPress = (key: string) => {
    setCustomAmount((current) => appendAmountKey(current, key));
  };

  const allRequiredOptionsSelected = () => {
    return optionGroups.every((group) => {
      if (!group.required) return true;
      return selectedOptions.some((o) => o.groupId === group.id && o.selectedChoices.length > 0);
    });
  };

  const calculatePriceAdjustment = () => {
    let adjustment = 0;
    selectedOptions.forEach((option) => {
      option.selectedChoices.forEach((choice) => {
        adjustment += choice.priceAdjustment ?? 0;
      });
    });
    selectedIngredients.forEach((ingredient) => {
      adjustment += ingredient.priceAdjustment ?? 0;
    });
    // Add global customization price adjustments
    selectedGlobalCustomizations.forEach((customization) => {
      adjustment += customization.price ?? 0;
    });
    return adjustment;
  };

  const priceAdjustment = calculatePriceAdjustment();
  const finalPrice = item.price + priceAdjustment;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics} style={{ flex: 1 }}>
        <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-white dark:bg-slate-950">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <View className="flex-1">
              <Text
                style={{ fontSize: responsive.headingFontSize }}
                className="font-bold text-slate-900 dark:text-white"
              >
                {item.name}
              </Text>
              <Text
                style={{ fontSize: responsive.baseFontSize }}
                className="mt-1 text-slate-600 dark:text-slate-400"
              >
                ${finalPrice.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="rounded-full bg-slate-100 p-2 dark:bg-slate-800"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          <View className="mb-6 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <View className={isTablet ? "flex-row gap-4" : "gap-4"}>
              <View className="min-w-0 flex-1">
                <View className="gap-3 md:flex-row">
                  <View className="flex-1">
                    <Text
                      style={{ fontSize: responsive.baseFontSize }}
                      className="mb-2 font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Update Reason (E.g. add garlic)
                    </Text>
                    <TextInput
                      value={customReason}
                      onChangeText={setCustomReason}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-white"
                      placeholder="改价"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{ fontSize: responsive.baseFontSize }}
                      className="mb-2 font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Amount Update (Enter "0" if no change)
                    </Text>
                    <TextInput
                      value={customAmount}
                      onChangeText={(value) => {
                        const normalized = normalizeAmountInput(value);
                        if (normalized !== null) setCustomAmount(normalized);
                      }}
                      keyboardType="decimal-pad"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:text-white"
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => handleCustomPriceChange(true)}
                    className="min-h-[44px] flex-1 basis-[30%] items-center justify-center rounded-lg bg-orange-500 px-4"
                  >
                    <Text
                      style={{ fontSize: responsive.baseFontSize - 1 }}
                      className="font-semibold text-white"
                    >
                      Add ${customAmount || "0"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCustomPriceChange(false)}
                    className="min-h-[44px] flex-1 basis-[30%] items-center justify-center rounded-lg bg-cyan-500 px-4"
                  >
                    <Text
                      style={{ fontSize: responsive.baseFontSize - 1 }}
                      className="font-semibold text-slate-900"
                    >
                      Subtract ${customAmount || "0"}
                    </Text>
                  </TouchableOpacity>
                  {/*
                  <TouchableOpacity
                    onPress={handleCustomTaxExemptToggle}
                    className={`min-h-[44px] flex-1 basis-[30%] items-center justify-center rounded-lg px-4 ${
                      customTaxExempt ? "bg-blue-600" : "bg-indigo-500"
                    }`}
                  >
                    <Text
                      style={{ fontSize: responsive.baseFontSize - 1 }}
                      className="font-semibold text-white"
                    >
                      {customTaxExempt ? "✓ Tax Exempt" : "Tax Exempt"}
                    </Text>
                  </TouchableOpacity>
                  */}
                </View>
              </View>
              <View className={isTablet ? "w-[360px]" : "w-full"}>
                <View className="gap-2">
                  {AMOUNT_KEYPAD_ROWS.map((row) => (
                    <View key={row.join("-")} className="flex-row gap-2">
                      {row.map((key) => (
                        <TouchableOpacity
                          key={key}
                          onPress={() => handleAmountKeyPress(key)}
                          className="min-h-[44px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                        >
                          <Text
                            style={{ fontSize: responsive.baseFontSize }}
                            className="font-semibold text-slate-700 dark:text-slate-200"
                          >
                            {key}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleAmountKeyPress("clear")}
                      className="min-h-[44px] flex-1 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30"
                    >
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="font-semibold text-red-600"
                      >
                        C
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAmountKeyPress("backspace")}
                      className="min-h-[44px] flex-1 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30"
                    >
                      <Ionicons name="backspace-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Option Groups */}
          {optionGroups.length > 0 && (
            <View className="mb-6">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="mb-3 font-bold text-slate-900 dark:text-white"
              >{t("menu.options.customization")}</Text>

              {optionGroups.map((group: OptionGroup) => (
                <View key={group.id} className="mb-6">
                  <Text
                    style={{ fontSize: responsive.baseFontSize }}
                    className="mb-2 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {group.name}
                    {group.required && (
                      <Text className="text-red-500">*</Text>
                    )}
                  </Text>
                  <View className="gap-2">
                    {group.choices.map((choice) => {
                      const isSelected = isOptionGroupSelected(group.id, choice.id);
                      const isCustomPriceChoice = group.name === CUSTOMIZED_OPTION_GROUP;
                      const handleChoicePress = () => {
                        handleOptionGroupChange(
                          group.id,
                          group.name,
                          choice.id,
                          choice.name,
                          choice.priceAdjustment,
                          group.type === "single"
                        );
                      };
                      return (
                        <TouchableOpacity
                          key={choice.id}
                          onPress={handleChoicePress}
                          activeOpacity={0.75}
                          className={`flex-row items-center rounded-lg border-2 p-3 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                              : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                          }`}
                        >
                          <View className="flex-1 flex-row items-center">
                            <View
                              className={`h-5 w-5 rounded-full border-2 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isSelected && (
                                <View className="flex-1 items-center justify-center">
                                  <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color="white"
                                  />
                                </View>
                              )}
                            </View>
                            <View className="ml-3 flex-1">
                              <Text
                                style={{ fontSize: responsive.baseFontSize }}
                                className="font-medium text-slate-900 dark:text-white"
                              >
                                {choice.name}
                              </Text>
                            </View>
                          </View>
                          {choice.priceAdjustment !== undefined && choice.priceAdjustment !== 0 && (
                            <Text
                              style={{ fontSize: responsive.baseFontSize - 2 }}
                              className="font-semibold text-slate-600 dark:text-slate-400"
                            >
                              {choice.priceAdjustment > 0 ? "+" : ""}
                              ${choice.priceAdjustment.toFixed(2)}
                            </Text>
                          )}
                          {isCustomPriceChoice && (
                            <TouchableOpacity
                              onPress={() => handleCustomPriceChoicePress(choice)}
                              hitSlop={8}
                              className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700"
                            >
                              <Ionicons name="create-outline" size={16} color={colors.text} />
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <View className="mb-6">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="mb-3 font-bold text-slate-900 dark:text-white"
              >{t("menu.options.addOns")}</Text>
              <View className="gap-2">
                {item.ingredients.map((ingredient) => (
                  <TouchableOpacity
                    key={ingredient.id}
                    onPress={() =>
                      handleIngredientToggle(
                        ingredient.id,
                        ingredient.name,
                        ingredient.priceAdjustment
                      )
                    }
                    className={`flex-row items-center rounded-lg border-2 p-3 ${
                      isIngredientSelected(ingredient.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                    }`}
                  >
                    <View
                      className={`h-5 w-5 rounded border-2 ${
                        isIngredientSelected(ingredient.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isIngredientSelected(ingredient.id) && (
                        <View className="flex-1 items-center justify-center">
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color="white"
                          />
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="font-medium text-slate-900 dark:text-white"
                      >
                        {ingredient.name}
                      </Text>
                    </View>
                    {ingredient.priceAdjustment !== undefined && ingredient.priceAdjustment !== 0 && (
                      <Text
                        style={{ fontSize: responsive.baseFontSize - 2 }}
                        className="font-semibold text-slate-600 dark:text-slate-400"
                      >
                        +${ingredient.priceAdjustment.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Global Customizations */}
          <View>
            <Text
              style={{ fontSize: responsive.subheadingFontSize }}
              className="mb-3 font-bold text-slate-900 dark:text-white"
            >{t("menu.options.specialRequests")}</Text>

            {globalCustomizationGroups.length > 0 ? (
              globalCustomizationGroups.map((group) => (
                <View key={group.category} className="mb-4">
                  <Text
                    style={{ fontSize: responsive.baseFontSize }}
                    className="mb-2 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t(group.categoryLabel)}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map((customization) => (
                      <TouchableOpacity
                        key={customization.id}
                        onPress={() => handleGlobalCustomizationToggle(customization)}
                        className={`rounded-full px-4 py-2 ${
                          isGlobalCustomizationSelected(customization.id)
                            ? group.category === ADD_REQUEST_CATEGORY
                              ? "bg-green-500"
                              : "bg-orange-500"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <Text
                          style={{ fontSize: responsive.baseFontSize - 2 }}
                          className={`font-medium ${
                            isGlobalCustomizationSelected(customization.id)
                              ? "text-white"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {customization.type}
                          {customization.price > 0 && ` +$${customization.price.toFixed(2)}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-slate-500">{t("menu.options.noCustomizationOptions")}</Text>
            )}
          </View>
        </ScrollView>

        {/* Footer with Action Buttons */}
        <View className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label={t("common.cancel")} variant="outline" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                label={confirmLabel ?? t("menu.options.addToOrder")}
                onPress={() => {
                  onConfirm(selectedOptions, selectedIngredients, selectedGlobalCustomizations);
                  onClose();
                }}
                disabled={!allRequiredOptionsSelected()}
              />
            </View>
          </View>
        </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
