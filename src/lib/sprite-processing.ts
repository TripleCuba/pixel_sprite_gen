import sharp from "sharp";
import {
  SPRITE_CONTENT_LOGICAL_SIZE,
  SPRITE_EXPORT_SIZE,
  SPRITE_LOGICAL_PADDING,
} from "./sprite-rules";

const GREEN_MINIMUM = 120;
const GREEN_DOMINANCE = 60;

const isChromaGreen = (red: number, green: number, blue: number) =>
  green >= GREEN_MINIMUM &&
  green - red >= GREEN_DOMINANCE &&
  green - blue >= GREEN_DOMINANCE;

const removeChromaKeyGreen = (pixels: Buffer) => {
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (isChromaGreen(pixels[offset], pixels[offset + 1], pixels[offset + 2])) {
      pixels[offset + 3] = 0;
    }
  }

  return pixels;
};

export const processSpriteImage = async (image: Buffer) => {
  const decoded = await sharp(image).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  // The generation prompt reserves chroma green exclusively for the flat
  // background. Removing every matching pixel (rather than only the region
  // touching the canvas edge) also clears background islands sealed off by a
  // bow, weapon, or other part of the sprite.
  const pixels = removeChromaKeyGreen(decoded.data);

  const withoutBackground = sharp(pixels, {
    raw: {
      width: decoded.info.width,
      height: decoded.info.height,
      channels: 4,
    },
  });

  // The model creates deliberately oversized colour clusters on a 1024px canvas.
  // Reducing to a logical grid, then nearest-neighbour scaling, makes every export
  // pixel land on a stable 4×4 block with no interpolation blur.
  return withoutBackground
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .resize(SPRITE_CONTENT_LOGICAL_SIZE, SPRITE_CONTENT_LOGICAL_SIZE, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .extend({
      top: SPRITE_LOGICAL_PADDING,
      right: SPRITE_LOGICAL_PADDING,
      bottom: SPRITE_LOGICAL_PADDING,
      left: SPRITE_LOGICAL_PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ palette: true, colours: 32, dither: 0 })
    .resize(SPRITE_EXPORT_SIZE, SPRITE_EXPORT_SIZE, {
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
};
