import {
  addSplitGroup,
  checkoutSplitGroup,
  createSplitGroups,
  deleteSplitGroup,
  getSplitGroupCheckoutProducts,
  getSplitGroupDisplayItems,
  getSplitGroupSubtotal,
  markSplitGroupsDirty,
  moveSplitItem,
  type SplitGroupsState,
} from "@/lib/pos/splitPayment";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export type SplitPaymentPayload = {
  groupId: string;
  amount: number;
  subtotal: number;
  products: Array<Record<string, any>>;
};

type SplitPaymentModalProps = {
  visible: boolean;
  products: Array<Record<string, any>>;
  total: number;
  remaining: number;
  onClose: () => void;
  onConfirm: (payload: SplitPaymentPayload) => Promise<boolean>;
};

type MoveContext = {
  fromGroupId: string;
  product: Record<string, any>;
};

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function productKey(product: Record<string, any>): string {
  return String(product.count ?? product.id);
}

function productName(product: Record<string, any>): string {
  if (product.CHI && product.CHI !== product.name) return `${product.name ?? "Untitled"} / ${product.CHI}`;
  return product.name ?? "Untitled";
}

function quantityOf(product: Record<string, any>): number {
  return typeof product.quantity === "number" && Number.isFinite(product.quantity)
    ? product.quantity
    : 1;
}

function paymentAmountForSubtotal({
  subtotal,
  totalSubtotal,
  total,
  remaining,
}: {
  subtotal: number;
  totalSubtotal: number;
  total: number;
  remaining: number;
}): number {
  if (subtotal <= 0 || totalSubtotal <= 0 || total <= 0) return 0;
  return Math.min(remaining, Math.round((total * (subtotal / totalSubtotal) + Number.EPSILON) * 100) / 100);
}

