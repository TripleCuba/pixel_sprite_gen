export const SpriteGenerationQuality = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

export type SpriteGenerationQuality =
  (typeof SpriteGenerationQuality)[keyof typeof SpriteGenerationQuality];

type SpriteQualityDetails = {
  creditCost: number;
  description: string;
  label: string;
};

export const SPRITE_QUALITY_DETAILS: Record<
  SpriteGenerationQuality,
  SpriteQualityDetails
> = {
  [SpriteGenerationQuality.low]: {
    creditCost: 1,
    description: "Fast draft for exploring ideas.",
    label: "Low",
  },
  [SpriteGenerationQuality.medium]: {
    creditCost: 4,
    description: "More detail for polished sprites.",
    label: "Medium",
  },
  [SpriteGenerationQuality.high]: {
    creditCost: 16,
    description: "Best detail for final assets.",
    label: "High",
  },
};

export const isSpriteGenerationQuality = (
  value: string,
): value is SpriteGenerationQuality =>
  Object.values(SpriteGenerationQuality).includes(
    value as SpriteGenerationQuality,
  );
