"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, List as Menu, Search as Search } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showNotifications?: boolean;
  showSearch?: boolean;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onSearchClick?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  notificationCount?: number;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showNotifications = true,
  showSearch = false,
  onMenuClick,
  onNotificationClick,
  onSearchClick,
  rightAction,
  className,
  notificationCount = 0,
}: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <header className={cn("mobile-header lg:hidden", className)}>
      <div className="mobile-header-content">
        {/* Left Section */}
        <div className="mobile-header-left">
          {showBack ? (
            <button onClick={handleBack} className="mobile-header-button" aria-label="Go back">
              <Icon icon={ArrowLeft} size={24} />
            </button>
          ) : (
            <button onClick={onMenuClick} className="mobile-header-button" aria-label="Open menu">
              <Icon icon={Menu} size={24} />
            </button>
          )}
        </div>

        {/* Center Section */}
        <div className="mobile-header-center">
          <h1 className="mobile-header-title">{title}</h1>
          {subtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
        </div>

        {/* Right Section */}
        <div className="mobile-header-right">
          {showSearch && (
            <button onClick={onSearchClick} className="mobile-header-button" aria-label="Search">
              <Icon icon={Search} size={20} />
            </button>
          )}

          {showNotifications && (
            <button onClick={onNotificationClick} className="mobile-header-button relative" aria-label="Notifications">
              <Icon icon={Bell} size={20} />
              {notificationCount > 0 && (
                <div className="bg-brand-mahogany-500 absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-ds-full px-1 text-tiny text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </div>
              )}
            </button>
          )}

          {rightAction}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
