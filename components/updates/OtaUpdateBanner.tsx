import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useOtaUpdate } from "@/context/ota-update";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getOtaUpdateBannerModel } from "@/lib/updates/otaUpdateState";

export function OtaUpdateBanner() {
  const responsive = useResponsiveLayout();
  const { status, dismissed, errorMessage, applyUpdate, dismiss } =
    useOtaUpdate();
  const model = useMemo(
    () => getOtaUpdateBannerModel({ status, dismissed, errorMessage }),
    [status, dismissed, errorMessage]
  );

  if (!model.visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: responsive.isTablet ? 18 : 14,
          paddingVertical: responsive.isTablet ? 10 : 9,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        {model.loading ? (
          <ActivityIndicator size="small" color="#F97316" />
        ) : (
          <Ionicons name="cloud-download" size={18} color="#F97316" />
        )}
      </View>

      <View style={styles.copy}>
        <Text
          style={[styles.title, { fontSize: responsive.baseFontSize - 2 }]}
          numberOfLines={1}
        >
          {model.title}
        </Text>
        <Text
          style={[styles.message, { fontSize: responsive.captionFontSize }]}
          numberOfLines={1}
        >
          {model.message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={applyUpdate}
        disabled={model.loading}
        activeOpacity={0.75}
        style={[
          styles.actionButton,
          { minHeight: responsive.minTouchTargetSize - 8 },
          model.loading ? styles.actionButtonDisabled : null,
        ]}
      >
        <Text
          style={[
            styles.actionText,
            { fontSize: responsive.captionFontSize + 1 },
          ]}
        >
          {model.actionLabel}
        </Text>
      </TouchableOpacity>

      {model.canDismiss ? (
        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.75}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={18} color="#9A3412" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FDBA74",
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDD5",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#111827",
    fontWeight: "700",
  },
  message: {
    marginTop: 1,
    color: "#9A3412",
    fontWeight: "500",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#F97316",
    paddingHorizontal: 13,
  },
  actionButtonDisabled: {
    opacity: 0.72,
  },
  actionText: {
    color: "white",
    fontWeight: "800",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDD5",
  },
});
