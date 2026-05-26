import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  icon,
  error,
  isPassword = false,
  className,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const responsive = useResponsiveLayout();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${className || ""}`}>
      {label && (
        <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="mb-2 font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <View
          style={{ minHeight: responsive.minTouchTargetSize }}
          className={`flex-row items-center rounded-xl border bg-slate-50 px-4 dark:bg-slate-900 ${
            error
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-700 focus:border-orange-500"
          }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? "#ef4444" : colors.tabIconDefault}
            style={{ marginRight: 12 }}
          />
        )}
        <TextInput
          style={{
            fontSize: responsive.baseFontSize,
            height: "100%", // Fill container height
          }}
          className="flex-1 text-slate-900 dark:text-white"
          placeholderTextColor={colors.tabIconDefault}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={colors.tabIconDefault}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: responsive.baseFontSize - 2 }} className="mt-1.5 text-red-500">{error}</Text>
      )}
    </View>
  );
}

