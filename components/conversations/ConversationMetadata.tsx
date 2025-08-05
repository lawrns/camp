"use client";

import React, { useState } from "react";
import { Clock, PencilSimple as Edit3, MessageCircle as MessageSquare, Plus, FloppyDisk as Save, Tag, User, X,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface ConversationMetadataProps {
  conversationId: string;
  metadata: {
    tags: string[];
    category?: string;
    customFields?: Record<string, any>;
    notes?: string;
    customerInfo?: {
      name?: string;
      email?: string;
      tier?: string;
      company?: string;
    };
    context?: {
      source?: string;
      referrer?: string;
      userAgent?: string;
      sessionId?: string;
    };
  };
  onMetadataUpdate: (metadata: unknown) => void;
  className?: string;
}

const predefinedCategories = [
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing & Payments" },
  { value: "sales", label: "Sales Inquiry" },
  { value: "feedback", label: "Feedback" },
  { value: "bug_report", label: "Bug Report" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General Inquiry" },
  { value: "complaint", label: "Complaint" },
  { value: "refund", label: "Refund Request" },
  { value: "other", label: "Other" },
];

const predefinedTags = [
  "urgent",
  "vip",
  "escalated",
  "resolved",
  "pending",
  "follow-up",
  "technical",
  "billing",
  "sales",
  "bug",
  "feature",
  "training",
  "integration",
  "api",
  "mobile",
  "web",
  "performance",
  "security",
];

export function ConversationMetadata({
  conversationId,
  metadata,
  onMetadataUpdate,
  className,
}: ConversationMetadataProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState(metadata);
  const [newTag, setNewTag] = useState("");
  const [newCustomField, setNewCustomField] = useState({ key: "", value: "" });

  const handleSave = async () => {
    try {
      await onMetadataUpdate(editedMetadata);
      setIsEditing(false);
    } catch (error) {}
  };

  const handleCancel = () => {
    setEditedMetadata(metadata);
    setIsEditing(false);
  };

  const addTag = (tag: string) => {
    if (tag && !editedMetadata.tags.includes(tag)) {
      setEditedMetadata({
        ...editedMetadata,
        tags: [...editedMetadata.tags, tag],
      });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setEditedMetadata({
      ...editedMetadata,
      tags: editedMetadata.tags.filter((tag: string) => tag !== tagToRemove),
    });
  };

  const addCustomField = () => {
    if (newCustomField.key && newCustomField.value) {
      setEditedMetadata({
        ...editedMetadata,
        customFields: {
          ...editedMetadata.customFields,
          [newCustomField.key]: newCustomField.value,
        },
      });
      setNewCustomField({ key: "", value: "" });
    }
  };

  const removeCustomField = (key: string) => {
    const { [key]: removed, ...rest } = editedMetadata.customFields || {};
    setEditedMetadata({
      ...editedMetadata,
      customFields: rest,
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-ds-2 text-sm font-medium">
            <Icon icon={Tag} className="h-4 w-4" />
            Conversation Metadata
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}>
            {isEditing ? <Icon icon={X} className="h-4 w-4" /> : <Icon icon={Edit3} className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category */}
        <div className="space-y-spacing-sm">
          <label className="text-sm font-medium">Category</label>
          {isEditing ? (
            <Select
              value={editedMetadata.category || ""}
              onValueChange={(value) => setEditedMetadata({ ...editedMetadata, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {predefinedCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-tiny">
              {predefinedCategories.find((c) => c.value === metadata.category)?.label || "Uncategorized"}
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-spacing-sm">
          <label className="text-sm font-medium">Tags</label>
          <div className="flex flex-wrap gap-1">
            {(isEditing ? editedMetadata.tags : metadata.tags).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-tiny">
                {tag}
                {isEditing && (
                  <X className="hover:text-brand-mahogany-500 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                )}
              </Badge>
            ))}
          </div>

          {isEditing && (
            <div className="space-y-spacing-sm">
              <div className="flex gap-ds-2">
                <Input
                  placeholder="Add new tag"
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag(newTag)}
                  className="text-sm"
                />
                <Button size="sm" onClick={() => addTag(newTag)}>
                  <Icon icon={Plus} className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {predefinedTags
                  .filter((tag: string) => !editedMetadata.tags.includes(tag))
                  .map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="hover:bg-background cursor-pointer text-tiny"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Customer Information */}
        {metadata.customerInfo && (
          <div className="space-y-spacing-sm">
            <label className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={User} className="h-4 w-4" />
              Customer Information
            </label>
            <div className="grid grid-cols-2 gap-ds-2 text-sm">
              {metadata.customerInfo.name && (
                <div>
                  <span className="text-[var(--fl-color-text-muted)]">Name:</span>
                  <span className="ml-1">{metadata.customerInfo.name}</span>
                </div>
              )}
              {metadata.customerInfo.email && (
                <div>
                  <span className="text-[var(--fl-color-text-muted)]">Email:</span>
                  <span className="ml-1">{metadata.customerInfo.email}</span>
                </div>
              )}
              {metadata.customerInfo.tier && (
                <div>
                  <span className="text-[var(--fl-color-text-muted)]">Tier:</span>
                  <Badge variant="outline" className="ml-1 text-tiny">
                    {metadata.customerInfo.tier}
                  </Badge>
                </div>
              )}
              {metadata.customerInfo.company && (
                <div>
                  <span className="text-[var(--fl-color-text-muted)]">Company:</span>
                  <span className="ml-1">{metadata.customerInfo.company}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        <div className="space-y-spacing-sm">
          <label className="text-sm font-medium">Custom Fields</label>
          {Object.entries(editedMetadata.customFields || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm"
            >
              <div className="text-sm">
                <span className="font-medium">{key}:</span>
                <span className="ml-1">{String(value)}</span>
              </div>
              {isEditing && (
                <X
                  className="hover:text-brand-mahogany-500 h-4 w-4 cursor-pointer"
                  onClick={() => removeCustomField(key)}
                />
              )}
            </div>
          ))}

          {isEditing && (
            <div className="flex gap-ds-2">
              <Input
                placeholder="Field name"
                value={newCustomField.key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewCustomField({ ...newCustomField, key: e.target.value })
                }
                className="text-sm"
              />
              <Input
                placeholder="Field value"
                value={newCustomField.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewCustomField({ ...newCustomField, value: e.target.value })
                }
                className="text-sm"
              />
              <Button size="sm" onClick={addCustomField}>
                <Icon icon={Plus} className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-spacing-sm">
          <label className="text-sm font-medium">Notes</label>
          {isEditing ? (
            <Textarea
              placeholder="Add conversation notes..."
              value={editedMetadata.notes || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditedMetadata({ ...editedMetadata, notes: e.target.value })
              }
              className="text-sm"
              rows={3}
            />
          ) : (
            <div className="text-foreground min-h-[60px] rounded bg-[var(--fl-color-background-subtle)] p-spacing-sm text-sm">
              {metadata.notes || "No notes added"}
            </div>
          )}
        </div>

        {/* Context Information */}
        {metadata.context && (
          <div className="space-y-spacing-sm">
            <label className="flex items-center gap-ds-2 text-sm font-medium">
              <Icon icon={MessageSquare} className="h-4 w-4" />
              Context
            </label>
            <div className="space-y-1 text-tiny text-[var(--fl-color-text-muted)]">
              {metadata.context.source && <div>Source: {metadata.context.source}</div>}
              {metadata.context.referrer && <div>Referrer: {metadata.context.referrer}</div>}
              {metadata.context.sessionId && <div>Session: {metadata.context.sessionId}</div>}
            </div>
          </div>
        )}

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-ds-2 border-t pt-2">
            <Button onClick={handleSave} size="sm" className="flex-1" leftIcon={<Icon icon={Save} className="h-4 w-4" />}>
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversationMetadata;
