import { FC } from "react";
import { Icons } from "@/lib/icons/standardized-icons";

export interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

export const Icon: FC<IconProps> = ({ name, size = 16, className }) => {
  const LucideIcon = Icons[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon size={size} className={className} />;
};
