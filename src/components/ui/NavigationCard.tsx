"use client";

import { motion } from "framer-motion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface NavigationCardProps {
  item: { 
    name: string; 
    href: string; 
    icon: any; 
    description?: string 
  };
  isActive: boolean;
  onClick: () => void;
}

export const NavigationCard = ({ item, isActive, onClick }: NavigationCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "relative overflow-hidden rounded-xl p-4 cursor-pointer",
      "bg-white/95 backdrop-blur-sm border border-gray-200/50",
      "shadow-sm hover:shadow-md transition-all duration-200",
      isActive && "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-md"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "p-2 rounded-lg transition-colors",
        isActive 
          ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-sm" 
          : "bg-gray-100 hover:bg-gray-200"
      )}>
        <Icon 
          icon={item.icon} 
          className={cn(
            "h-5 w-5",
            isActive ? "text-white" : "text-gray-600"
          )} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-medium truncate",
          isActive ? "text-orange-900" : "text-gray-900"
        )}>
          {item.name}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-500 mt-1 truncate">
            {item.description}
          </p>
        )}
      </div>
    </div>
  </motion.div>
); 