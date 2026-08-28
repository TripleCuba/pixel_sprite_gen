export const typographyColorTokens = {
  accent: "var(--accent)",
  background: "var(--background)",
  border: "var(--border)",
  danger: "var(--danger)",
  foreground: "var(--foreground)",
  input: "var(--input)",
  panel: "var(--panel)",
  primary: "var(--primary)",
  "primary-light": "var(--primary-light)",
  "primary-muted": "var(--primary-muted)",
  surface: "var(--surface)",
} as const;

export const typographySizeTokens = {
  large: "1rem",
  medium: "0.82rem",
  small: "0.68rem",
  xs: "0.58rem",
} as const;

export type TypographyColorToken = keyof typeof typographyColorTokens;
export type TypographySizeToken = keyof typeof typographySizeTokens;
