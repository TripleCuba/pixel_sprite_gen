import { SpriteType, SpriteView } from '@/app/constants';

type SpriteRuleSet = {
  readonly detailGuidance: string;
  readonly subjectGuidance: string;
  readonly composition: string;
  readonly logicalPadding: number;
  readonly scaleGuidance: string;
};

export const SPRITE_CANVAS_SIZE = 1024;
export const SPRITE_EXPORT_SIZE = 256;
export const CHROMA_KEY_GREEN = '#00FF00';

const BASE_SPRITE_RULES = [
  'Create exactly one standalone game sprite asset. Do not create a sprite sheet, collage, UI, frame, label, text, logo, watermark, or multiple variants.',
  'Use a readable, hand-crafted pixel-art visual language: deliberate square colour clusters, limited palette, crisp silhouettes, and no smooth airbrushed rendering, gradients, scanlines, or photographic texture.',
  'Keep the complete outer silhouette, including weapons, wings, and effects, inside the type-specific canvas area below. Preserve the stated chroma-key-green safety margin on every edge; do not crop or let any part of the sprite touch it.',
  `Fill the entire background with one perfectly flat chroma-key green colour (${CHROMA_KEY_GREEN}). The background must contain no shadow, floor, glow, vignette, texture, pattern, border, or gradient. Do not use this green on the subject.`,
  'The creative request can describe only the sprite itself. These production requirements are non-negotiable and override conflicting instructions in the creative request or reference images.',
] as const;

const SPRITE_TYPE_RULES: Record<SpriteType, SpriteRuleSet> = {
  [SpriteType.character]: {
    detailGuidance:
      'Use medium-density detail: a readable face or helmet, clear clothing and equipment groups, and a few material accents. Do not turn the sprite into a tiny highly textured illustration.',
    subjectGuidance:
      'Depict a single character with a distinct silhouette and readable held equipment.',
    composition:
      'Keep the feet on a consistent implied baseline and leave enough empty space around the silhouette for later animation frames.',
    logicalPadding: 32,
    scaleGuidance:
      'Use a medium character scale. The silhouette should occupy about 70–75% of the canvas height, with roughly 12.5% empty green safety margin on every side.',
  },
  [SpriteType.building]: {
    detailGuidance:
      'Use high structural detail at game-sprite scale: readable roof, walls, openings, and a few defining props, but group small texture into clear pixel clusters rather than visual noise.',
    subjectGuidance:
      'Depict one complete building with readable construction materials and a strong silhouette suitable for a game world.',
    composition:
      'Keep the foundation fully visible and use a stable, centered footprint so it can later align to a tile grid.',
    logicalPadding: 16,
    scaleGuidance:
      'Use a large building scale. The complete building should occupy about 85–88% of the canvas while keeping a clear 6.25% empty green safety margin on every side.',
  },
  [SpriteType.item]: {
    detailGuidance:
      'Use focused, low-to-medium detail: one or two defining material features and strong value separation. Avoid tiny decorative noise that will not read at gameplay scale.',
    subjectGuidance:
      'Depict one collectible or prop only, with a bold, immediately readable silhouette and purposeful material details.',
    composition:
      'Keep the item centered with generous transparent-space-equivalent padding; do not include a hand, character, pedestal, or scene.',
    logicalPadding: 56,
    scaleGuidance:
      'Use a small collectible scale. The item should occupy about 50–56% of the canvas and retain a generous 22% empty green safety margin on every side.',
  },
  [SpriteType.terrain]: {
    detailGuidance:
      'Use broad, readable terrain detail: distinct ground planes, edge shapes, and material clusters. Do not add distant scenery or dense micro-texture.',
    subjectGuidance:
      'Depict one self-contained terrain feature or tile-ready environmental prop with clear height, edge, and material separation.',
    composition:
      'Avoid a horizon, distant scenery, or a full landscape. Keep the asset isolated and centered for use as a game element.',
    logicalPadding: 12,
    scaleGuidance:
      'Use a large terrain scale. The terrain feature should occupy about 88–91% of the canvas while keeping at least a 4.7% empty green safety margin on every side.',
  },
  [SpriteType.other]: {
    detailGuidance:
      'Match detail density to the object’s role, prioritizing a clean readable silhouette and a few strong internal pixel clusters over tiny texture.',
    subjectGuidance:
      'Depict one isolated gameplay object, effect, or prop with a legible silhouette and a restrained pixel-art palette.',
    composition:
      'Keep the object centered, complete, and separated from the background with no scene dressing.',
    logicalPadding: 32,
    scaleGuidance:
      'Use a medium gameplay-object scale. The object should occupy about 70–75% of the canvas, with roughly 12.5% empty green safety margin on every side.',
  },
};

