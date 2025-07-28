"use client";

import React from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, DotsThree as MoreHorizontal, X } from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

export interface PanelHeaderAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  tooltip?: string;
}

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "error" | "outline";
  };
  actions?: PanelHeaderAction[];
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  headerClassName?: string;
  hasDropdown?: boolean;
  dropdownContent?: React.ReactNode;
}

export function PanelHeader({
  title,
  icon,
  subtitle,
  badge,
  actions = [],
  collapsible = false,
  isExpanded = true,
  onToggleExpand,
  closable = false,
  onClose,
  className,
  headerClassName,
  hasDropdown = false,
  dropdownContent,
}: PanelHeaderProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <div
      className={cn(
        "panel-header",
        "flex items-center justify-between",
        "px-5 md:px-6", // More padding for professional look
        "border-b border-[var(--fl-color-border)]",
        "bg-white", // Cleaner than gradient
        "h-16 md:h-[72px]", // Taller headers (64px mobile, 72px desktop)
        "shadow-subtle", // Subtle shadow
        className
      )}
    >
      {/* Left Section */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <div className="panel-header-icon text-foreground flex-shrink-0">{icon}</div>}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-ds-2">
            <h3
              className={cn(
                "panel-header-title",
                "text-typography-sm font-semibold text-neutral-900",
                "truncate",
                headerClassName
              )}
            >
              {title}
            </h3>

            {badge && (
              <OptimizedMotion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 25 }}
              >
                <Badge variant={badge.variant || "secondary"} className="panel-header-badge text-tiny">
                  {badge.text}
                </Badge>
              </OptimizedMotion.div>
            )}
          </div>

          {subtitle && (
            <p className="panel-header-subtitle mt-0.5 truncate text-tiny text-[var(--fl-color-text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="ml-4 flex flex-shrink-0 items-center gap-1">
        {/* Primary Actions */}
        {actions.slice(0, 2).map((action: any) => (
          <Button
            key={action.id}
            variant={action.variant === "primary" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "panel-header-action",
              "h-8 px-2",
              action.variant === "danger" && "text-status-error hover:text-status-error-dark"
            )}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.tooltip}
          >
            {action.icon && <span className="mr-1.5">{action.icon}</span>}
            <span className="text-tiny font-medium">{action.label}</span>
          </Button>
        ))}

        {/* More Actions Dropdown */}
        {(actions.length > 2 || hasDropdown) && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="panel-header-more h-8 w-8 p-0"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Icon icon={MoreHorizontal} className="h-4 w-4" />
            </Button>

            {showDropdown && (
              <div
                className={cn(
                  "panel-header-dropdown",
                  "absolute right-0 top-9 z-50",
                  "min-w-[180px]",
                  "rounded-ds-lg bg-white shadow-lg",
                  "border border-[var(--fl-color-border)]",
                  "py-1"
                )}
              >
                {actions.slice(2).map((action: any) => (
                  <button
                    key={action.id}
                    className={cn(
                      "panel-header-dropdown-item",
                      "w-full px-3 py-2 text-left",
                      "flex items-center gap-2",
                      "text-typography-sm text-neutral-700",
                      "hover:bg-[var(--fl-color-background-subtle)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    onClick={() => {
                      action.onClick();
                      setShowDropdown(false);
                    }}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}

                {dropdownContent && (
                  <>
                    {actions.length > 2 && <hr className="my-1 border-[var(--fl-color-border)]" />}
                    <div className="px-3 py-2">{dropdownContent}</div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapse/Expand Button */}
        {collapsible && onToggleExpand && (
          <>
            <div className="panel-header-divider mx-1 h-5 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className="panel-header-toggle h-8 w-8 p-0"
              onClick={onToggleExpand}
              aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              {isExpanded ? (
                <Icon icon={ChevronUp} className="h-4 w-4" />
              ) : (
                <Icon icon={ChevronDown} className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {/* Close Button */}
        {closable && onClose && (
          <>
            <div className="panel-header-divider mx-1 h-5 w-px bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className="panel-header-close h-8 w-8 p-0 hover:bg-[var(--fl-color-danger-subtle)]"
              onClick={onClose}
              aria-label="Close panel"
            >
              <Icon icon={X} className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
