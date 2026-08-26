export enum SpriteType {
  character = "Character",
  building = "Building",
  item = "Item",
  terrain = "Terrain",
  other = "Other",
}

export enum SpriteView {
  threeQuarter = "Three-quarter",
  side = "Side",
  front = "Front",
  topDown = "Top-down",
  isometric = "Isometric",
}

export const SpriteTypeDefaultView: Record<SpriteType, SpriteView> = {
  [SpriteType.character]: SpriteView.threeQuarter,
  [SpriteType.building]: SpriteView.isometric,
  [SpriteType.item]: SpriteView.threeQuarter,
  [SpriteType.terrain]: SpriteView.topDown,
  [SpriteType.other]: SpriteView.threeQuarter,
};

export const SpriteTypeViews: Record<SpriteType, readonly SpriteView[]> = {
  [SpriteType.character]: Object.values(SpriteView),
  [SpriteType.building]: [
    SpriteView.front,
    SpriteView.threeQuarter,
    SpriteView.topDown,
    SpriteView.isometric,
  ],
  [SpriteType.item]: [
    SpriteView.front,
    SpriteView.side,
    SpriteView.threeQuarter,
    SpriteView.topDown,
    SpriteView.isometric,
  ],
  [SpriteType.terrain]: [SpriteView.topDown, SpriteView.isometric],
  // "Other" is intentionally unrestricted: it covers effects, portals, and
  // custom assets whose useful view depends on the user's prompt.
  [SpriteType.other]: Object.values(SpriteView),
};

export const isSpriteViewAvailableForType = (
  spriteType: SpriteType,
  spriteView: SpriteView,
) => SpriteTypeViews[spriteType].includes(spriteView);

export const SpriteViewDescriptions: Record<SpriteView, string> = {
  [SpriteView.threeQuarter]: "Depth with a readable gameplay silhouette.",
  [SpriteView.side]: "Profile view for side-scrolling action.",
  [SpriteView.front]: "Straight-on, balanced presentation.",
  [SpriteView.topDown]: "Overhead view for maps and tactics.",
  [SpriteView.isometric]: "Angled overhead view for buildings and props.",
};

export const SpriteTypePlaceholders: Record<SpriteType, string> = {
  [SpriteType.character]: "Armored ranger with an emerald cloak and steel bow",
  [SpriteType.building]: "Ancient stone watchtower with blue crystal windows",
  [SpriteType.item]: "Glowing health potion in a faceted glass vial",
  [SpriteType.terrain]: "Snow-capped mountain ridge with a pine forest",
  [SpriteType.other]: "Mystical portal with swirling violet energy",
};

export const Colors = {
  canvas: "#080E16",
  surface: "#111927",
  panel: "#1C2635",
  input: "#0F1722",
  border: "#344158",
  primary: "#7C3AED",
  primaryLight: "#A78BFA",
  primaryMuted: "#2D1D5B",
  accent: "#38D9F5",
  text: "#F5F7FF",
} as const;
