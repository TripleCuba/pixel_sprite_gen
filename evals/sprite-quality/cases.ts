import { SpriteType, SpriteView } from '../../src/app/constants';

export type SpriteQualityEvalCase = {
  id: string;
  name: string;
  spriteType: SpriteType;
  view: SpriteView;
  prompt: string;
};

// Keep this set stable. Add new cases rather than changing an existing prompt,
// otherwise historical results cannot be compared reliably.
export const SPRITE_QUALITY_EVAL_CASES: readonly SpriteQualityEvalCase[] = [
  {
    id: 'character-front-01',
    name: 'Front-facing paladin',
    spriteType: SpriteType.character,
    view: SpriteView.front,
    prompt:
      'A lone armored paladin holding a round shield and a short sword, silver plate armor with a royal-blue tabard.',
  },
  {
    id: 'character-side-01',
    name: 'Side-view ranger',
    spriteType: SpriteType.character,
    view: SpriteView.side,
    prompt: 'A lone forest ranger drawing a longbow, green hooded cloak, leather boots, and a quiver of arrows.',
  },
  {
    id: 'character-three-quarter-01',
    name: 'Three-quarter rogue',
    spriteType: SpriteType.character,
    view: SpriteView.threeQuarter,
    prompt:
      'A nimble rogue in dark purple leather armor holding two curved daggers, with a short cape and a confident stance.',
  },
  {
    id: 'character-top-down-01',
    name: 'Top-down spear guard',
    spriteType: SpriteType.character,
    view: SpriteView.topDown,
    prompt:
      'A city guard holding a long spear and a kite shield, clearly seen directly from above with visible helmet crown and shoulders.',
  },
  {
    id: 'character-isometric-01',
    name: 'Isometric battle mage',
    spriteType: SpriteType.character,
    view: SpriteView.isometric,
    prompt: 'A battle mage in a red robe holding a glowing blue staff, with a small spell book at the belt.',
  },
  {
    id: 'building-front-01',
    name: 'Front-facing gatehouse',
    spriteType: SpriteType.building,
    view: SpriteView.front,
    prompt:
      'A compact stone gatehouse with a central arched entry, two small torch sconces, and a dark wooden portcullis.',
  },
  {
    id: 'building-three-quarter-02',
    name: 'Three-quarter windmill',
    spriteType: SpriteType.building,
    view: SpriteView.threeQuarter,
    prompt: 'A small medieval windmill with a timber frame, brick base, four wooden sails, and a shingled roof.',
  },
  {
    id: 'building-three-quarter-01',
    name: 'Three-quarter watchtower',
    spriteType: SpriteType.building,
    view: SpriteView.threeQuarter,
    prompt:
      'A dark stone watchtower with narrow archer windows, a steep slate roof, and a red banner over the entrance.',
  },
  {
    id: 'building-top-down-01',
    name: 'Top-down wizard tower',
    spriteType: SpriteType.building,
    view: SpriteView.topDown,
    prompt:
      'A circular wizard tower roof seen from above, with a blue tiled dome, four small chimneys, and a central skylight.',
  },
  {
    id: 'building-isometric-01',
    name: 'Isometric blacksmith',
    spriteType: SpriteType.building,
    view: SpriteView.isometric,
    prompt: 'A cozy timber-frame blacksmith workshop with a stone forge, chimney, stacked firewood, and an iron sign.',
  },
  {
    id: 'item-front-01',
    name: 'Front-facing health potion',
    spriteType: SpriteType.item,
    view: SpriteView.front,
    prompt:
      'A bright magenta health potion in a round glass vial, cork stopper, tiny gold neck band, and a simple white highlight.',
  },
  {
    id: 'item-side-01',
    name: 'Side-view iron key',
    spriteType: SpriteType.item,
    view: SpriteView.side,
    prompt: 'An old iron dungeon key with a circular bow, a long shaft, and two chunky teeth, viewed from the side.',
  },
  {
    id: 'item-three-quarter-01',
    name: 'Three-quarter treasure chest',
    spriteType: SpriteType.item,
    view: SpriteView.threeQuarter,
    prompt: 'A small oak treasure chest with iron corner bands, a gold lock, and its lid closed.',
  },
  {
    id: 'item-top-down-01',
    name: 'Top-down bear trap',
    spriteType: SpriteType.item,
    view: SpriteView.topDown,
    prompt:
      'An open iron bear trap seen directly from above, with jagged teeth, a circular pressure plate, and a short chain.',
  },
  {
    id: 'item-isometric-01',
    name: 'Isometric shrine',
    spriteType: SpriteType.item,
    view: SpriteView.isometric,
    prompt: 'A small stone shrine with a glowing amber crystal set into its top and three worn steps at the front.',
  },
  {
    id: 'terrain-top-down-01',
    name: 'Top-down forest hill',
    spriteType: SpriteType.terrain,
    view: SpriteView.topDown,
    prompt: 'A compact grassy hill tile with three pine trees, a few exposed grey rocks, and a narrow dirt trail.',
  },
  {
    id: 'terrain-isometric-01',
    name: 'Isometric snow rock',
    spriteType: SpriteType.terrain,
    view: SpriteView.isometric,
    prompt: 'A rocky snow-covered cliff outcrop with layered grey stone, white snow caps, and sparse frozen grass.',
  },
  {
    id: 'other-three-quarter-01',
    name: 'Three-quarter portal',
    spriteType: SpriteType.other,
    view: SpriteView.threeQuarter,
    prompt:
      'A freestanding ancient stone portal ring with swirling violet energy, three runestones, and a faint magical glow.',
  },
  {
    id: 'other-side-01',
    name: 'Side-view fireball',
    spriteType: SpriteType.other,
    view: SpriteView.side,
    prompt:
      'A single fiery orange fireball projectile flying to the right, with a compact yellow core and a short tapered flame trail.',
  },
  {
    id: 'other-top-down-01',
    name: 'Top-down summoning circle',
    spriteType: SpriteType.other,
    view: SpriteView.topDown,
    prompt:
      'A glowing blue summoning circle seen directly from above, made from a ring of small runestones and simple arcane lines.',
  },
] as const;
