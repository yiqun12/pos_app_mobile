function splitBilingualText(value: string) {
  const [english, chinese] = value.split(/\s+\/\s+/, 2);
  return {
    english: english?.trim() || "",
    chinese: chinese?.trim() || "",
  };
}

export function autoFillChineseName(
  rawName: string,
  currentChineseName: string
) {
  const current = currentChineseName.trim();
  if (current) return current;
  const split = splitBilingualText(rawName);
  return split.chinese || rawName.trim();
}

export function autoFillEnglishName(
  currentEnglishName: string,
  sourceName: string
) {
  const current = currentEnglishName.trim();
  if (current) return current;
  const split = splitBilingualText(sourceName);
  return split.english || sourceName.trim();
}
