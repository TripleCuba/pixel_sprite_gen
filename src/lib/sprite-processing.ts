import sharp from 'sharp';
import { getSpriteTypeRules, SPRITE_EXPORT_SIZE } from './sprite-rules';
import type { SpriteType } from '@/app/constants';
import { SPRITE_PROCESSING_PROFILES, type SpriteGenerationQuality } from './sprite-quality';

const GREEN_MINIMUM = 120;
const GREEN_DOMINANCE = 60;

const isChromaGreen = (red: number, green: number, blue: number) =>
  green >= GREEN_MINIMUM && green - red >= GREEN_DOMINANCE && green - blue >= GREEN_DOMINANCE;

const removeChromaKeyGreen = (pixels: Buffer) => {
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (isChromaGreen(pixels[offset], pixels[offset + 1], pixels[offset + 2])) {
      pixels[offset + 3] = 0;
    }
  }

  return pixels;
};

export const processSpriteImage = async (image: Buffer, quality: SpriteGenerationQuality, spriteType: SpriteType) => {
  const profile = SPRITE_PROCESSING_PROFILES[quality];
  const typeRules = getSpriteTypeRules(spriteType);
  const contentLogicalSize = profile.logicalSize - typeRules.logicalPadding * 2;
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

  // Sharp optimizes resize and extend operations internally, so these are kept as
  // separate buffers. This preserves the intended order: fit content into the
  // quality profile, add its logical padding, then scale to the 256px export.
  const logicalContent = await withoutBackground
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .resize(contentLogicalSize, contentLogicalSize, {
      fit: 'contain',
      position: 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();

  const paddedLogicalSprite = await sharp(logicalContent)
    .extend({
      top: typeRules.logicalPadding,
      right: typeRules.logicalPadding,
      bottom: typeRules.logicalPadding,
      left: typeRules.logicalPadding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ palette: true, colours: profile.paletteColours, dither: 0 })
    .toBuffer();

  // Nearest-neighbour scaling preserves the selected logical pixel grid exactly.
  return sharp(paddedLogicalSprite)
    .resize(SPRITE_EXPORT_SIZE, SPRITE_EXPORT_SIZE, {
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
};
