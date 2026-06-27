type StoreLike = {
  id: string;
};

export function resolveInitialStoreSelection(
  stores: StoreLike[],
  storedStoreId: string | null
) {
  if (storedStoreId && stores.some((store) => store.id === storedStoreId)) {
    return storedStoreId;
  }
  if (stores.length === 1) return stores[0].id;
  return null;
}
