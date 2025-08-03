import type { SVGProps } from "react";
import { ElementType } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "size"> {
  /** The Lucide icon component to render */
  icon: ElementType<any> | React.ForwardRefExoticComponent<any>;
  /** Pixel size. Default 20. */
  size?: number;
}

/**
 * Unified icon wrapper so we can control size globally and keep all
 * icons using currentColor for easy theming.
 */
export function Icon({ icon: IconCmp, size = 20, ...rest }: IconProps) {
  return <IconCmp size={size} {...rest} />;
}
