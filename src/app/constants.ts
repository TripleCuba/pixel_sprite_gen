export enum SpriteType {
  character = "Character",
  building = "Building",
  item = "Item",
  terrain = "Terrain",
  other = "Other",
}

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