export function SplitPaymentModal({
  visible,
  products,
  total,
  remaining,
  onClose,
  onConfirm,
}: SplitPaymentModalProps) {
  const { width } = useWindowDimensions();
  const [state, setState] = useState<SplitGroupsState>(() => createSplitGroups(products));
  const [minUnit, setMinUnit] = useState(1);
  const [moveContext, setMoveContext] = useState<MoveContext | null>(null);
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [payingGroupId, setPayingGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setState(createSplitGroups(products));
    setMinUnit(1);
    setMoveContext(null);
    setMoveQuantity(1);
    setPayingGroupId(null);
  }, [products, visible]);

  const groups = useMemo(() => Object.values(state.groups), [state.groups]);
  const displayPaidSubtotal = state.paidSubtotal;
  const displayTotalSubtotal = state.totalSubtotal;
  const isCompactLayout = width < 700;

  const openMove = (fromGroupId: string, product: Record<string, any>) => {
    if (state.groups[fromGroupId]?.paid) return;
    setMoveContext({ fromGroupId, product });
    setMoveQuantity(Math.min(quantityOf(product), 1));
  };

  const applyMove = (toGroupId: string) => {
    if (!moveContext) return;
    setState((current) =>
      moveSplitItem(current, {
        fromGroupId: moveContext.fromGroupId,
        toGroupId,
        count: productKey(moveContext.product),
        quantity: moveQuantity,
      })
    );
    setMoveContext(null);
  };

  const payGroup = async (groupId: string) => {
    const group = state.groups[groupId];
    if (!group || group.paid || group.items.length === 0) return;
    const subtotal = getSplitGroupSubtotal(group, state);
    const amount = paymentAmountForSubtotal({
      subtotal,
      totalSubtotal: state.totalSubtotal,
      total,
      remaining,
    });
    if (amount <= 0) return;

    setPayingGroupId(groupId);
    const success = await onConfirm({
      groupId,
      amount,
      subtotal,
      products: getSplitGroupCheckoutProducts(group, state),
    });
    setPayingGroupId(null);
    if (success) {
      setState((current) => checkoutSplitGroup(current, groupId));
    }
  };

  const cycleMinUnit = () => {
    const nextMinUnit = Math.max(1, Object.keys(state.groups).length);
    setMinUnit(nextMinUnit);
    setState((current) => markSplitGroupsDirty(current));
  };

  const groupTools = (
    <View style={isCompactLayout ? styles.compactTools : styles.toolsColumn}>
      <TouchableOpacity
        onPress={() => setState((current) => addSplitGroup(current))}
        style={isCompactLayout ? styles.compactToolButton : styles.toolButton}
      >
        <Text style={styles.toolButtonText}>Add New Group</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={cycleMinUnit}
        style={isCompactLayout ? styles.compactToolButtonDark : styles.toolButtonDark}
      >
        <Text style={styles.toolButtonText}>
          Set Min Unit: {minUnit === 1 ? "" : `1/${minUnit}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
  const compactTools = isCompactLayout ? groupTools : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.closeRow}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <View style={styles.webSummary}>
            <TouchableOpacity
              onPress={() => setState(createSplitGroups(products))}
              style={[styles.smallButton, styles.resetButton]}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.summaryLine}>Paid Subtotal: {money(displayPaidSubtotal)}</Text>
              <Text style={styles.summaryLine}>Total Subtotal: {money(displayTotalSubtotal)}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator style={styles.groupsScroller}>
            {groups.map((group) => {
              const subtotal = getSplitGroupSubtotal(group, state);
              const displayItems = getSplitGroupDisplayItems(group, state);
              const paymentAmount = paymentAmountForSubtotal({
                subtotal,
                totalSubtotal: state.totalSubtotal,
                total,
                remaining,
              });
              return (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View>
                      <Text style={styles.groupTitle}>{group.id}</Text>
                      <Text style={styles.groupSubtitle}>{money(subtotal)}</Text>
                    </View>
                    {group.id !== "group0" && !group.paid ? (
                      <TouchableOpacity
                        onPress={() => setState((current) => deleteSplitGroup(current, group.id))}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {group.paid ? (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={styles.paidText}>{group.id} is paid</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.groupItems} showsVerticalScrollIndicator={false}>
                      {group.items.length === 0 ? (
                        <Text style={styles.emptyText}>No items</Text>
                      ) : displayItems.map((product, index) => (
                        <TouchableOpacity
                          key={`${productKey(product)}-${index}`}
                          onPress={() => openMove(group.id, group.items[index])}
                          style={styles.itemCard}
                        >
                          <Text style={styles.itemName}>{productName(product)}</Text>
                          <Text style={styles.itemMeta}>
                            x {quantityOf(product)} · {money(getSplitGroupSubtotal({ id: "item", items: [product], paid: false }))}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {!group.paid ? (
                    <TouchableOpacity
                      disabled={group.items.length === 0 || payingGroupId !== null}
                      onPress={() => void payGroup(group.id)}
                      style={[
                        styles.payButton,
                        group.items.length === 0 || payingGroupId !== null ? styles.disabled : null,
                      ]}
                    >
                      <Text style={styles.payButtonText}>
                        {payingGroupId === group.id ? "Paying..." : `Pay ${money(paymentAmount)}`}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}

            {!isCompactLayout ? groupTools : null}
          </ScrollView>

          {isCompactLayout ? compactTools : null}
        </View>

        {moveContext ? (
          <View style={styles.moveOverlay}>
            <View style={styles.movePanel}>
              <Text style={styles.moveTitle}>Move Item</Text>
              <Text style={styles.moveItemName}>{productName(moveContext.product)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  onPress={() => setMoveQuantity((value) => Math.max(1, value - 1))}
                  style={styles.qtyButton}
                >
                  <Ionicons name="remove" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{Math.round((moveQuantity / state.splitDivisor) * 100) / 100}</Text>
                <TouchableOpacity
                  onPress={() => setMoveQuantity((value) => Math.min(quantityOf(moveContext.product), value + 1))}
                  style={styles.qtyButton}
                >
                  <Ionicons name="add" size={20} color="#0f172a" />
                </TouchableOpacity>
              </View>
              <Text style={styles.moveLabel}>Move to</Text>
              {groups
                .filter((group) => group.id !== moveContext.fromGroupId && !group.paid)
                .map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => applyMove(group.id)}
                    style={styles.targetButton}
                  >
                    <Text style={styles.targetButtonText}>{group.id}</Text>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity onPress={() => setMoveContext(null)} style={styles.cancelMoveButton}>
                <Text style={styles.cancelMoveText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    padding: 12,
  },
  panel: {
    maxHeight: "92%",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
  },
  closeRow: {
    marginBottom: -8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  iconButton: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
  },
  webSummary: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  smallButton: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: "#ef4444",
  },
  resetButtonText: {
    fontWeight: "700",
    color: "#fff",
  },
  summaryLine: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  groupsScroller: {
    maxHeight: 470,
  },
  groupCard: {
    width: 240,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    padding: 10,
  },
  groupHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  groupSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: "#f97316",
  },
  deleteButton: {
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  paidBadge: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  paidText: {
    fontWeight: "700",
    color: "#166534",
  },
  groupItems: {
    minHeight: 230,
    maxHeight: 230,
  },
  emptyText: {
    paddingVertical: 18,
    textAlign: "center",
    color: "#94a3b8",
  },
  itemCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 10,
  },
  itemName: {
    fontWeight: "700",
    color: "#0f172a",
  },
  itemMeta: {
    marginTop: 4,
    color: "#64748b",
  },
  payButton: {
    marginTop: 10,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f97316",
  },
  payButtonText: {
    fontWeight: "800",
    color: "#fff",
  },
  toolsColumn: {
    width: 230,
    gap: 12,
    alignItems: "center",
  },
  toolButton: {
    width: 220,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
  },
  toolButtonDark: {
    width: 220,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
  },
  compactTools: {
    marginTop: 12,
    gap: 8,
  },
  compactToolButton: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
  },
  compactToolButtonDark: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
  },
  toolButtonText: {
    fontWeight: "800",
    color: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
  moveOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    padding: 18,
  },
  movePanel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 16,
  },
  moveTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  moveItemName: {
    marginTop: 6,
    fontWeight: "700",
    color: "#334155",
  },
  qtyRow: {
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  qtyButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
  },
  qtyText: {
    minWidth: 80,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  moveLabel: {
    marginBottom: 8,
    fontWeight: "700",
    color: "#64748b",
  },
  targetButton: {
    marginBottom: 8,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f97316",
  },
  targetButtonText: {
    fontWeight: "800",
    color: "#fff",
  },
  cancelMoveButton: {
    marginTop: 4,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
  },
  cancelMoveText: {
    fontWeight: "800",
    color: "#334155",
  },
});
