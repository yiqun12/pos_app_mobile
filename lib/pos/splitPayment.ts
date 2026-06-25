type SplitOrderLike = {
  subtotal: number;
  taxableSubtotal?: number;
  taxAmount: number;
  serviceFee: number;
  tips?: number;
  discount?: number;
  total: number;
};

export type SplitPaymentMetadata = {
  subtotal: number;
  tax: number;
  service_fee: number;
  tips: number;
  discount: number;
  total: number;
  isDine: true;
};

export type SplitPaymentBreakdown = {
  basePayment: number;
  nextPaidAmount: number;
  remainingAfterPayment: number;
  isFullPayment: boolean;
  ratio: number;
  metadata: SplitPaymentMetadata;
};

export type SplitGroup = {
  id: string;
  items: Array<Record<string, any>>;
  paid: boolean;
};

export type SplitGroupsState = {
  groups: Record<string, SplitGroup>;
  paidSubtotal: number;
  totalSubtotal: number;
  groupCounter: number;
  dirty: boolean;
  splitDivisor: number;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function readMoney(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function buildSplitPaymentBreakdown({
  order,
  amount,
  paidAmount,
}: {
  order: SplitOrderLike;
  amount: number;
  paidAmount: number;
}): SplitPaymentBreakdown {
  const total = roundMoney(Math.max(0, order.total));
  const paid = roundMoney(Math.max(0, paidAmount));
  const remaining = roundMoney(Math.max(0, total - paid));
  const basePayment = roundMoney(Math.min(Math.max(0, amount), remaining));
  const nextPaidAmount = roundMoney(Math.min(total, paid + basePayment));
  const ratio = total > 0 ? basePayment / total : 0;

  return {
    basePayment,
    nextPaidAmount,
    remainingAfterPayment: roundMoney(Math.max(0, total - nextPaidAmount)),
    isFullPayment: total > 0 && nextPaidAmount >= total,
    ratio,
    metadata: {
      subtotal: roundMoney((order.taxableSubtotal ?? order.subtotal) * ratio),
      tax: roundMoney(order.taxAmount * ratio),
      service_fee: roundMoney(order.serviceFee * ratio),
      tips: roundMoney((order.tips ?? 0) * ratio),
      discount: roundMoney((order.discount ?? 0) * ratio),
      total: basePayment,
      isDine: true,
    },
  };
}

export function getSplitProductsTotal(products: Array<Record<string, any>>): number {
  return roundMoney(products.reduce((sum, product) =>
    sum + readMoney(product.itemTotalPrice ?? product.subtotal), 0));
}

export function buildSplitReceiptProducts({
  products,
  selectedCounts,
}: {
  products: Array<Record<string, any>>;
  selectedCounts?: Array<string | number>;
}): Array<Record<string, any>> {
  if (!selectedCounts || selectedCounts.length === 0) return products;
  const selected = new Set(selectedCounts.map(String));
  return products.filter((product) => selected.has(String(product.count ?? product.id)));
}

function productKey(product: Record<string, any>): string {
  return String(product.count ?? product.id);
}

function cloneProductWithQuantity(product: Record<string, any>, quantity: number): Record<string, any> {
  const originalQuantity = Math.max(1, readMoney(product.quantity) || 1);
  const unitTotal = readMoney(product.itemTotalPrice ?? product.subtotal) / originalQuantity;
  return {
    ...product,
    quantity,
    itemTotalPrice: roundMoney(unitTotal * quantity),
  };
}

function cloneProductForSplitDivisor(
  product: Record<string, any>,
  divisor: number,
  { prefixName = false }: { prefixName?: boolean } = {}
): Record<string, any> {
  const safeDivisor = Math.max(1, divisor);
  const quantity = roundMoney((readMoney(product.quantity) || 1) / safeDivisor);
  const itemTotalPrice = roundMoney(readMoney(product.itemTotalPrice ?? product.subtotal) / safeDivisor);
  const nextProduct: Record<string, any> = {
    ...product,
    quantity,
    itemTotalPrice,
  };
  if (product.subtotal !== undefined) {
    nextProduct.subtotal = roundMoney(readMoney(product.subtotal) / safeDivisor).toFixed(2);
  }
  if (prefixName && safeDivisor > 1 && typeof product.name === "string" && !product.name.startsWith("#@%")) {
    nextProduct.name = `#@%${safeDivisor}#@%${product.name}`;
  }
  return nextProduct;
}

function mergeProducts(products: Array<Record<string, any>>): Array<Record<string, any>> {
  const merged = new Map<string, Record<string, any>>();
  products.forEach((product) => {
    const key = `${product.id}-${productKey(product)}-${JSON.stringify(product.attributeSelected ?? {})}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...product });
      return;
    }
    merged.set(key, {
      ...existing,
      quantity: readMoney(existing.quantity) + readMoney(product.quantity),
      itemTotalPrice: roundMoney(readMoney(existing.itemTotalPrice) + readMoney(product.itemTotalPrice)),
    });
  });
  return Array.from(merged.values());
}

export function getSplitGroupDisplayItems(group: SplitGroup, state?: SplitGroupsState): Array<Record<string, any>> {
  const divisor = state?.splitDivisor ?? 1;
  return group.items.map((product) => cloneProductForSplitDivisor(product, divisor));
}

export function getSplitGroupCheckoutProducts(group: SplitGroup, state?: SplitGroupsState): Array<Record<string, any>> {
  const divisor = state?.splitDivisor ?? 1;
  return group.items.map((product) => cloneProductForSplitDivisor(product, divisor, { prefixName: true }));
}

export function getSplitGroupSubtotal(group: SplitGroup, state?: SplitGroupsState): number {
  return getSplitProductsTotal(getSplitGroupDisplayItems(group, state));
}

export function createSplitGroups(products: Array<Record<string, any>>): SplitGroupsState {
  return {
    groups: {
      group0: {
        id: "group0",
        items: products.map((product) => ({ ...product })),
        paid: false,
      },
    },
    paidSubtotal: 0,
    totalSubtotal: getSplitProductsTotal(products),
    groupCounter: 1,
    dirty: false,
    splitDivisor: 1,
  };
}

export function addSplitGroup(state: SplitGroupsState): SplitGroupsState {
  const nextId = `group${state.groupCounter}`;
  const mainItems = state.groups.group0?.items ?? [];
  const nextGroupCount = Object.keys(state.groups).length + 1;
  return {
    ...state,
    groupCounter: state.groupCounter + 1,
    splitDivisor: state.dirty ? state.splitDivisor : nextGroupCount,
    groups: {
      ...state.groups,
      [nextId]: {
        id: nextId,
        items: state.dirty ? [] : mainItems.map((product) => ({ ...product })),
        paid: false,
      },
    },
  };
}

export function markSplitGroupsDirty(state: SplitGroupsState): SplitGroupsState {
  return {
    ...state,
    dirty: true,
    splitDivisor: Math.max(1, Object.keys(state.groups).length),
  };
}

export function moveSplitItem(
  state: SplitGroupsState,
  {
    fromGroupId,
    toGroupId,
    count,
    quantity,
  }: {
    fromGroupId: string;
    toGroupId: string;
    count: string | number;
    quantity: number;
  }
): SplitGroupsState {
  if (fromGroupId === toGroupId) return state;
  const fromGroup = state.groups[fromGroupId];
  const toGroup = state.groups[toGroupId];
  if (!fromGroup || !toGroup || fromGroup.paid || toGroup.paid) return state;

  const target = fromGroup.items.find((product) => productKey(product) === String(count));
  if (!target) return state;
  const availableQuantity = Math.max(1, readMoney(target.quantity) || 1);
  const movedQuantity = Math.min(Math.max(1, quantity), availableQuantity);
  const movedProduct = cloneProductWithQuantity(target, movedQuantity);
  const remainingQuantity = roundMoney(availableQuantity - movedQuantity);
  const nextFromItems = remainingQuantity > 0
    ? fromGroup.items.map((product) =>
        productKey(product) === String(count)
          ? cloneProductWithQuantity(product, remainingQuantity)
          : product
      )
    : fromGroup.items.filter((product) => productKey(product) !== String(count));

  return {
    ...state,
    dirty: true,
    groups: {
      ...state.groups,
      [fromGroupId]: {
        ...fromGroup,
        items: nextFromItems,
      },
      [toGroupId]: {
        ...toGroup,
        items: mergeProducts([...toGroup.items, movedProduct]),
      },
    },
  };
}

export function deleteSplitGroup(state: SplitGroupsState, groupId: string): SplitGroupsState {
  if (groupId === "group0") return state;
  const group = state.groups[groupId];
  const mainGroup = state.groups.group0;
  if (!group || !mainGroup || group.paid) return state;
  const { [groupId]: _removed, ...remainingGroups } = state.groups;
  if (!state.dirty) {
    const renumbered: Record<string, SplitGroup> = {
      group0: mainGroup,
    };
    Object.values(remainingGroups)
      .filter((candidate) => candidate.id !== "group0")
      .forEach((candidate, index) => {
        const id = `group${index + 1}`;
        renumbered[id] = { ...candidate, id };
      });
    return {
      ...state,
      groups: renumbered,
      groupCounter: Object.keys(renumbered).length,
      splitDivisor: Math.max(1, Object.keys(renumbered).length),
    };
  }

  const renumbered: Record<string, SplitGroup> = {
    group0: {
      ...mainGroup,
      items: mergeProducts([...mainGroup.items, ...group.items]),
    },
  };
  Object.values(remainingGroups)
    .filter((candidate) => candidate.id !== "group0")
    .forEach((candidate, index) => {
      const id = `group${index + 1}`;
      renumbered[id] = { ...candidate, id };
    });
  return {
    ...state,
    groups: renumbered,
    groupCounter: Object.keys(renumbered).length,
  };
}

export function checkoutSplitGroup(state: SplitGroupsState, groupId: string): SplitGroupsState {
  const group = state.groups[groupId];
  if (!group || group.paid || group.items.length === 0) return state;
  return {
    ...state,
    paidSubtotal: roundMoney(state.paidSubtotal + getSplitGroupSubtotal(group, state)),
    groups: {
      ...state.groups,
      [groupId]: {
        ...group,
        paid: true,
      },
    },
  };
}
