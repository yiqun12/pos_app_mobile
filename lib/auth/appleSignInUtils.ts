export const APPLE_NONCE_CHARSET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";

export type AppleFullNameLike =
  | {
      givenName?: string | null;
      middleName?: string | null;
      familyName?: string | null;
      nickname?: string | null;
    }
  | null
  | undefined;

export function createAppleRawNonce(
  length = 32,
  random: () => number = Math.random
): string {
  return Array.from({ length }, () => {
    const index = Math.floor(random() * APPLE_NONCE_CHARSET.length);
    return APPLE_NONCE_CHARSET[index] ?? APPLE_NONCE_CHARSET[0];
  }).join("");
}

export function formatAppleFullName(fullName: AppleFullNameLike): string | undefined {
  const parts = [
    fullName?.givenName,
    fullName?.middleName,
    fullName?.familyName,
    fullName?.nickname,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" ") : undefined;
}
