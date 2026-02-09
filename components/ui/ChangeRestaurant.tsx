import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

type Props = {
  restaurantName?: string;
  restaurants?: string[];
  onSelect?: (name: string) => void;
};

const DEFAULT_RESTAURANTS = [
  "Downtown Kitchen",
  "Uptown Grill",
  "Lakeside Cafe",
  "Hilltop Deli",
];

export function ChangeRestaurant({
  restaurantName,
  restaurants,
  onSelect,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const options = useMemo(
    () => restaurants ?? DEFAULT_RESTAURANTS,
    [restaurants]
  );

  const [selected, setSelected] = useState(restaurantName ?? options[0]);
  const [visible, setVisible] = useState(false);

  const handleSelect = (name: string) => {
    setSelected(name);
    onSelect?.(name);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Change restaurant"
        onPress={() => setVisible(true)}
        style={[
          styles.iconButton,
          { borderColor: colors.icon, backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="storefront-outline" size={20} color={colors.text} />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            // accessibilityRole="dialog"
            accessibilityLabel="Select restaurant"
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontSize: responsive.subheadingFontSize }]}>
                Select Restaurant
              </Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={colors.icon} />
              </TouchableOpacity>
            </View>
            {options.map((name) => {
              const isActive = name === selected;
              return (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.option,
                    isActive && { borderColor: colors.tint },
                  ]}
                  onPress={() => handleSelect(name)}
                >
                  <Text style={[styles.optionText, { color: colors.text, fontSize: responsive.baseFontSize }]}>
                    {name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color={colors.tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
