import { FC } from "react";
import * as Phosphor from "@phosphor-icons/react";

export interface IconProps {
  name: keyof typeof Phosphor;
  size?: number;
  className?: string;
}

export const Icon: FC<IconProps> = ({ name, size = 16, className }) => {
  const PhosphorIcon = Phosphor[name] as Phosphor.Icon;
  if (!PhosphorIcon) {
    return null;
  }
  return <PhosphorIcon size={size} className={className} />;
};
