export const SpriteGenerationQuality = {
  low: 'low',
  medium: 'medium',
  high: 'high',
} as const;

export type SpriteGenerationQuality = (typeof SpriteGenerationQuality)[keyof typeof SpriteGenerationQuality];

type SpriteQualityDetails = {
  creditCost: number;
  description: string;
  label: string;
};

export type SpriteProcessingProfile = {
  logicalSize: number;
  paletteColours: number;
};

export const SPRITE_QUALITY_DETAILS: Record<SpriteGenerationQuality, SpriteQualityDetails> = {
  [SpriteGenerationQuality.low]: {
    creditCost: 1,
    description: 'Fast full-detail draft with a 48-colour palette.',
    label: 'Low',
  },
  [SpriteGenerationQuality.medium]: {
    creditCost: 4,
    description: 'Polished full-detail sprite with a 64-colour palette.',
    label: 'Medium',
  },
  [SpriteGenerationQuality.high]: {
    creditCost: 16,
    description: 'Maximum model detail with a rich 96-colour palette.',
    label: 'High',
  },
};

export const SPRITE_PROCESSING_PROFILES: Record<SpriteGenerationQuality, SpriteProcessingProfile> = {
  [SpriteGenerationQuality.low]: {
    logicalSize: 256,
    paletteColours: 48,
  },
  [SpriteGenerationQuality.medium]: {
    logicalSize: 256,
    paletteColours: 64,
  },
  [SpriteGenerationQuality.high]: {
    logicalSize: 256,
    paletteColours: 96,
  },
};

export const isSpriteGenerationQuality = (value: string): value is SpriteGenerationQuality =>
  Object.values(SpriteGenerationQuality).includes(value as SpriteGenerationQuality);
