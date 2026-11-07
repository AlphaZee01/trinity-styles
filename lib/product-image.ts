import sharp from "sharp";

const MAX_EDGE = 1600;

export async function prepareProductImage(input: Buffer) {
  const bytes = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  return { bytes, contentType: "image/jpeg" as const };
}
