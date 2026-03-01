export const PRODUCT_SIZES = {
  "Free Size": { label: "Free Size", sortOrder: 0 },
  XS: { label: "Extra Small", sortOrder: 1 },
  S: { label: "Small", sortOrder: 2 },
  M: { label: "Medium", sortOrder: 3 },
  L: { label: "Large", sortOrder: 4 },
  XL: { label: "Extra Large", sortOrder: 5 },
  XXL: { label: "Double Extra Large", sortOrder: 6 },
  "3XL": { label: "Triple Extra Large", sortOrder: 7 },
} as const;

export const PRODUCT_COLORS = {
  Black: { hex: "#000000", tailwindClass: "bg-black" },
  White: { hex: "#FFFFFF", tailwindClass: "bg-white" },
  Gray: { hex: "#6B7280", tailwindClass: "bg-gray-500" },
  Silver: { hex: "#D1D5DB", tailwindClass: "bg-gray-300" },
  "Midnight Blue": { hex: "#191970", tailwindClass: "bg-blue-950" },
  Navy: { hex: "#000080", tailwindClass: "bg-blue-900" },
  Blue: { hex: "#3B82F6", tailwindClass: "bg-blue-500" },
  "Sky Blue": { hex: "#87CEEB", tailwindClass: "bg-sky-400" },
  "Crimson Red": { hex: "#DC143C", tailwindClass: "bg-red-700" },
  Red: { hex: "#EF4444", tailwindClass: "bg-red-500" },
  Maroon: { hex: "#800000", tailwindClass: "bg-rose-900" },
  "Emerald Green": { hex: "#50C878", tailwindClass: "bg-emerald-500" },
  Green: { hex: "#22C55E", tailwindClass: "bg-green-500" },
  Olive: { hex: "#808000", tailwindClass: "bg-lime-800" },
  Yellow: { hex: "#EAB308", tailwindClass: "bg-yellow-500" },
  Gold: { hex: "#FFD700", tailwindClass: "bg-yellow-400" },
  Orange: { hex: "#F97316", tailwindClass: "bg-orange-500" },
  Peach: { hex: "#FFDAB9", tailwindClass: "bg-orange-200" },
  Purple: { hex: "#A855F7", tailwindClass: "bg-purple-500" },
  Lavender: { hex: "#E6E6FA", tailwindClass: "bg-purple-200" },
  Pink: { hex: "#EC4899", tailwindClass: "bg-pink-500" },
  Rose: { hex: "#FFE4E1", tailwindClass: "bg-rose-200" },
  Brown: { hex: "#8B4513", tailwindClass: "bg-amber-900" },
  Tan: { hex: "#D2B48C", tailwindClass: "bg-amber-200" },
  Cream: { hex: "#FFFDD0", tailwindClass: "bg-yellow-50" },
  Beige: { hex: "#F5F5DC", tailwindClass: "bg-stone-200" },
  Multicolor: {
    hex: "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
    tailwindClass: "bg-gradient-to-r from-red-500 via-green-500 to-blue-500",
  },
} as const;

export const VALID_SIZES = Object.keys(PRODUCT_SIZES) as [
  keyof typeof PRODUCT_SIZES,
  ...Array<keyof typeof PRODUCT_SIZES>,
];
export const VALID_COLORS = Object.keys(PRODUCT_COLORS) as [
  keyof typeof PRODUCT_COLORS,
  ...Array<keyof typeof PRODUCT_COLORS>,
];

export type ProductSize = keyof typeof PRODUCT_SIZES;
export type ProductColor = keyof typeof PRODUCT_COLORS;
