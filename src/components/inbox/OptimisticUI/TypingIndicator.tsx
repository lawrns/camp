import React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  users: Array<{
    id: string;
    name?: string;
    type?: string;
  }>;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users, className }) => {
  if (users.length === 0) return null;

  const displayNames = users
    .slice(0, 3)
    .map((u: any) => u.name || "Someone")
    .join(", ");

  const extraCount = users.length - 3;
  const text =
    extraCount > 0
      ? `${displayNames} and ${extraCount} more are typing...`
      : users.length === 1
        ? `${displayNames} is typing...`
        : `${displayNames} are typing...`;

  return (
    <div className={cn("text-typography-sm flex items-center gap-2 px-4 py-2 text-neutral-500", className)}>
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot animation-delay-200" />
        <span className="typing-dot animation-delay-400" />
      </div>
      <span>{text}</span>

      <style jsx>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6b7280;
          animation: typing 1.4s infinite;
        }

        @keyframes typing {
          0%,
          80%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.3);
            opacity: 1;
          }
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};
