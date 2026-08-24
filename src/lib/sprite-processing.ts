import sharp from "sharp";
import {
  SPRITE_EXPORT_SIZE,
  SPRITE_LOGICAL_SIZE,
} from "./sprite-rules";

const GREEN_MINIMUM = 120;
const GREEN_DOMINANCE = 60;

const isChromaGreen = (red: number, green: number, blue: number) =>
  green >= GREEN_MINIMUM &&
  green - red >= GREEN_DOMINANCE &&
  green - blue >= GREEN_DOMINANCE;

const removeConnectedGreenBackground = (
  pixels: Buffer,
  width: number,
  height: number,
) => {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const addIfGreen = (index: number) => {
    if (visited[index]) {
      return;
    }

    const offset = index * 4;
    if (!isChromaGreen(pixels[offset], pixels[offset + 1], pixels[offset + 2])) {
      return;
    }

    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    addIfGreen(x);
    addIfGreen((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    addIfGreen(y * width);
    addIfGreen(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const offset = index * 4;
    pixels[offset + 3] = 0;

    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) addIfGreen(index - 1);
    if (x < width - 1) addIfGreen(index + 1);
    if (y > 0) addIfGreen(index - width);
    if (y < height - 1) addIfGreen(index + width);
  }

  return pixels;
};

export const processSpriteImage = async (image: Buffer) => {
  const decoded = await sharp(image).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const pixels = removeConnectedGreenBackground(
    decoded.data,
    decoded.info.width,
    decoded.info.height,
  );

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
    .resize(SPRITE_LOGICAL_SIZE, SPRITE_LOGICAL_SIZE, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.nearest,
    })
    .png({ palette: true, colours: 32, dither: 0 })
    .resize(SPRITE_EXPORT_SIZE, SPRITE_EXPORT_SIZE, {
      kernel: sharp.kernel.nearest,
    })
    .png()
    .toBuffer();
};
