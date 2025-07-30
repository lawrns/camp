import * as React from "react";
import { CaretRight, IconProps } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const listItemVariants = cva("flex items-center gap-4 spacing-4 transition-colors", {
  variants: {
    variant: {
      default: "hover:bg-accent hover:text-accent-foreground",
      button: "cursor-pointer rounded-ds-md hover:bg-accent hover:text-accent-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof listItemVariants> {
  icon?: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  chevron?: boolean;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({ className, variant, icon: IconComponent, title, description, badge, chevron = true, ...props }, ref) => {
    return (
      <div className={cn(listItemVariants({ variant }), className)} ref={ref} {...props}>
        {IconComponent && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-ds-xl bg-[var(--fl-color-info-subtle)] text-blue-600">
            <IconComponent className="h-6 w-6" weight="duotone" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-ds-2 font-semibold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
            {badge}
          </div>
          {description && <div className="text-sm text-[var(--fl-color-text-muted)] whitespace-nowrap overflow-hidden text-ellipsis">{description}</div>}
        </div>
        {chevron && <CaretRight className="h-5 w-5 flex-shrink-0 text-gray-400" />}
      </div>
    );
  }
);
ListItem.displayName = "ListItem";

export { ListItem, listItemVariants };
