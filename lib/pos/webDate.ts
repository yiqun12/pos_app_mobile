export function formatWebDate(date = new Date()): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}-${iso.slice(14, 16)}-${iso.slice(17, 19)}-${iso.slice(20, 22)}`;
}
