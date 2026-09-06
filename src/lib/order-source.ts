export const ORDER_SOURCES = ["hoopla", "onecafe"] as const;

export function formatOrderSource(source?: string): string {
  const value = source?.trim();
  if (!value) return "—";

  switch (value.toLowerCase()) {
    case "hoopla":
      return "Hoopla";
    case "onecafe":
      return "OneCafe";
    default:
      return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}

export function orderSourceVariant(source?: string): "outline" | "secondary" {
  return source?.trim().toLowerCase() === "onecafe" ? "secondary" : "outline";
}
