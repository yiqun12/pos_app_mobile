import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { db } from "@/lib/firebase";
import { GlobalCustomization, GlobalCustomizationGroup, MenuItem, OptionGroup } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// Fallback global customizations
const FALLBACK_GLOBAL_CUSTOMIZATIONS: GlobalCustomization[] = [
  { id: "gc-1", type: "外卖", price: 0, typeCategory: "要求添加" },
  { id: "gc-2", type: "加酱料", price: 0, typeCategory: "要求添加" },
  { id: "gc-3", type: "加辣", price: 0, typeCategory: "要求添加" },
  { id: "gc-4", type: "加葱", price: 0, typeCategory: "要求添加" },
  { id: "gc-5", type: "堂食", price: 0, typeCategory: "要求减少" },
  { id: "gc-6", type: "不要辣", price: 0, typeCategory: "要求减少" },
  { id: "gc-7", type: "不要葱", price: 0, typeCategory: "要求减少" },
];

/**
 * Parse global customizations from Firebase JSON string
 * Expected format: [{ type: "外卖", price: 0, typeCategory: "要求添加" }, ...]
 */
function parseGlobalCustomizations(jsonString: string): GlobalCustomization[] {
  try {
    if (!jsonString) return FALLBACK_GLOBAL_CUSTOMIZATIONS;
    
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return FALLBACK_GLOBAL_CUSTOMIZATIONS;
    
    return parsed.map((item: any, index: number) => ({
      id: `gc-${index}`,
      type: item.type || "",
      price: item.price || 0,
      typeCategory: item.typeCategory || "要求添加",
    }));
  } catch (error) {
    console.error("Error parsing global customizations:", error);
    return FALLBACK_GLOBAL_CUSTOMIZATIONS;
  }
}

/**
 * Group global customizations by category
 */
function groupCustomizations(customizations: GlobalCustomization[]): GlobalCustomizationGroup[] {
  const addItems = customizations.filter((c) => c.typeCategory === "要求添加");
  const removeItems = customizations.filter((c) => c.typeCategory === "要求减少");

  const groups: GlobalCustomizationGroup[] = [];

  if (addItems.length > 0) {
    groups.push({
      category: "要求添加",
      categoryLabel: "Add Requests / 要求添加",
      items: addItems,
    });
  }

  if (removeItems.length > 0) {
    groups.push({
      category: "要求减少",
      categoryLabel: "Remove Requests / 要求减少",
      items: removeItems,
    });
  }

  return groups;
}

interface SelectedOption {
  groupId: string;
  groupName: string;
  selectedChoices: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
}

interface SelectedGlobalCustomization {
  id: string;
  type: string;
  price: number;
  typeCategory: "要求添加" | "要求减少";
}

interface ItemOptionsModalProps {
  visible: boolean;
  item: MenuItem | null;
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
}

export function ItemOptionsModal({
  visible,
  item,
  onClose,
  onConfirm,
}: ItemOptionsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

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
  
  // Global customizations fetched from Firebase
  const [globalCustomizationGroups, setGlobalCustomizationGroups] = useState<GlobalCustomizationGroup[]>([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);

  // Fetch global customizations from Firebase when modal opens
  useEffect(() => {
    if (visible && item) {
      // Reset selections when modal opens
      setSelectedOptions([]);
      setSelectedIngredients([]);
      setSelectedGlobalCustomizations([]);
      
      // Fetch global customizations
      const fetchGlobalCustomizations = async () => {
        try {
          setLoadingCustomizations(true);
          const docRef = doc(db, "TitleLogoNameContent", "aapp-sf-90011-38");
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as { global_customizations?: string };
            const customizationsJson = data.global_customizations;
            
            if (customizationsJson) {
              const customizations = parseGlobalCustomizations(customizationsJson);
              const groups = groupCustomizations(customizations);
              setGlobalCustomizationGroups(groups);
            } else {
              // Use fallback if no data in Firebase
              const groups = groupCustomizations(FALLBACK_GLOBAL_CUSTOMIZATIONS);
              setGlobalCustomizationGroups(groups);
            }
          } else {
            // Use fallback if document doesn't exist
            const groups = groupCustomizations(FALLBACK_GLOBAL_CUSTOMIZATIONS);
            setGlobalCustomizationGroups(groups);
          }
        } catch (error) {
          console.error("Error fetching global customizations:", error);
          // Use fallback on error
          const groups = groupCustomizations(FALLBACK_GLOBAL_CUSTOMIZATIONS);
          setGlobalCustomizationGroups(groups);
        } finally {
          setLoadingCustomizations(false);
        }
      };
      
      fetchGlobalCustomizations();
    }
  }, [visible, item]);

  if (!item) return null;

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

  const allRequiredOptionsSelected = () => {
    if (!item?.optionGroups) return true;
    return item.optionGroups.every((group) => {
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
      <View className="flex-1 bg-white dark:bg-slate-950">
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
          {/* Option Groups */}
          {item.optionGroups && item.optionGroups.length > 0 && (
            <View className="mb-6">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="mb-3 font-bold text-slate-900 dark:text-white"
              >
                Customization
              </Text>

              {item.optionGroups.map((group: OptionGroup) => (
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
                    {group.choices.map((choice) => (
                      <TouchableOpacity
                        key={choice.id}
                        onPress={() =>
                          handleOptionGroupChange(
                            group.id,
                            group.name,
                            choice.id,
                            choice.name,
                            choice.priceAdjustment,
                            group.type === "single"
                          )
                        }
                        className={`flex-row items-center rounded-lg border-2 p-3 ${
                          isOptionGroupSelected(group.id, choice.id)
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                        }`}
                      >
                        <View
                          className={`h-5 w-5 rounded-full border-2 ${
                            isOptionGroupSelected(group.id, choice.id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isOptionGroupSelected(group.id, choice.id) && (
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
                        {choice.priceAdjustment !== undefined && choice.priceAdjustment !== 0 && (
                          <Text
                            style={{ fontSize: responsive.baseFontSize - 2 }}
                            className="font-semibold text-slate-600 dark:text-slate-400"
                          >
                            {choice.priceAdjustment > 0 ? "+" : ""}
                            ${choice.priceAdjustment.toFixed(2)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
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
              >
                Add-ons
              </Text>
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
            >
              Special Requests / 特殊要求
            </Text>

            {loadingCustomizations ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color={colors.tint} />
                <Text className="mt-2 text-slate-500">Loading options...</Text>
              </View>
            ) : globalCustomizationGroups.length > 0 ? (
              globalCustomizationGroups.map((group) => (
                <View key={group.category} className="mb-4">
                  <Text
                    style={{ fontSize: responsive.baseFontSize }}
                    className="mb-2 font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {group.categoryLabel}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map((customization) => (
                      <TouchableOpacity
                        key={customization.id}
                        onPress={() => handleGlobalCustomizationToggle(customization)}
                        className={`rounded-full px-4 py-2 ${
                          isGlobalCustomizationSelected(customization.id)
                            ? group.category === "要求添加"
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
              <Text className="text-slate-500">No customization options available</Text>
            )}
          </View>
        </ScrollView>

        {/* Footer with Action Buttons */}
        <View className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Cancel" variant="outline" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                label="Add to Order"
                onPress={() => {
                  onConfirm(selectedOptions, selectedIngredients, selectedGlobalCustomizations);
                  onClose();
                }}
                disabled={!allRequiredOptionsSelected()}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
