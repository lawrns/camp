/**
 * Component Animations
 * Beautiful animations for cards, buttons, modals, dropdowns, tabs, and accordions
 */

"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, MotionStyle, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Card hover animations with 3D transforms
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverRotate?: number;
}

export function AnimatedCard({ children, className, hoverScale = 1.05, hoverRotate = 1 }: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn("relative transform-gpu", className)}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      initial={false}
      animate={isHovered ? "hover" : "rest"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={{
        rest: {
          scale: 1,
          rotateY: 0,
          z: 0,
        },
        hover: {
          scale: hoverScale,
          rotateY: hoverRotate,
          z: 50,
        },
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-ds-lg bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0"
        variants={{
          rest: { opacity: 0 },
          hover: { opacity: 1 },
        }}
      />
      {children}
    </motion.div>
  );
}

// Button press animation
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  style?: React.CSSProperties;
}

export function AnimatedButton({ children, className, variant = "default", ...props }: AnimatedButtonProps) {
  const baseClass = cn(
    "relative rounded-ds-lg px-4 py-2 font-medium transition-colors",
    {
      "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
      "border border-[var(--fl-color-border-strong)] hover:bg-neutral-50": variant === "outline",
      "hover:bg-gray-100": variant === "ghost",
    },
    className
  );

  // Separate motion-specific props from button props
  const { style, ...buttonProps } = props;

  // Create motion-compatible props object with proper typing for exactOptionalPropertyTypes
  const motionProps = {
    className: baseClass,
    ...(style && { style: style as MotionStyle }),
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.95 },
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 17,
    },
    ...buttonProps,
  };

  return (
    // Use type assertion to handle exactOptionalPropertyTypes properly
    <motion.button {...(motionProps as unknown)}>
      <motion.span className="relative z-10" initial={false} animate={{ y: 0 }} whileTap={{ y: 1 }}>
        {children}
      </motion.span>
    </motion.button>
  );
}

// Modal entrance animation
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedModal({ isOpen, onClose, children, className }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "rounded-ds-xl bg-white spacing-4 shadow-xl",
              className
            )}
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 20,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Dropdown smooth reveal
interface AnimatedDropdownProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedDropdown({ isOpen, children, className }: AnimatedDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn("absolute mt-2 origin-top", className)}
          initial={{
            opacity: 0,
            scaleY: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            scaleY: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scaleY: 0,
            y: -10,
          }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Tab switching with layout animations
interface AnimatedTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  className?: string;
}

export function AnimatedTabs({ tabs, defaultTab, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div className={className}>
      <div className="flex space-x-1 border-b border-[var(--fl-color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "text-typography-sm relative px-4 py-2 font-medium transition-colors",
              activeTab === tab.id ? "text-blue-600" : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="bg-primary absolute bottom-0 left-0 right-0 h-0.5"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className="py-4"
        >
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Accordion expand/collapse
interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AnimatedAccordionProps {
  items: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export function AnimatedAccordion({ items, className, allowMultiple = false }: AnimatedAccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    if (allowMultiple) {
      setOpenItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
    } else {
      setOpenItems((prev) => (prev.includes(itemId) ? [] : [itemId]));
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);

        return (
          <div key={item.id} className="overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)]">
            <motion.button
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--fl-color-background-subtle)]"
              animate={{ backgroundColor: isOpen ? "#f9fafb" : "#ffffff" }}
            >
              <span className="font-medium">{item.title}</span>
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  fill="currentColor"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                />
              </motion.svg>
            </motion.button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                      },
                      opacity: {
                        duration: 0.2,
                        delay: 0.1,
                      },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: {
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                      },
                      opacity: {
                        duration: 0.2,
                      },
                    },
                  }}
                >
                  <div className="text-foreground px-4 py-3">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Hover reveal animation
interface HoverRevealProps {
  children: React.ReactNode;
  reveal: React.ReactNode;
  className?: string;
}

export function HoverReveal({ children, reveal, className }: HoverRevealProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn("relative", className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-ds-lg bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              {reveal}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
