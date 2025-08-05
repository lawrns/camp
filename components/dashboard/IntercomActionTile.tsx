"use client";

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/unified-ui/components/Badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ActionTileProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: string | number;
  description?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
  onClick?: () => void;
}

interface ActionTileGridProps {
  tiles: ActionTileProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colorConfig = {
  primary: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200',
    border: 'border-amber-200/50 hover:border-amber-300/70',
    icon: 'text-amber-600 group-hover:text-amber-700',
    iconBg: 'bg-amber-100 group-hover:bg-amber-200',
    text: 'text-amber-900',
    shadow: 'hover:shadow-amber-200/50'
  },
  secondary: {
    bg: 'bg-gradient-to-br from-rose-50 to-pink-100 hover:from-rose-100 hover:to-pink-200',
    border: 'border-rose-200/50 hover:border-rose-300/70',
    icon: 'text-rose-600 group-hover:text-rose-700',
    iconBg: 'bg-rose-100 group-hover:bg-rose-200',
    text: 'text-rose-900',
    shadow: 'hover:shadow-rose-200/50'
  },
  accent: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200',
    border: 'border-emerald-200/50 hover:border-emerald-300/70',
    icon: 'text-emerald-600 group-hover:text-emerald-700',
    iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
    text: 'text-emerald-900',
    shadow: 'hover:shadow-emerald-200/50'
  },
  neutral: {
    bg: 'bg-gradient-to-br from-gray-50 to-slate-100 hover:from-gray-100 hover:to-slate-200',
    border: 'border-gray-200/50 hover:border-gray-300/70',
    icon: 'text-gray-600 group-hover:text-gray-700',
    iconBg: 'bg-[var(--fl-color-surface)] group-hover:bg-gray-200',
    text: 'text-gray-900',
    shadow: 'hover:shadow-gray-200/50'
  }
};

function ActionTile({ 
  label, 
  icon: Icon, 
  route, 
  badge, 
  description, 
  color = 'neutral',
  onClick 
}: ActionTileProps) {
  const router = useRouter();
  const [isPressed, setIsPressed] = useState(false);
  const colors = colorConfig[color];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(route);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-300",
        "hover:-translate-y-1 hover:scale-105",
        "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500",
        isPressed && "scale-95"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      tabIndex={0}
      role="button"
      aria-label={`${label}${description ? `: ${description}` : ''}`}
    >
      {/* Glass morphism card */}
      <div className={cn(
        "glass-card relative overflow-hidden transition-all duration-300",
        "h-32 p-4 rounded-xl border backdrop-blur-sm",
        colors.bg,
        colors.border,
        "hover:shadow-xl",
        colors.shadow
      )}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2 z-10">
            <Badge 
              variant="secondary" 
              className="bg-red-500/90 text-white text-xs px-2 py-0.5 rounded-full animate-bounce-in"
            >
              {badge}
            </Badge>
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300",
            colors.iconBg,
            "group-hover:scale-110 group-hover:rotate-3"
          )}>
            <Icon className={cn("w-7 h-7 transition-colors duration-300", colors.icon)} />
          </div>
          
          {/* Text content */}
          <div className="space-y-1">
            <h3 className={cn(
              "font-semibold text-sm leading-tight transition-colors duration-300",
              colors.text
            )}>
              {label}
            </h3>
            {description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transition-all duration-300",
          colors.iconBg.replace('bg-', 'bg-gradient-to-r from-').replace(' group-hover:bg-', ' to-'),
          "opacity-0 group-hover:opacity-100 scale-x-0 group-hover:scale-x-100",
          "transform-gpu origin-left"
        )} />
      </div>
    </div>
  );
}

export function IntercomActionTileGrid({ 
  tiles, 
  columns = 3, 
  className 
}: ActionTileGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(
      "grid gap-6",
      gridCols[columns],
      className
    )}>
      {tiles.map((tile, index) => (
        <div
          key={`${tile.label}-${index}`}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <ActionTile {...tile} />
        </div>
      ))}
    </div>
  );
}

export { ActionTile };
