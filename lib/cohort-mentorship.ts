export function parseFocusAreas(value: unknown) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(items.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, 8);
}

export function safeMentorshipReturnPath(value: unknown) {
  const path = typeof value === "string" ? value.trim() : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/mentorship";
}
