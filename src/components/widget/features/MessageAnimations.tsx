"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedMessageProps {
  children: React.ReactNode;
  sender: "user" | "agent" | "ai";
  isNew?: boolean;
  delay?: number;
  className?: string;
}

export function AnimatedMessage({ children, sender, isNew = false, delay = 0, className = "" }: AnimatedMessageProps) {
  const isUser = sender === "user";

  return (
    <motion.div
      initial={
        isNew
          ? {
              opacity: 0,
              y: 20,
              scale: 0.95,
              x: isUser ? 20 : -20,
            }
          : false
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        x: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: delay,
        duration: 0.4,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MessageBubbleProps {
  content: string;
  sender: "user" | "agent" | "ai";
  timestamp: Date;
  avatar?: string;
  agentName?: string;
  isNew?: boolean;
  className?: string;
}

export function AnimatedMessageBubble({
  content,
  sender,
  timestamp,
  avatar,
  agentName,
  isNew = false,
  className = "",
}: MessageBubbleProps) {
  const isUser = sender === "user";
  const displayName = sender === "agent" ? agentName : sender === "ai" ? agentName : "You";

  return (
    <AnimatedMessage sender={sender} isNew={isNew} className={className}>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`flex ${isUser ? "flex-row-reverse" : "flex-row"} max-w-xs items-end space-x-2 lg:max-w-md`}>
          {/* Avatar */}
          {!isUser && (
            <motion.div
              initial={isNew ? { scale: 0, rotate: -180 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 20,
                delay: 0.1,
              }}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-medium text-white"
            >
              {avatar || displayName?.charAt(0)?.toUpperCase() || "👤"}
            </motion.div>
          )}

          {/* Message bubble */}
          <motion.div
            initial={
              isNew
                ? {
                    scale: 0.8,
                    opacity: 0,
                    y: 10,
                  }
                : false
            }
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.15,
            }}
            className={`relative radius-2xl px-4 py-2 shadow-sm ${
              isUser
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                : "border border-[var(--fl-color-border)] bg-white text-gray-800"
            } `}
          >
            {/* Agent name for non-user messages */}
            {!isUser && displayName && (
              <motion.div
                initial={isNew ? { opacity: 0, y: -5 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-1 text-tiny font-medium text-blue-600"
              >
                {displayName}
              </motion.div>
            )}

            {/* Message content with typewriter effect for new messages */}
            <MessageContent content={content} isNew={isNew} delay={0.25} />

            {/* Timestamp */}
            <motion.div
              initial={isNew ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`mt-1 text-xs ${isUser ? "text-blue-100" : "text-gray-400"}`}
            >
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </motion.div>

            {/* Message tail */}
            <div
              className={`absolute top-4 h-3 w-3 rotate-45 transform ${
                isUser
                  ? "-right-1 bg-gradient-to-br from-blue-500 to-purple-600"
                  : "-left-1 border-b border-r border-[var(--fl-color-border)] bg-white"
              } `}
            />
          </motion.div>
        </div>
      </div>
    </AnimatedMessage>
  );
}

interface MessageContentProps {
  content: string;
  isNew?: boolean;
  delay?: number;
}

function MessageContent({ content, isNew = false, delay = 0 }: MessageContentProps) {
  if (!isNew) {
    return <div className="text-sm leading-relaxed">{content}</div>;
  }

  // Typewriter effect for new messages
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="text-sm leading-relaxed"
    >
      <TypewriterText text={content} speed={30} />
    </motion.div>
  );
}

interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
}

function TypewriterText({ text, speed = 50 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-0.5 inline-block h-4 w-0.5 bg-current"
        />
      )}
    </span>
  );
}

// Tab switching animations
interface AnimatedTabContentProps {
  children: React.ReactNode;
  isActive: boolean;
  direction?: "left" | "right";
}

export function AnimatedTabContent({ children, isActive, direction = "right" }: AnimatedTabContentProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="tab-content"
          initial={{
            opacity: 0,
            x: direction === "right" ? 20 : -20,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            x: direction === "right" ? -20 : 20,
            scale: 0.98,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3,
          }}
          className="h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Card expansion animations
interface AnimatedCardProps {
  children: React.ReactNode;
  isExpanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AnimatedCard({ children, isExpanded = false, onClick, className = "" }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -2,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      }}
      whileTap={{ scale: 0.98 }}
      animate={{
        scale: isExpanded ? 1.05 : 1,
        zIndex: isExpanded ? 10 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Greeting animation
interface AnimatedGreetingProps {
  message: string;
  agentName?: string;
  delay?: number;
}

export function AnimatedGreeting({ message, agentName, delay = 0 }: AnimatedGreetingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay,
      }}
      className="mb-4 rounded-ds-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-spacing-md text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
          delay: delay + 0.2,
        }}
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-ds-full bg-gradient-to-br from-blue-400 to-purple-500 text-lg text-white"
      >
        👋
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.3 }}
        className="mb-2 text-base font-semibold text-gray-800"
      >
        {agentName ? `Hi! I'm ${agentName}` : "Welcome!"}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.4 }}
        className="text-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
