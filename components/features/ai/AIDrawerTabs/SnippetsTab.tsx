"use client";

import React, { useEffect, useState } from "react";
import { ArrowSquareOut, CheckCircle as Check, Copy, FileText, Search as Search } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { ScrollArea } from "@/components/unified-ui/components/ScrollArea";
import { Icon } from "@/lib/ui/Icon";
import type { Conversation, ConversationWithRelations } from "@/types/entities/conversation";

interface RAGSnippet {
  id: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
  category: string;
}

interface SnippetsTabProps {
  conversation: ConversationWithRelations;
}

export const SnippetsTab: React.FC<SnippetsTabProps> = ({ conversation }) => {
  const [snippets, setSnippets] = useState<RAGSnippet[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<RAGSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRAGSnippets();
  }, [conversation.id]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = snippets.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          snippet.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSnippets(filtered);
    } else {
      setFilteredSnippets(snippets);
    }
  }, [searchQuery, snippets]);

  const loadRAGSnippets = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real implementation, fetch from RAG service
      const mockSnippets: RAGSnippet[] = [
        {
          id: "1",
          title: "Refund Policy",
          content:
            "Customers are eligible for a full refund within 30 days of purchase. The item must be unused and in its original packaging. Processing takes 5-7 business days.",
          source: "Help Center > Policies",
          relevance: 95,
          category: "Policy",
        },
        {
          id: "2",
          title: "Shipping Delays FAQ",
          content:
            "Standard shipping typically takes 3-5 business days. During peak seasons, delays of 2-3 additional days are common. Track your order using the provided tracking number.",
          source: "FAQ > Shipping",
          relevance: 88,
          category: "FAQ",
        },
        {
          id: "3",
          title: "Technical Support Guide",
          content:
            "For technical issues: 1) Clear cache and cookies, 2) Update to the latest version, 3) Check system requirements. If issues persist, collect error logs for support.",
          source: "Support Docs > Troubleshooting",
          relevance: 82,
          category: "Guide",
        },
      ];
      setSnippets(mockSnippets);
      setFilteredSnippets(mockSnippets);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (snippet: RAGSnippet) => {
    const textToCopy = `${snippet.title}\n\n${snippet.content}\n\nSource: ${snippet.source}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "policy":
        return "bg-blue-100 text-blue-700";
      case "faq":
        return "bg-green-100 text-green-700";
      case "guide":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search Header */}
      <div className="border-b spacing-3">
        <div className="relative">
          <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="h-9 pl-10 pr-4"
          />
        </div>
        <p className="mt-2 text-tiny text-[var(--fl-color-text-muted)]">
          {filteredSnippets.length} relevant snippets from knowledge base
        </p>
      </div>

      {/* Snippets List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {isLoading ? (
            // Loading state
            <div className="flex h-64 items-center justify-center">
              <div className="text-center text-[var(--fl-color-text-muted)]">
                <Icon icon={FileText} className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p className="text-sm">Loading knowledge base...</p>
              </div>
            </div>
          ) : filteredSnippets.length > 0 ? (
            filteredSnippets.map((snippet: unknown) => (
              <Card key={snippet.id} className="spacing-3 transition-shadow hover:shadow-card-hover">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-ds-2">
                    <div className="flex-1">
                      <h4 className="mb-1 text-sm font-medium text-gray-900">{snippet.title}</h4>
                      <div className="flex flex-wrap items-center gap-ds-2">
                        <Badge variant="secondary" className={`text-xs ${getCategoryColor(snippet.category)}`}>
                          {snippet.category}
                        </Badge>
                        <Badge variant="outline" className="text-tiny">
                          {snippet.relevance}% match
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleCopy(snippet)}>
                      {copiedId === snippet.id ? (
                        <Icon icon={Check} className="text-semantic-success-dark h-3.5 w-3.5" />
                      ) : (
                        <Icon icon={Copy} className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {/* Content */}
                  <p className="leading-relaxed text-foreground text-sm">{snippet.content}</p>

                  {/* Source */}
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="flex items-center gap-1 text-tiny text-[var(--fl-color-text-muted)]">
                      <Icon icon={FileText} className="h-3 w-3" />
                      {snippet.source}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-tiny hover:text-blue-600">
                      View source
                      <Icon icon={ArrowSquareOut} className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-[var(--fl-color-text-muted)]">
              <Icon icon={Search} className="mb-2 h-12 w-12 opacity-50" />
              <p className="text-sm">No snippets found</p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-4">
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