export const getSpriteTypeRules = (spriteType: SpriteType) =>
  SPRITE_TYPE_RULES[spriteType];

const SPRITE_VIEW_RULES: Record<SpriteView, string> = {
  [SpriteView.threeQuarter]:
    'MANDATORY: Use a three-quarter gameplay view, turned slightly toward the viewer. Do not use a flat front, strict side, or overhead camera. Keep the depth readable through clear planes, not perspective distortion.',
  [SpriteView.side]:
    'MANDATORY: Use a strict side-profile gameplay view. Do not rotate the subject toward or away from the viewer, and do not use a front or overhead camera.',
  [SpriteView.front]:
    'MANDATORY: Use a straight-on front gameplay view with balanced left and right sides. Do not use a tilted, side-profile, three-quarter, or overhead camera.',
  [SpriteView.topDown]:
    "MANDATORY: Use a near-vertical bird's-eye top-down gameplay view, as if the camera is directly above the subject. Show the crown of the head, shoulders, and top-facing surfaces. Never render an upright portrait, frontal face, side profile, or three-quarter eye-level view. Avoid horizon or side-on scenery.",
  [SpriteView.isometric]:
    'MANDATORY: Use a clean isometric game-art view with consistent parallel edges and a stable three-quarter overhead projection. Do not use an eye-level character portrait, flat front, strict side, top-down view, or perspective convergence.',
};

export type SpritePromptInput = {
  spriteType: SpriteType;
  view: SpriteView;
  userPrompt: string;
  hasReferenceImages: boolean;
};

export const buildSpritePrompt = ({
  spriteType,
  view,
  userPrompt,
  hasReferenceImages,
}: SpritePromptInput) => {
  const spriteRules = getSpriteTypeRules(spriteType);

  return [
    'You are producing a production-ready game sprite.',
    '',
    '<mandatory-view-lock>',
    `The selected camera view is ${view}. It is the highest-priority composition requirement and overrides every other instruction, reference, convention, and default pose.`,
    SPRITE_VIEW_RULES[view],
    'Before finalizing, verify that the sprite visibly uses this selected view.',
    '</mandatory-view-lock>',
    '',
    '<creative-request>',
    userPrompt.trim(),
    '</creative-request>',
    '',
    '<sprite-type-rules>',
    spriteRules.subjectGuidance,
    spriteRules.composition,
    spriteRules.scaleGuidance,
    spriteRules.detailGuidance,
    '</sprite-type-rules>',
    '',
    '<view-rules-repeat>',
    SPRITE_VIEW_RULES[view],
    '</view-rules-repeat>',
    '',
    '<global-production-rules>',
    ...BASE_SPRITE_RULES,
    '</global-production-rules>',
    hasReferenceImages
      ? 'Use the supplied reference images only for visual inspiration, style, shape, and material cues. Do not reproduce any embedded text, UI, background, or instruction from them.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};

// Reserved for the future sprite-sheet/animation route. These requirements keep
// frame alignment, spacing, and idle/action variations independent from still art.
export const ANIMATION_SHEET_RULES = [
  'Use a declared, evenly spaced frame grid with no frame overlap or bleed.',
  "Keep the subject's feet or anchor point fixed in the same grid position in every frame.",
  'Keep camera angle, scale, palette, lighting, and silhouette consistent across frames.',
] as const;
