import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useOtaUpdate } from "@/context/ota-update";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getOtaUpdatePromptModel } from "@/lib/updates/otaUpdateState";

export function OtaUpdateModal() {
  const responsive = useResponsiveLayout();
  const { status, errorMessage, applyUpdate } = useOtaUpdate();
  const model = useMemo(
    () => getOtaUpdatePromptModel({ status, errorMessage }),
    [status, errorMessage]
  );

  return (
    <Modal
      visible={model.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => undefined}
    >
      <View style={styles.backdrop}>
        {model.visible ? (
          <View
            style={[
              styles.card,
              {
                width: responsive.isTablet ? 420 : "86%",
                padding: responsive.isTablet ? 24 : 20,
              },
            ]}
          >
            <View style={styles.iconWrap}>
              {model.loading ? (
                <ActivityIndicator size="small" color="#F97316" />
              ) : (
                <Ionicons name="cloud-download" size={28} color="#F97316" />
              )}
            </View>

            <Text
              style={[styles.title, { fontSize: responsive.headingFontSize - 3 }]}
              numberOfLines={2}
            >
              {model.title}
            </Text>
            <Text
              style={[styles.message, { fontSize: responsive.baseFontSize - 1 }]}
            >
              {model.message}
            </Text>

            <TouchableOpacity
              onPress={applyUpdate}
              disabled={model.loading}
              activeOpacity={0.8}
              style={[
                styles.actionButton,
                { minHeight: responsive.minTouchTargetSize },
                model.loading ? styles.actionButtonDisabled : null,
              ]}
            >
              {model.loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : null}
              <Text
                style={[
                  styles.actionText,
                  {
                    marginLeft: model.loading ? 8 : 0,
                    fontSize: responsive.baseFontSize,
                  },
                ]}
              >
                {model.actionLabel}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    paddingHorizontal: 20,
  },
  card: {
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEDD5",
  },
  title: {
    marginTop: 16,
    color: "#111827",
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: "#64748B",
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },
  actionButton: {
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F97316",
    paddingHorizontal: 18,
  },
  actionButtonDisabled: {
    opacity: 0.8,
  },
  actionText: {
    color: "white",
    fontWeight: "800",
  },
});
