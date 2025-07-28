"use client";

import React, { useState } from "react";
import { MessageItem } from "./MessagePanel/MessageItem";

/**
 * Test component to demonstrate the new click-based emoji reaction system
 * This replaces the old hover-based system that caused content displacement
 */
export function EmojiReactionTest() {
  const [reactions, setReactions] = useState<
    Array<{
      emoji: string;
      count: number;
      users: string[];
      hasReacted: boolean;
    }>
  >([
    { emoji: "👍", count: 2, users: ["Alice", "Bob"], hasReacted: false },
    { emoji: "❤️", count: 1, users: ["Charlie"], hasReacted: true },
  ]);

  const handleAddReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        if (existing.hasReacted) {
          // Already reacted, don't add again
          return prev;
        } else {
          // Add user reaction
          return prev.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true, users: [...r.users, "You"] } : r
          );
        }
      } else {
        // New reaction
        return [...prev, { emoji, count: 1, users: ["You"], hasReacted: true }];
      }
    });
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => {
      return prev
        .map((r) =>
          r.emoji === emoji && r.hasReacted
            ? {
                ...r,
                count: Math.max(0, r.count - 1),
                hasReacted: false,
                users: r.users.filter((u) => u !== "You"),
              }
            : r
        )
        .filter((r) => r.count > 0);
    });
  };

  return (
    <div className="min-h-screen space-y-6 bg-[var(--fl-color-background-subtle)] p-spacing-lg">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Click-Based Emoji Reaction System</h1>
        <p className="text-foreground mb-8">
          Click on any message bubble to open the emoji reaction modal. This eliminates content displacement issues from
          the old hover system.
        </p>

        <div className="space-y-3">
          {/* Customer Message */}
          <div className="flex justify-start">
            <MessageItem
              message={{
                id: "test-1",
                content: "Hey, I need help with my account setup. Can you assist me?",
                senderType: "customer",
                createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                status: "sent",
              }}
              customerData={{
                id: "customer-1",
                name: "Customer",
                email: "customer@example.com",
                avatar_url: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                organization_id: "",
                metadata: {},
                verification_status: "unverified",
              }}
            />
          </div>

          {/* Agent Message */}
          <div className="flex justify-end">
            <MessageItem
              message={{
                id: "test-2",
                content:
                  "Of course! I'd be happy to help you with your account setup. Let me guide you through the process step by step.",
                senderType: "agent",
                senderName: "Agent",
                createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
                status: "sent",
              }}
              customerData={{
                id: "customer-1",
                name: "Customer",
                email: "customer@example.com",
                avatar_url: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                organization_id: "",
                metadata: {},
                verification_status: "unverified",
              }}
            />
          </div>

          {/* Customer Message with Reactions */}
          <div className="flex justify-start">
            <MessageItem
              message={{
                id: "test-3",
                content: "Perfect! That sounds great. I really appreciate your help.",
                senderType: "customer",
                createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
                status: "sent",
              }}
              customerData={{
                id: "customer-1",
                name: "Customer",
                email: "customer@example.com",
                avatar_url: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                organization_id: "",
                metadata: {},
                verification_status: "unverified",
              }}
            />
          </div>
        </div>

        <div className="bg-background mt-8 rounded-ds-lg border spacing-3">
          <h3 className="mb-2 font-semibold text-gray-900">Features:</h3>
          <ul className="text-foreground space-y-1 text-sm">
            <li>✅ Click-based interaction (no hover displacement)</li>
            <li>✅ Modal-based emoji picker</li>
            <li>✅ Quick reactions + full emoji picker</li>
            <li>✅ Visual click indicators</li>
            <li>✅ Existing reaction display and management</li>
            <li>✅ Smooth animations and transitions</li>
            <li>✅ Accessible tooltips and labels</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
