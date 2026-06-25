import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildTableTimingTimerKey,
  type TableTimingTimer,
} from "@/lib/pos/tableTiming";

const TIMER_INDEX_KEY = "tableTiming:index";

async function readTimerIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(TIMER_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function writeTimerIndex(keys: string[]): Promise<void> {
  await AsyncStorage.setItem(TIMER_INDEX_KEY, JSON.stringify(Array.from(new Set(keys))));
}

export async function saveTableTimingTimer(timer: TableTimingTimer): Promise<string> {
  const key = buildTableTimingTimerKey(timer);
  const keys = await readTimerIndex();
  await Promise.all([
    AsyncStorage.setItem(key, JSON.stringify(timer)),
    writeTimerIndex([...keys, key]),
  ]);
  return key;
}

export async function loadTableTimingTimers(): Promise<Array<{ key: string; timer: TableTimingTimer }>> {
  const keys = await readTimerIndex();
  const entries = await Promise.all(
    keys.map(async (key) => {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      try {
        const timer = JSON.parse(raw) as TableTimingTimer;
        return { key, timer };
      } catch {
        return null;
      }
    })
  );
  const validEntries = entries.filter((entry): entry is { key: string; timer: TableTimingTimer } => entry !== null);
  if (validEntries.length !== keys.length) {
    await writeTimerIndex(validEntries.map((entry) => entry.key));
  }
  return validEntries;
}

export async function removeTableTimingTimer(keyOrTimer: string | TableTimingTimer): Promise<void> {
  const key = typeof keyOrTimer === "string" ? keyOrTimer : buildTableTimingTimerKey(keyOrTimer);
  const keys = await readTimerIndex();
  await Promise.all([
    AsyncStorage.removeItem(key),
    writeTimerIndex(keys.filter((item) => item !== key)),
  ]);
}

export async function removeTableTimingTimersForProduct({
  storeId,
  tableName,
  itemId,
  count,
}: Pick<TableTimingTimer, "storeId" | "tableName" | "itemId" | "count">): Promise<void> {
  await removeTableTimingTimer(buildTableTimingTimerKey({ storeId, tableName, itemId, count }));
}
