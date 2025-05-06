export const MovieClassEnum = {
  B_: { icon: "/images/icons/B.png", label: "No age restrictions" },
  C_: { icon: "/images/icons/C.png", label: "Forbidden under 12" },
  C_PLUS: { icon: "/images/icons/C_PLUS.png", label: "Forbidden under 14" },
  D_: { icon: "/images/icons/D.png", label: "Forbidden under 16" },
  X_: { icon: "/images/icons/X.png", label: "Forbidden under 18" },
  TBC: { icon: "/images/icons/TBC.png", label: "Uncategorized" }
};

// По избор: масив от опции за селектор
export const MovieClassOptions = Object.entries(MovieClassEnum).map(([key, { icon, label }]) => ({
  value: key,
  label,
  icon
}));