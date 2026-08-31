import { loadEnvConfig } from '@next/env';
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { SpriteType, SpriteView, SpriteTypeViews } from '../src/app/constants';
import { processSpriteImage } from '../src/lib/sprite-processing';
import { SpriteGenerationQuality } from '../src/lib/sprite-quality';
import { SPRITE_CANVAS_SIZE } from '../src/lib/sprite-rules';

loadEnvConfig(process.cwd());

const MODEL_QUALITY = SpriteGenerationQuality.high;
const POST_PROCESSING_QUALITY = SpriteGenerationQuality.high;
const OUTPUT_DIRECTORY = path.resolve(process.cwd(), 'public', 'sprite-previews');
const FORCE = process.argv.includes('--force');
const REQUESTED_TYPE = process.argv
  .find((argument) => argument.startsWith('--type='))
  ?.slice('--type='.length)
  .toLowerCase();

const TYPE_PROMPTS: Record<SpriteType, string> = {
  [SpriteType.character]:
    'A lone forest ranger with an emerald hooded cloak, leather armour, chestnut hair, a steel bow held naturally in a relaxed ready pose, and a quiver of arrows.',
  [SpriteType.building]:
    'An ancient stone watchtower with a steep slate roof, glowing blue crystal windows, a bronze door, and light moss details.',
  [SpriteType.item]:
    'A compact circular brass astrolabe compass, designed as a flat hand-held game prop: glowing cyan crystal center, nested rotating rings, and small engraved marks. It must have no cord, loop, chain, handle, or dangling parts.',
  [SpriteType.terrain]:
    'A compact grassy hill terrain feature with three pine trees, exposed grey rocks, and a narrow dirt trail.',
  [SpriteType.other]:
    'A freestanding ancient stone portal ring with swirling violet energy, three small runestones, and a restrained magical glow.',
};

const VIEW_SLUGS: Record<SpriteView, string> = {
  [SpriteView.threeQuarter]: 'three-quarter',
  [SpriteView.side]: 'side',
  [SpriteView.front]: 'front',
  [SpriteView.topDown]: 'top-down',
  [SpriteView.isometric]: 'isometric',
};

const TYPE_SLUGS: Record<SpriteType, string> = {
  [SpriteType.character]: 'character',
  [SpriteType.building]: 'building',
  [SpriteType.item]: 'item',
  [SpriteType.terrain]: 'terrain',
  [SpriteType.other]: 'other',
};

const SHEET_CELLS: Record<SpriteView, { column: number; row: number }> = {
  [SpriteView.threeQuarter]: { column: 0, row: 0 },
  [SpriteView.side]: { column: 1, row: 0 },
  [SpriteView.front]: { column: 2, row: 0 },
  [SpriteView.topDown]: { column: 0, row: 1 },
  [SpriteView.isometric]: { column: 1, row: 1 },
};

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

const buildTurnaroundPrompt = (spriteType: SpriteType) =>
  [
    'Create a production-ready pixel-art game-sprite turnaround sheet.',
    `The exact same ${spriteType.toLowerCase()} must appear in five distinct isolated views: top-left three-quarter gameplay view; top-center strict side profile; top-right straight-on front view; bottom-left vertical top-down view; bottom-center isometric overhead view. The bottom-right cell must remain completely empty.`,
    spriteType === SpriteType.item
      ? 'For the bottom-left item view, show the compass exactly from directly above: a large, perfectly circular face with concentric rings and a centred compass rose. Never show this cell edge-on, upright, tilted, or as a thin profile.'
      : null,
    'Use a strict 3 columns by 2 rows layout with generous empty space between all cells. Every sprite must remain completely inside its own cell with no overlap, no cropping, and the same scale, palette, materials, and proportions in each view.',
    TYPE_PROMPTS[spriteType],
    'Use crisp, hand-crafted 32-bit pixel art with deliberate square colour clusters, a limited palette, and readable game silhouettes. Do not use soft rendering, gradients, text, labels, borders, frames, shadows, or scenery.',
    'Fill the entire sheet background with one perfectly flat chroma-key green (#00FF00). Do not use that green in the sprite itself.',
  ]
    .filter(Boolean)
    .join('\n\n');

const requestSheet = async (prompt: string) => {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      size: `${SPRITE_CANVAS_SIZE}x${SPRITE_CANVAS_SIZE}`,
      quality: MODEL_QUALITY,
      output_format: 'png',
      background: 'opaque',
      n: 1,
    }),
  });
  const payload = (await response.json()) as OpenAIImageResponse;

  if (!response.ok || !payload.data?.[0]?.b64_json) {
    throw new Error(payload.error?.message ?? 'The image generation service could not create a preview sheet.');
  }

  return Buffer.from(payload.data[0].b64_json, 'base64');
};

const writeSpritePreviews = async (spriteType: SpriteType, sheet: Buffer) => {
  const { width, height } = await sharp(sheet).metadata();

  if (!width || !height) {
    throw new Error(`Could not read the ${spriteType.toLowerCase()} preview sheet.`);
  }

  const cellWidth = Math.floor(width / 3);
  const cellHeight = Math.floor(height / 2);

  await Promise.all(
    SpriteTypeViews[spriteType].map(async (view) => {
      const { column, row } = SHEET_CELLS[view];
      const cell = await sharp(sheet)
        .extract({
          left: column * cellWidth,
          top: row * cellHeight,
          width: column === 2 ? width - cellWidth * 2 : cellWidth,
          height: row === 1 ? height - cellHeight : cellHeight,
        })
        .png()
        .toBuffer();
      const sprite = await processSpriteImage(cell, POST_PROCESSING_QUALITY, spriteType);
      const outputPath = path.join(OUTPUT_DIRECTORY, `${TYPE_SLUGS[spriteType]}-${VIEW_SLUGS[view]}.png`);

      await writeFile(outputPath, sprite);
    }),
  );
};

const typeNeedsGeneration = async (spriteType: SpriteType) => {
  if (FORCE) {
    return true;
  }

  try {
    await Promise.all(
      SpriteTypeViews[spriteType].map((view) =>
        access(path.join(OUTPUT_DIRECTORY, `${TYPE_SLUGS[spriteType]}-${VIEW_SLUGS[view]}.png`)),
      ),
    );
    return false;
  } catch {
    return true;
  }
};

const main = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate view previews.');
  }

  await mkdir(OUTPUT_DIRECTORY, { recursive: true });

  const spriteTypes = REQUESTED_TYPE
    ? Object.values(SpriteType).filter((spriteType) => spriteType.toLowerCase() === REQUESTED_TYPE)
    : Object.values(SpriteType);

  if (spriteTypes.length === 0) {
    throw new Error(`Unknown sprite type: ${REQUESTED_TYPE}`);
  }

  for (const [index, spriteType] of spriteTypes.entries()) {
    if (!(await typeNeedsGeneration(spriteType))) {
      console.log(`[${index + 1}/${spriteTypes.length}] keeping ${TYPE_SLUGS[spriteType]} sheet previews`);
      continue;
    }

    const sheet = await requestSheet(buildTurnaroundPrompt(spriteType));
    await writeSpritePreviews(spriteType, sheet);
    console.log(`[${index + 1}/${spriteTypes.length}] ${TYPE_SLUGS[spriteType]} sheet previews`);
  }
};

const keepAlive = setInterval(() => {}, 1_000);

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Could not generate view previews.');
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));
