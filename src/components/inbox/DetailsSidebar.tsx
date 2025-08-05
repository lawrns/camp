"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/unified-ui/components/Avatar";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Separator } from "@/components/unified-ui/components/Separator";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { Conversation } from "@/types/entities/conversation";
import {
  ChartLine as Activity,
  ArrowSquareOut,
  Calendar,
  Clock,
  Copy,
  PencilSimple as Edit2,
  Envelope as Mail,
  MapPin,
  ChatCircle as MessageSquare,
  Phone,
  User,
  X,
} from "@phosphor-icons/react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import React, { useEffect, useState } from "react";

interface DetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  conversation?: Conversation; // Added
  className?: string;
}

// TODO: Replace with real customer data from useCustomerData hook
// This component should be deprecated in favor of CustomerSidebar
const mockCustomer = {
  id: "deprecated",
  name: "Please use CustomerSidebar component",
  email: "deprecated@example.com",
  phone: "N/A",
  location: "N/A",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=deprecated",
  joinedDate: "2023-01-15",
  lifetime_value: "$0",
  total_conversations: 0,
  average_response_time: "N/A",
  satisfaction_score: 0,
  tags: ["Deprecated"],
  recent_orders: [],
  notes: [
    { id: "1", author: "Sarah", date: "2024-01-08", content: "Prefers email communication" },
    { id: "2", author: "Mike", date: "2024-01-02", content: "VIP customer - handle with care" },
  ],
};

export { DetailsSidebar as UnifiedDetailsSidebar };

export function DetailsSidebar({ isOpen, onClose, conversationId, conversation, className }: DetailsSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<"customer" | "conversation">("customer");

  const getAvatarUrl = (email?: string) => {
    if (!email) return "";
    const seed = email.split("@")[0];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  const calculateLTV = (orders: unknown[]) => {
    if (!orders || orders.length === 0) return "$0";
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount.replace("$", "")), 0);
    return `$${totalAmount.toFixed(2)}`;
  };

  const [recentOrders, setRecentOrders] = useState([]);
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    if (!conversation?.customer_id) return;
    // Fetch recent orders
    fetch(`/api/customers/${conversation.customer_id}/orders`)
      .then((res) => res.json())
      .then((data) => setRecentOrders(data));
    // Fetch notes
    fetch(`/api/conversations/${conversation.id}/notes`)
      .then((res) => res.json())
      .then((data) => setNotes(data));
  }, [conversation]);

  const customerData = {
    id: conversation?.customerId || "unknown",
    name: conversation?.customerName || conversation?.customerEmail?.split("@")[0] || "Unknown",
    email: conversation?.customerEmail || "",
    phone: "N/A",
    avatar: getAvatarUrl(conversation?.customerEmail || undefined) || "",
    location: "",
    joinedDate: conversation?.createdAt ? new Date(conversation.createdAt).toLocaleDateString() : "N/A",
    lifetime_value: "$0",
    total_conversations: conversation?.messageCount || 0,
    average_response_time: "N/A",
    satisfaction_score: 0,
    tags: conversation?.tags || [],
    recent_orders: recentOrders,
    notes: notes,
  };

  useEffect(() => {
    // Fetch recent orders and notes
  }, [conversationId]);

  return (
    <OptimizedAnimatePresence mode="wait">
      {isOpen && (
        <OptimizedMotion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn("flex flex-col overflow-hidden border-l bg-background", className)}
        >
          {/* Header */}
          <div className="bg-background flex h-16 items-center justify-between border-b px-4">
            <div className="flex items-center gap-ds-2">
              <Button
                variant={activeTab === "customer" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("customer")}
                className="h-8"
              >
                <Icon icon={User} className="mr-1 h-4 w-4" />
                Customer
              </Button>
              <Button
                variant={activeTab === "conversation" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("conversation")}
                className="h-8"
              >
                <Icon icon={MessageSquare} className="mr-1 h-4 w-4" />
                Details
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon icon={X} className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {activeTab === "customer" ? (
              <CustomerDetails customer={customerData} />
            ) : conversationId ? (
              <ConversationDetails {...(conversationId && { conversationId })} />
            ) : (
              <div className="spacing-3 text-center text-[var(--fl-color-text-muted)]">No conversation selected</div>
            )}
          </ScrollArea>
        </OptimizedMotion.aside>
      )}
    </OptimizedAnimatePresence>
  );
}

