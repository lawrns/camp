"use client";

import React, { useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { AlertTriangle as AlertTriangle, MoreVertical as MoreVertical, Paperclip as PaperclipIcon, Send as Send, Smile as SmileIcon, Ticket, WifiHigh, WifiSlash as WifiHighOff,  } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/unified-ui/components/Alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { ChatAppContextValue, ChatAppState, Conversation, Message, Operator } from "./types";

// Mock useApp hook since context doesn't exist
const useApp = (): ChatAppContextValue => ({
  selectedConversationId: null as string | null,
  messages: [] as Message[],
  conversations: [] as Conversation[],
  operators: [] as Operator[],
  sendMessage: (text: string, conversationId: string, authorId: string) => {},
  createTicket: (conversationId: string, subject: string, priority: "low" | "medium" | "high" | "urgent") => {},
  getImageUrl: (id: string, type: "operator" | "customer") => "",
  findOperator: (id: string) => null,
  setState: (() => {}) as React.Dispatch<React.SetStateAction<ChatAppState>>,
  isRealtimeConnected: false,
  connectRealtime: () => {},
});

interface ChatViewProps {
  className?: string;
}

export function ChatView({ className }: ChatViewProps) {
  const {
    selectedConversationId,
    messages,
    conversations,
    operators,
    sendMessage,
    createTicket,
    getImageUrl,
    findOperator,
    setState,
    isRealtimeConnected,
    connectRealtime,
  } = useApp();

  const [newMessage, setNewMessage] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId);

  const handleCreateTicket = (priority: "low" | "medium" | "high" | "urgent") => {
    if (!selectedConversationId || !selectedConversation) return;

    createTicket(String(selectedConversationId), `Support Request - ${selectedConversation.subject}`, priority);

    setIsEscalated(true);

    // Send system message about ticket creation
    setTimeout(() => {
      sendMessage("This conversation has been escalated to a ticket.", selectedConversationId, "system");
    }, 500);
  };

  const conversationMessages = messages.filter((msg: unknown) => msg.conversationId === selectedConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    const operatorId =
      selectedConversation?.assigned_to || selectedConversation?.assignedOperatorId || operators[0]?.id;
    if (operatorId) {
      sendMessage(newMessage, selectedConversationId, operatorId);
    }
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRAGHandoff = () => {
    if (!selectedConversationId) return;

    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv: unknown) =>
        conv.id === selectedConversationId ? { ...conv, assigned_to: "op_002", assignedOperatorId: "op_002" } : conv
      ),
    }));

    setTimeout(() => {
      sendMessage("This conversation has been handed off to RAG assistant.", selectedConversationId, "system");
    }, 500);
  };

  const isRAGAgent = (authorId: string) => {
    const operator = findOperator(authorId);
    // Check if the operator is an AI/RAG agent by checking for AI-specific properties
    return operator?.metadata?.isAI === true || operator?.id?.includes("ai-") || operator?.id?.startsWith("ai");
  };

  return (
    <div className={cn("flex h-full flex-col bg-white/80 backdrop-blur-lg dark:bg-slate-900/80", className)}>
      <div className="bg-background/90 sticky top-0 z-10 border-b spacing-3 backdrop-blur-lg dark:bg-slate-900/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              {selectedConversation?.customerAvatar && (
                <AvatarImage
                  {...(selectedConversation.customerAvatar && { src: selectedConversation.customerAvatar })}
                />
              )}
              <AvatarFallback>
                {selectedConversation?.customerName?.[0] || selectedConversation?.customerEmail?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="font-medium">
                  {selectedConversation?.customerName || selectedConversation?.customerEmail}
                </h3>
                {selectedConversation?.channel === "email" && (
                  <Badge variant="outline" className="ml-2">
                    Email
                  </Badge>
                )}
                <div className="ml-2 flex items-center">
                  {isRealtimeConnected ? (
                    <div className="text-semantic-success-dark flex items-center">
                      <Icon icon={WifiHigh} className="mr-1 h-3 w-3" />
                      <span className="text-tiny">Live</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <Icon icon={WifiHighOff} className="mr-1 h-3 w-3" />
                      <span className="text-tiny">Offline</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selectedConversation?.subject}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon">
                <Icon icon={MoreVertical} className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => handleCreateTicket("low")}>
                <Icon icon={Ticket} className="mr-2 h-4 w-4" />
                Create Low Priority Ticket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTicket("medium")}>
                <Icon icon={Ticket} className="mr-2 h-4 w-4" />
                Create Medium Priority Ticket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateTicket("high")}>
                <Icon icon={Ticket} className="text-brand-mahogany-500 mr-2 h-4 w-4" />
                Create High Priority Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto spacing-3">
        <OptimizedAnimatePresence>
          {isEscalated && (
            <OptimizedMotion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Alert variant="primary" className="mx-4 mt-2 border-amber-200 bg-amber-500/10 text-amber-600">
                <Icon icon={AlertTriangle} className="h-4 w-4" />
                <AlertTitle>Conversation Handed Off</AlertTitle>
                <AlertDescription>This conversation has been handed off to the RAG assistant.</AlertDescription>
              </Alert>
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>

        {conversationMessages.map((msg: unknown) => {
          const isCustomer = msg.author === "customer";
          const isSystem = msg.author === "system";
          const isRAG = !isCustomer && !isSystem && isRAGAgent(msg.author);

          return (
            <OptimizedMotion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex", isCustomer ? "justify-end" : "justify-start")}
            >
              {!isCustomer && !isSystem && (
                <Avatar className="mr-2 mt-1 h-8 w-8">
                  <AvatarImage
                    {...(getImageUrl(msg.author, "operator") && { src: getImageUrl(msg.author, "operator") })}
                  />
                  <AvatarFallback>{findOperator(msg.author)?.name?.charAt(0) || "A"}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[80%] radius-2xl px-4 py-2 shadow-sm",
                  isCustomer
                    ? "bg-brand-blue-500 text-white shadow-md"
                    : isSystem
                      ? "w-full border border-[var(--fl-color-border)] bg-neutral-100 text-center text-neutral-600"
                      : "border border-[var(--fl-color-border)] bg-white"
                )}
              >
                {!isCustomer && !isSystem && (
                  <div className="mb-1 flex items-center">
                    <span className="text-tiny font-medium">{findOperator(msg.author)?.name || "Agent"}</span>
                    <span className="ml-auto text-tiny text-muted-foreground">{msg.ts}</span>
                  </div>
                )}

                <p className={cn("text-sm", isCustomer ? "text-white" : "text-foreground")}>{msg.text}</p>

                {isCustomer && (
                  <div className="mt-1 flex justify-end">
                    <span className="text-tiny text-white/80">{msg.ts}</span>
                  </div>
                )}
              </div>

              {isCustomer && (
                <Avatar className="ml-2 mt-1 h-8 w-8">
                  {selectedConversation?.customerAvatar && (
                    <AvatarImage
                      {...(selectedConversation.customerAvatar && { src: selectedConversation.customerAvatar })}
                    />
                  )}
                  <AvatarFallback>
                    {selectedConversation?.customerName?.[0] || selectedConversation?.customerEmail?.[0]}
                  </AvatarFallback>
                </Avatar>
              )}
            </OptimizedMotion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-background border-t">
        <div className="spacing-3">
          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <Textarea
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="border-ds-border-strong max-h-[120px] min-h-[48px] resize-none rounded-ds-lg border px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-ds-2">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-background hover:text-foreground h-10 w-10 text-[var(--fl-color-text-muted)]"
              >
                <Icon icon={PaperclipIcon} className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-background hover:text-foreground h-10 w-10 text-[var(--fl-color-text-muted)]"
              >
                <Icon icon={SmileIcon} className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                className="bg-primary h-10 w-10 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-[var(--fl-color-text-muted)]"
              >
                <Icon icon={Send} className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
