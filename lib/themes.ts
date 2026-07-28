export const THEMES = [
  { name: "Espresso", from: "#3B2A20", to: "#7A5236" },
  { name: "Indigo",   from: "#4338CA", to: "#7C6BF6" },
  { name: "Emerald",  from: "#065F46", to: "#10B981" },
  { name: "Rosé",     from: "#9F1239", to: "#FB7185" },
  { name: "Graphit",  from: "#111827", to: "#3B4252" },
  { name: "Gold",     from: "#92400E", to: "#F59E0B" },
];
export const themeGradient = (i: number) => {
  const t = THEMES[i] ?? THEMES[0];
  return `linear-gradient(140deg, ${t.from}, ${t.to})`;
};
