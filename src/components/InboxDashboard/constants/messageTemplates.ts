// Message templates for quick responses

import type { MessageTemplate } from "../types";

export const messageTemplates: MessageTemplate[] = [
  {
    id: "greeting",
    label: "Greeting",
    content: "Hello! Thank you for contacting us. How can I help you today?",
    category: "general",
  },
  {
    id: "follow-up",
    label: "Follow-up",
    content: "I wanted to follow up on your previous inquiry. Is there anything else I can help you with?",
    category: "general",
  },
  {
    id: "closing",
    label: "Closing",
    content: "Thank you for your time. If you have any other questions, please don't hesitate to reach out.",
    category: "general",
  },
  {
    id: "escalation",
    label: "Escalation",
    content: "I understand your concern. Let me connect you with a specialist who can better assist you.",
    category: "support",
  },
  {
    id: "technical-support",
    label: "Technical Support",
    content:
      "I'll help you troubleshoot this issue. Can you please provide more details about what you're experiencing?",
    category: "support",
  },
  {
    id: "billing-inquiry",
    label: "Billing Inquiry",
    content: "I'll be happy to help you with your billing question. Let me look into your account details.",
    category: "billing",
  },
  {
    id: "refund-request",
    label: "Refund Request",
    content: "I understand you'd like to request a refund. Let me review your order and our refund policy.",
    category: "billing",
  },
  {
    id: "product-info",
    label: "Product Information",
    content: "I'd be happy to provide more information about our products. What specific details are you looking for?",
    category: "sales",
  },
  {
    id: "demo-request",
    label: "Demo Request",
    content: "Thank you for your interest in a demo. I'll schedule a personalized demonstration for you.",
    category: "sales",
  },
  {
    id: "pricing-inquiry",
    label: "Pricing Inquiry",
    content: "I'll provide you with detailed pricing information that fits your specific needs.",
    category: "sales",
  },
];

// Emoji collections for quick reactions and picker
export const quickReactionEmojis = ["👍", "❤️", "😊", "👏"];

export const emojiPickerEmojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
];

// Keyboard shortcuts configuration
export const keyboardShortcuts = [
  { key: "Cmd/Ctrl + K", description: "Focus search" },
  { key: "Cmd/Ctrl + Shift + K", description: "AI Suggestions" },
  { key: "Cmd/Ctrl + Enter", description: "Send message" },
  { key: "Cmd/Ctrl + E", description: "Toggle emoji picker" },
  { key: "Cmd/Ctrl + T", description: "Toggle templates" },
  { key: "Cmd/Ctrl + U", description: "Upload file" },
  { key: "Cmd/Ctrl + H", description: "Toggle AI handover" },
  { key: "Cmd/Ctrl + Shift + A", description: "AI handover (alternative)" },
  { key: "Alt + ↑/↓", description: "Navigate conversations" },
  { key: "Esc", description: "Close modals" },
  { key: "?", description: "Show shortcuts" },
];

// AI suggestion fallbacks
export const fallbackAISuggestions: MessageTemplate[] = [
  {
    id: "ai-fallback-1",
    label: "Acknowledge",
    content: "Thank you for reaching out. I understand your concern and I'm here to help.",
    category: "ai-generated",
  },
  {
    id: "ai-fallback-2",
    label: "Clarify",
    content: "Could you please provide a bit more detail about the issue you're experiencing?",
    category: "ai-generated",
  },
  {
    id: "ai-fallback-3",
    label: "Resolve",
    content: "Let me look into this for you and get back with a solution shortly.",
    category: "ai-generated",
  },
];
