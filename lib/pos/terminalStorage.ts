import AsyncStorage from "@react-native-async-storage/async-storage";

const selectedTerminalKey = (storeId: string) => `@pos:selectedTerminal:${storeId}`;

export async function getSelectedTerminalId(storeId: string): Promise<string | null> {
  return AsyncStorage.getItem(selectedTerminalKey(storeId)).catch(() => null);
}

export async function setSelectedTerminalId(
  storeId: string,
  terminalId: string
): Promise<void> {
  await AsyncStorage.setItem(selectedTerminalKey(storeId), terminalId);
}
