"use client";

import React from "react";
import {
  BookOpen,
  Eye,
  Envelope as Mail,
  ChatCircle as MessageSquare,
  Phone,
  MagnifyingGlass as Search,
  Star,
  Users,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Icon } from "@/lib/ui/Icon";

export interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  rating: number;
  lastUpdated: Date;
  similarity: number;
}

export interface ConversationResult {
  id: string;
  subject: string;
  customer: string;
  agent: string;
  status: string;
  channel: string;
  createdAt: Date;
  similarity: number;
}

export interface UserResult {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: Date;
  conversationCount: number;
}

export interface SearchResultsData {
  knowledge: KnowledgeResult[];
  conversations: ConversationResult[];
  users: UserResult[];
}

interface SearchResultsProps {
  results: SearchResultsData;
  query: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SearchResults({ results, query, activeTab, onTabChange }: SearchResultsProps) {
  const getTotalResults = () => {
    return results.knowledge.length + results.conversations.length + results.users.length;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return Mail;
      case "chat":
        return MessageSquare;
      case "phone":
        return Phone;
      default:
        return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!query) return null;

  if (getTotalResults() === 0) {
    return (
      <Card>
        <CardContent className="p-spacing-lg text-center">
          <Icon icon={Search} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-base font-medium text-gray-900">No results found</h3>
          <p className="text-foreground mb-4">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (isFeatureEnabled("enableRealtimeSync")) {
                // Reset search state without page reload
                // This would trigger a search state reset in the parent component
              } else {
                window.location.reload();
              }
            }}
          >
            Clear Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-3">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All ({getTotalResults()})</TabsTrigger>
        <TabsTrigger value="knowledge">
          <Icon icon={BookOpen} className="mr-2 h-4 w-4" />
          Knowledge ({results.knowledge.length})
        </TabsTrigger>
        <TabsTrigger value="conversations">
          <Icon icon={MessageSquare} className="mr-2 h-4 w-4" />
          Conversations ({results.conversations.length})
        </TabsTrigger>
        <TabsTrigger value="users">
          <Icon icon={Users} className="mr-2 h-4 w-4" />
          Users ({results.users.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-3">
        {/* Knowledge Results */}
        {results.knowledge.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-ds-2 text-base font-semibold">
              <Icon icon={BookOpen} className="h-5 w-5" />
              Knowledge Base
            </h3>
            {results.knowledge.map((item: unknown) => (
              <KnowledgeResultCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Conversation Results */}
        {results.conversations.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-ds-2 text-base font-semibold">
              <Icon icon={MessageSquare} className="h-5 w-5" />
              Conversations
            </h3>
            {results.conversations.map((item: unknown) => (
              <ConversationResultCard
                key={item.id}
                item={item}
                getChannelIcon={getChannelIcon}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        )}

        {/* User Results */}
        {results.users.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-ds-2 text-base font-semibold">
              <Icon icon={Users} className="h-5 w-5" />
              Users
            </h3>
            {results.users.map((item: unknown) => (
              <UserResultCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="knowledge">
        <div className="space-y-3">
          {results.knowledge.map((item: unknown) => (
            <KnowledgeResultCard key={item.id} item={item} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="conversations">
        <div className="space-y-3">
          {results.conversations.map((item: unknown) => (
            <ConversationResultCard
              key={item.id}
              item={item}
              getChannelIcon={getChannelIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="users">
        <div className="space-y-3">
          {results.users.map((item: unknown) => (
            <UserResultCard key={item.id} item={item} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function KnowledgeResultCard({ item }: { item: KnowledgeResult }) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-card-hover">
      <CardContent className="spacing-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="mb-2 text-base font-medium">{item.title}</h4>
            <p className="text-foreground mb-3 line-clamp-2 text-sm">{item.content}</p>
            <div className="flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
              <span className="flex items-center gap-1">
                <Icon icon={Eye} className="h-3 w-3" />
                {item.views} views
              </span>
              <span className="flex items-center gap-1">
                <Icon icon={Star} className="h-3 w-3 fill-orange-400 text-orange-400" />
                {item.rating}
              </span>
              <span>Updated {item.lastUpdated.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-ds-2">
            <Badge variant="outline">{item.category}</Badge>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">
              {Math.round(item.similarity * 100)}% match
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.map((tag: unknown) => (
            <Badge key={tag} variant="secondary" className="text-tiny">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationResultCard({
  item,
  getChannelIcon,
  getStatusColor,
}: {
  item: ConversationResult;
  getChannelIcon: (channel: string) => any;
  getStatusColor: (status: string) => string;
}) {
  const ChannelIcon = getChannelIcon(item.channel);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-card-hover">
      <CardContent className="spacing-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="mb-2 text-base font-medium">{item.subject}</h4>
            <div className="text-foreground mb-2 flex items-center gap-3 text-sm">
              <span>Customer: {item.customer}</span>
              <span>Agent: {item.agent}</span>
            </div>
            <div className="flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
              <span className="flex items-center gap-1">
                <ChannelIcon className="h-3 w-3" />
                {item.channel}
              </span>
              <span>{item.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-ds-2">
            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
            <div className="text-tiny text-[var(--fl-color-text-muted)]">
              {Math.round(item.similarity * 100)}% match
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserResultCard({ item }: { item: UserResult }) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-card-hover">
      <CardContent className="spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-gray-200">
              {item.name
                .split(" ")
                .map((n: unknown) => n[0])
                .join("")}
            </div>
            <div>
              <h4 className="font-medium">{item.name}</h4>
              <p className="text-foreground text-sm">{item.email}</p>
              <div className="flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                <span className="capitalize">{item.role}</span>
                <span>{item.conversationCount} conversations</span>
                <span>Last active {item.lastActive.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {item.role}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
