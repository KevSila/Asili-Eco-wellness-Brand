export const cleanText = (value: unknown, maxLength = 1000) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
