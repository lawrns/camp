import type { IconProps as PhosphorIconProps } from "@phosphor-icons/react";
import { ElementType } from "react";

export interface IconProps extends Omit<PhosphorIconProps, "size" | "weight"> {
  /** The Phosphor icon component to render */
  icon: ElementType<unknown> | React.ForwardRefExoticComponent<unknown>;
  /** Pixel size. Default 20. */
  size?: number;
  /** Icon weight. Default "regular". */
  weight?: PhosphorIconProps["weight"];
}

/**
 * Unified icon wrapper so we can control size/weight globally and keep all
 * icons using currentColor for easy theming.
 */
export function Icon({ icon: IconCmp, size = 20, weight = "regular", ...rest }: IconProps) {
  return <IconCmp size={size} weight={weight} {...rest} />;
}
