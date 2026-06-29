/** Default dine-in menu QR URL — aligned with eatifyPos store QR pattern. */
export function defaultMenuUrl(storeId: string): string {
  return `https://7dollar.delivery/store?store=${storeId}`;
}
