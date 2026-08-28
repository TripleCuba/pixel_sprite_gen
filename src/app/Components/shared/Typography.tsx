import { createElement } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { typographyColorTokens, typographySizeTokens } from "./tokens";
import type { TypographyColorToken, TypographySizeToken } from "./tokens";

export type TypographyColor = TypographyColorToken;
export type TypographySize = TypographySizeToken;
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "strong"
  | "b"
  | "small"
  | "code"
  | "label"
  | "legend";

type TypographyProps = Omit<HTMLAttributes<HTMLElement>, "color"> & {
  align?: CSSProperties["textAlign"];
  children?: ReactNode;
  color?: TypographyColor;
  display?: CSSProperties["display"];
  htmlFor?: string;
  letterSpacing?: CSSProperties["letterSpacing"];
  lineHeight?: CSSProperties["lineHeight"];
  margin?: CSSProperties["margin"];
  padding?: CSSProperties["padding"];
  size?: TypographySize;
  transform?: CSSProperties["textTransform"];
  variant: TypographyVariant;
  weight?: CSSProperties["fontWeight"];
};

const Typography = ({
  children,
  align,
  color,
  display,
  letterSpacing,
  lineHeight,
  margin,
  padding,
  size,
  style,
  transform,
  variant,
  weight,
  ...props
}: TypographyProps) =>
  createElement(
    variant,
    {
      ...props,
      style: {
        ...style,
        ...(align ? { textAlign: align } : {}),
        ...(color ? { color: typographyColorTokens[color] } : {}),
        ...(display ? { display } : {}),
        ...(letterSpacing !== undefined ? { letterSpacing } : {}),
        ...(lineHeight !== undefined ? { lineHeight } : {}),
        ...(margin !== undefined ? { margin } : {}),
        ...(padding !== undefined ? { padding } : {}),
        ...(size ? { fontSize: typographySizeTokens[size] } : {}),
        ...(transform ? { textTransform: transform } : {}),
        ...(weight !== undefined ? { fontWeight: weight } : {}),
      },
    },
    children,
  );

export default Typography;
