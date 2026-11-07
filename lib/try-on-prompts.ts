export const DEFAULT_TRY_ON_PROMPT =
  "Replace the clothing item in the first image with the product shown in the other image. The product photo may show that item on a person. Extract only the product itself. Ignore the model's body, face, and every other garment or accessory in that photo, including shoes, jewelry, bags, hats, belts, watches, and sunglasses. Keep the person's face, skin tone, hair, pose, body shape, proportions, and lighting exactly the same. The person must remain fully clothed. Apply the product with realistic fabric drape, fit, seams, textures, and true colour.";

export const DEFAULT_TRY_ON_NEGATIVE_PROMPT =
  "nudity, naked, nude, exposed, bare skin, NSFW, explicit, inappropriate, face distortion, wrong anatomy, extra fingers, duplicated limbs, artifacts, blurry, over-smoothing, unrealistic skin, copied accessories, jewelry, handbag, model's body, model's face, extra outfit pieces from the product photo";

const UNCHANGED_PLURAL = new Set(["trousers", "shorts", "jeans", "leggings", "pants", "tights", "overalls"]);

export function tryOnPieceLabel(category: string) {
  const key = category.trim().replace(/\s+/g, " ").toLowerCase();
  if (!key) return "garment";
  if (key === "top" || key === "tops") return "top";
  if (key === "bottom" || key === "bottoms" || key === "trouser" || key === "trousers") return "trousers";
  if (UNCHANGED_PLURAL.has(key)) return key;
  if (key.endsWith("ies") && key.length > 4) return `${key.slice(0, -3)}y`;
  if (/(ches|shes|xes|zes|ses)$/.test(key) && key.length > 4) return key.slice(0, -2);
  if (key.endsWith("s") && !key.endsWith("ss") && key.length > 3) return key.slice(0, -1);
  return key;
}

export function buildCategoryTryOnPrompt(category: string) {
  const piece = tryOnPieceLabel(category);
  return `Replace only the person's ${piece} with the ${piece} in the product photo. That photo may show the ${piece} on a body. Extract only the ${piece}. Do not copy the model's body, face, or any other clothing or accessory, including shoes, jewelry, bags, hats, belts, watches, and sunglasses, unless that item is the ${piece}. Do not change the person's face, hair, skin, pose, body, lighting, or any clothing that is not the ${piece}. The person must remain fully clothed. Match the design, fabric, colour, pattern, seams, and fit of that ${piece}.`;
}
