import React from "react";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]} is typing...`
      : users.length === 2
        ? `${users[0]} and ${users[1]} are typing...`
        : `${users[0]} and ${users.length - 1} others are typing...`;

  return (
    <div className="phoenix-typing-indicator">
      <div className="phoenix-typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="phoenix-typing-text">{text}</span>
    </div>
  );
}
