// client/src/lib/media.js
export const FILTERS = [
  { id: "none", name: "Normal", className: "" },
  { id: "clarendon", name: "Clarendon", className: "filter-clarendon" },
  { id: "gingham", name: "Gingham", className: "filter-gingham" },
  { id: "moon", name: "Moon", className: "filter-moon" },
  { id: "lark", name: "Lark", className: "filter-lark" },
  { id: "warm", name: "Warm", className: "filter-warm" },
  { id: "cool", name: "Cool", className: "filter-cool" },
  { id: "bw", name: "B&W", className: "filter-grayscale" },
  { id: "vintage", name: "Vintage", className: "filter-vintage" },
];

export function filterToClass(filterId = "none") {
  return FILTERS.find((f) => f.id === filterId)?.className || "";
}

export function fileToMediaType(file) {
  if (!file?.type) return "image";
  return file.type.startsWith("video/") ? "video" : "image";
}
