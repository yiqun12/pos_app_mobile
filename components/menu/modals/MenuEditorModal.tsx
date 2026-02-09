import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ingredient, OptionChoice, OptionGroup } from "@/types/menu";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface MenuEditorModalProps {
  visible: boolean;
  initialName?: string;
  initialPrice?: number;
  initialOptionGroups?: OptionGroup[];
  initialIngredients?: Ingredient[];
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (
    name: string,
    price: number,
    optionGroups?: OptionGroup[],
    ingredients?: Ingredient[]
  ) => void;
}

export function MenuEditorModal({
  visible,
  initialName = "",
  initialPrice,
  initialOptionGroups = [],
  initialIngredients = [],
  mode,
  onClose,
  onSave,
}: MenuEditorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();

  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(
    initialPrice ? initialPrice.toString() : ""
  );
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(initialOptionGroups);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPrice(initialPrice ? initialPrice.toString() : "");
      setOptionGroups(initialOptionGroups);
      setIngredients(initialIngredients);
      setShowAdvanced(false);
    }
  }, [visible, initialName, initialPrice, initialOptionGroups, initialIngredients]);

  const handleSave = () => {
    const priceNum = parseFloat(price);
    if (!name.trim() || isNaN(priceNum)) return;
    onSave(
      name.trim(),
      priceNum,
      optionGroups.length > 0 ? optionGroups : undefined,
      ingredients.length > 0 ? ingredients : undefined
    );
    onClose();
  };

  const addOptionGroup = () => {
    const newGroup: OptionGroup = {
      id: `group-${Date.now()}`,
      name: "New Option",
      type: "single",
      required: false,
      choices: [],
    };
    setOptionGroups([...optionGroups, newGroup]);
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
      name: "New Choice",
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
      name: "New Ingredient",
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
            scrollEnabled={true}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                style={{ fontSize: responsive.subheadingFontSize }}
                className="font-bold text-slate-900 dark:text-white"
              >
                {mode === "add" ? "Add Item" : "Edit Item"}
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
                  Item Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder="e.g. Kung Pao Chicken"
                  placeholderTextColor="#94a3b8"
                  autoFocus={mode === "add"}
                />
              </View>

              <View>
                <Text
                  style={{ fontSize: responsive.baseFontSize - 2 }}
                  className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                >
                  Price ($)
                </Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Advanced Options Toggle */}
              <TouchableOpacity
                onPress={() => setShowAdvanced(!showAdvanced)}
                className="flex-row items-center justify-between rounded-lg bg-slate-100 p-3 dark:bg-slate-800"
              >
                <Text
                  style={{ fontSize: responsive.baseFontSize }}
                  className="font-semibold text-slate-900 dark:text-white"
                >
                  Options & Add-ons
                </Text>
                <Ionicons
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              {/* Option Groups */}
              {showAdvanced && (
                <>
                  <View>
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="font-bold text-slate-900 dark:text-white"
                      >
                        Customization Options
                      </Text>
                      <TouchableOpacity
                        onPress={addOptionGroup}
                        className="rounded-full bg-blue-600 p-2"
                      >
                        <Ionicons name="add" size={20} color="white" />
                      </TouchableOpacity>
                    </View>

                    {optionGroups.map((group, groupIndex) => (
                      <View
                        key={group.id}
                        className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <TextInput
                            value={group.name}
                            onChangeText={(text) =>
                              updateOptionGroup(group.id, "name", text)
                            }
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Option name (e.g. Spice Level)"
                          />
                          <TouchableOpacity
                            onPress={() => removeOptionGroup(group.id)}
                            className="ml-2 rounded-full bg-red-100 p-2 dark:bg-red-900"
                          >
                            <Ionicons name="trash" size={16} color="#dc2626" />
                          </TouchableOpacity>
                        </View>

                        {/* Option Type */}
                        <View className="mb-2 flex-row gap-3">
                          {["single", "multi"].map((type) => (
                            <TouchableOpacity
                              key={type}
                              onPress={() =>
                                updateOptionGroup(group.id, "type", type)
                              }
                              className={`flex-1 rounded-lg px-3 py-2 ${
                                group.type === type
                                  ? "bg-blue-600"
                                  : "bg-slate-200 dark:bg-slate-800"
                              }`}
                            >
                              <Text
                                style={{ fontSize: responsive.baseFontSize - 2 }}
                                className={`text-center font-medium ${
                                  group.type === type
                                    ? "text-white"
                                    : "text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {type === "single" ? "Pick One" : "Pick Many"}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Required Toggle */}
                        <TouchableOpacity
                          onPress={() =>
                            updateOptionGroup(group.id, "required", !group.required)
                          }
                          className="mb-3 flex-row items-center"
                        >
                          <View
                            className={`h-5 w-5 rounded border-2 ${
                              group.required
                                ? "border-blue-600 bg-blue-600"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {group.required && (
                              <View className="flex-1 items-center justify-center">
                                <Ionicons
                                  name="checkmark"
                                  size={12}
                                  color="white"
                                />
                              </View>
                            )}
                          </View>
                          <Text
                            style={{ fontSize: responsive.baseFontSize - 2 }}
                            className="ml-2 text-slate-700 dark:text-slate-300"
                          >
                            Required
                          </Text>
                        </TouchableOpacity>

                        {/* Choices */}
                        <View className="mb-2">
                          <Text
                            style={{ fontSize: responsive.baseFontSize - 2 }}
                            className="mb-2 font-medium text-slate-700 dark:text-slate-300"
                          >
                            Options:
                          </Text>
                          {group.choices.map((choice) => (
                            <View
                              key={choice.id}
                              className="mb-2 flex-row gap-2"
                            >
                              <TextInput
                                value={choice.name}
                                onChangeText={(text) =>
                                  updateChoice(group.id, choice.id, "name", text)
                                }
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="Choice name"
                              />
                              <TextInput
                                value={
                                  choice.priceAdjustment?.toString() || ""
                                }
                                onChangeText={(text) =>
                                  updateChoice(
                                    group.id,
                                    choice.id,
                                    "priceAdjustment",
                                    text ? parseFloat(text) : 0
                                  )
                                }
                                className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="+0.00"
                                keyboardType="decimal-pad"
                              />
                              <TouchableOpacity
                                onPress={() =>
                                  removeChoice(group.id, choice.id)
                                }
                                className="rounded-lg bg-red-100 p-2 dark:bg-red-900"
                              >
                                <Ionicons
                                  name="trash"
                                  size={16}
                                  color="#dc2626"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        {/* Add Choice Button */}
                        <TouchableOpacity
                          onPress={() => addChoiceToGroup(group.id)}
                          className="flex-row items-center justify-center rounded-lg bg-blue-100 py-2 dark:bg-blue-900"
                        >
                          <Ionicons name="add-circle" size={16} color="#2563eb" />
                          <Text
                            style={{ fontSize: responsive.baseFontSize - 2 }}
                            className="ml-1 font-medium text-blue-600"
                          >
                            Add Option
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  {/* Ingredients */}
                  <View>
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text
                        style={{ fontSize: responsive.baseFontSize }}
                        className="font-bold text-slate-900 dark:text-white"
                      >
                        Add-ons / Ingredients
                      </Text>
                      <TouchableOpacity
                        onPress={addIngredient}
                        className="rounded-full bg-blue-600 p-2"
                      >
                        <Ionicons name="add" size={20} color="white" />
                      </TouchableOpacity>
                    </View>

                    {ingredients.map((ingredient) => (
                      <View
                        key={ingredient.id}
                        className="mb-2 flex-row gap-2"
                      >
                        <TextInput
                          value={ingredient.name}
                          onChangeText={(text) =>
                            updateIngredient(ingredient.id, "name", text)
                          }
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          placeholder="Ingredient name"
                        />
                        <TextInput
                          value={
                            ingredient.priceAdjustment?.toString() || ""
                          }
                          onChangeText={(text) =>
                            updateIngredient(
                              ingredient.id,
                              "priceAdjustment",
                              text ? parseFloat(text) : 0
                            )
                          }
                          className="w-16 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          placeholder="+0.00"
                          keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                          onPress={() => removeIngredient(ingredient.id)}
                          className="rounded-lg bg-red-100 p-2 dark:bg-red-900"
                        >
                          <Ionicons name="trash" size={16} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View className="mt-4 flex-row gap-3">
                <View className="flex-1">
                  <Button label="Cancel" variant="outline" onPress={onClose} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Save"
                    onPress={handleSave}
                    disabled={!name.trim() || !price}
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

