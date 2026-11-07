const swatches: Record<string, string> = {
  ivory: "#f3eee6",
  sand: "#d7c2a4",
  black: "#1c1c1c",
  olive: "#5c6748",
  clay: "#c4a484",
  indigo: "#3d4c6b",
  forest: "#3f5344",
  ecru: "#f3ead7",
  charcoal: "#3a3a3a",
  stone: "#cfc6ba",
  sage: "#9aab96",
  white: "#f7f4ef",
  navy: "#243044",
  brown: "#8a6a52",
};

export function swatchColor(name: string) {
  return swatches[name.trim().toLowerCase()] ?? "#d9d3cb";
}
