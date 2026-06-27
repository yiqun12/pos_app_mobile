/** Mirrors eatifyPos demoFood store ID generation (without pinyin dependency). */

function convertStoreName(storeName: string): string {
  const trimmed = storeName.trim();
  if (!trimmed) return "store";
  if (/[\u3400-\u9FBF]/.test(trimmed)) return "store";
  if (/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, "");
  }
  return "store";
}

export function getCityInitials(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return "XX";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 4);
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function generateStoreId(
  input: { storeName: string; city: string; zipCode: string },
  existingIds: string[]
): string | null {
  const firstWord = convertStoreName(input.storeName).split(" ")[0] || "store";
  const cityInitials = getCityInitials(input.city);
  const zipCode = input.zipCode.replace(/\D/g, "").slice(0, 5) || "00000";

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const suffix = Math.floor(Math.random() * 1000);
    const id = `${firstWord}-${cityInitials}-${zipCode}-${suffix}`.toLowerCase();
    if (!existingIds.includes(id)) return id;
  }

  return null;
}