function CustomerDetails({ customer }: { customer: typeof mockCustomer }) {
  return (
    <div className="space-y-6 spacing-3">
      {/* Profile Section */}
      <OptimizedMotion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Avatar className="mx-auto mb-3 h-20 w-20">
          <AvatarImage src={customer.avatar} alt={customer.name} />
          <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="text-base font-semibold">{customer.name}</h3>
        <div className="mt-2 flex items-center justify-center gap-ds-2">
          {customer.tags.map((tag: unknown) => (
            <Badge key={tag} variant="secondary" className="text-tiny">
              {tag}
            </Badge>
          ))}
        </div>
      </OptimizedMotion.div>

      <Separator />

      {/* Contact Information */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>

        <div className="space-y-spacing-sm">
          <div className="group flex items-center justify-between">
            <div className="flex items-center gap-ds-2 text-sm">
              <Icon icon={Mail} className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{customer.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Icon icon={Copy} className="h-3 w-3" />
            </Button>
          </div>

          <div className="group flex items-center justify-between">
            <div className="flex items-center gap-ds-2 text-sm">
              <Icon icon={Phone} className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Icon icon={Copy} className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-ds-2 text-sm">
            <Icon icon={MapPin} className="h-4 w-4 text-muted-foreground" />
            <span>{customer.location}</span>
          </div>

          <div className="flex items-center gap-ds-2 text-sm">
            <Icon icon={Calendar} className="h-4 w-4 text-muted-foreground" />
            <span>Joined {new Date(customer.joinedDate).toLocaleDateString()}</span>
          </div>
        </div>
      </OptimizedMotion.div>

      <Separator />

      {/* Statistics */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h4 className="text-sm font-medium text-muted-foreground">Customer Statistics</h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-ds-lg bg-muted/50 spacing-3">
            <div className="text-3xl font-semibold">{customer.lifetime_value}</div>
            <div className="text-tiny text-muted-foreground">Lifetime Value</div>
          </div>
          <div className="rounded-ds-lg bg-muted/50 spacing-3">
            <div className="text-3xl font-semibold">{customer.total_conversations}</div>
            <div className="text-tiny text-muted-foreground">Conversations</div>
          </div>
          <div className="rounded-ds-lg bg-muted/50 spacing-3">
            <div className="text-3xl font-semibold">{customer.average_response_time}</div>
            <div className="text-tiny text-muted-foreground">Avg Response</div>
          </div>
          <div className="rounded-ds-lg bg-muted/50 spacing-3">
            <div className="text-3xl font-semibold">{customer.satisfaction_score}</div>
            <div className="text-tiny text-muted-foreground">Satisfaction</div>
          </div>
        </div>
      </OptimizedMotion.div>

      <Separator />

      {/* Recent Orders */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Orders</h4>
          <Button variant="ghost" size="sm" className="h-7 text-tiny">
            View All
            <Icon icon={ArrowSquareOut} className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-spacing-sm">
          {customer.recent_orders.map((order: unknown) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-ds-lg border bg-muted/20 p-spacing-sm transition-colors hover:bg-muted/30"
            >
              <div>
                <div className="text-sm font-medium">{order.id}</div>
                <div className="text-tiny text-muted-foreground">{order.date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{order.amount}</div>
                <Badge variant={order.status === "Delivered" ? "default" : "secondary"} className="text-tiny">
                  {order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </OptimizedMotion.div>

      <Separator />

      {/* Notes */}
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">Internal Notes</h4>
          <Button variant="ghost" size="sm" className="h-7 text-tiny">
            <Icon icon={Edit2} className="mr-1 h-3 w-3" />
            Add Note
          </Button>
        </div>

        <div className="space-y-spacing-sm">
          {customer.notes.map((note: unknown) => (
            <div key={note.id} className="rounded-ds-lg border bg-muted/20 spacing-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">{note.author}</span>
                <span className="text-tiny text-muted-foreground">{note.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{note.content}</p>
            </div>
          ))}
        </div>
      </OptimizedMotion.div>
    </div>
  );
}

function ConversationDetails({ conversationId }: { conversationId?: string }) {
  return (
    <div className="space-y-6 spacing-3">
      <OptimizedMotion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Conversation Details</h4>

        <div className="space-y-spacing-sm">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="primary">Active</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Priority</span>
            <Badge variant="secondary">Medium</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Last Reply</span>
            <span className="text-sm">15 minutes ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-sm">1h 45m</span>
          </div>
        </div>
      </OptimizedMotion.div>

      <Separator />

      <OptimizedMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h4 className="text-sm font-medium text-muted-foreground">Activity Timeline</h4>

        <div className="space-y-3">
          {[
            { icon: MessageSquare, text: "Customer sent initial message", time: "2 hours ago" },
            { icon: Activity, text: "AI Assistant engaged", time: "2 hours ago" },
            { icon: User, text: "Assigned to Sarah", time: "1 hour ago" },
            { icon: MessageSquare, text: "Sarah replied", time: "45 minutes ago" },
            { icon: Clock, text: "Customer viewed message", time: "30 minutes ago" },
            { icon: MessageSquare, text: "Customer replied", time: "15 minutes ago" },
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-ds-full bg-muted">
                <activity.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm">{activity.text}</p>
                <p className="text-tiny text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </OptimizedMotion.div>
    </div>
  );
}
