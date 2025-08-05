"use client";

import React, { useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Archive, ArrowRight, CheckCircle, ChevronDown as ChevronDown, Envelope as Mail, Tag, Trash as Trash2, UserPlus, X, XCircle,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string, data?: unknown) => Promise<void>;
  className?: string;
}

export function BulkActionsBar({ selectedCount, onClearSelection, onBulkAction, className }: BulkActionsBarProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: string, data?: unknown) => {
    setIsProcessing(true);
    try {
      await onBulkAction(action, data);
      toast({
        title: "Success",
        description: `Action completed for ${selectedCount} conversations`,
      });
      onClearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <OptimizedAnimatePresence>
      {selectedCount > 0 && (
        <OptimizedMotion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 transform items-center gap-4 rounded-ds-lg border border-[var(--fl-color-border)] bg-white spacing-4 shadow-xl ${className}`}
        >
          {/* Selection Count */}
          <div className="flex items-center gap-ds-2">
            <Badge variant="secondary" className="text-status-info-dark bg-[var(--fl-color-info-subtle)] rounded-full">
              {selectedCount} selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 w-8 p-0">
              <Icon icon={X} className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* Quick Actions */}
          <div className="flex items-center gap-ds-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("markAsRead")}
              disabled={isProcessing}
              className="gap-ds-2"
            >
              <Icon icon={CheckCircle} className="h-4 w-4" />
              Mark as Read
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction("archive")}
              disabled={isProcessing}
              className="gap-ds-2"
            >
              <Icon icon={Archive} className="h-4 w-4" />
              Archive
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" disabled={isProcessing} className="gap-ds-2">
                  <Icon icon={Tag} className="h-4 w-4" />
                  Add Tag
                  <Icon icon={ChevronDown} className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAction("addTag", { tag: "urgent" })}>
                  <div className="bg-brand-mahogany-500 mr-2 h-2 w-2 rounded-ds-full" />
                  Urgent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("addTag", { tag: "follow-up" })}>
                  <div className="bg-semantic-warning mr-2 h-2 w-2 rounded-ds-full" />
                  Follow Up
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("addTag", { tag: "resolved" })}>
                  <div className="bg-semantic-success mr-2 h-2 w-2 rounded-ds-full" />
                  Resolved
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("addTag", { tag: "custom" })}>
                  Custom Tag...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" disabled={isProcessing} className="gap-ds-2">
                  <Icon icon={UserPlus} className="h-4 w-4" />
                  Assign
                  <Icon icon={ChevronDown} className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAction("assignToMe")}>Assign to Me</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("assignToTeam")}>Assign to Team...</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("unassign")}>Unassign</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-px bg-gray-200" />

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" size="sm" disabled={isProcessing} className="gap-ds-2">
                  More Actions
                  <Icon icon={ChevronDown} className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAction("resolve")}>
                  <Icon icon={CheckCircle} className="mr-2 h-4 w-4" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("close")}>
                  <Icon icon={XCircle} className="mr-2 h-4 w-4" />
                  Close Conversations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("setPriority")}>
                  <Icon icon={ArrowRight} className="mr-2 h-4 w-4" />
                  Set Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("export")}>
                  <Icon icon={Mail} className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction("delete")} className="text-red-600">
                  <Icon icon={Trash2} className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-ds-2 text-sm text-[var(--fl-color-text-muted)]">
              <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-gray-900"></div>
              Processing...
            </div>
          )}
        </OptimizedMotion.div>
      )}
    </OptimizedAnimatePresence>
  );
}
