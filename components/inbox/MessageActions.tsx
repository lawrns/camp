"use client";

import { useState } from "react";
import { 
  ArrowBendUpLeft, 
  Heart, 
  Share, 
  DotsThree, 
  ThumbsUp,
  Copy,
  Trash,
  PencilSimple
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button-unified";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  messageId: string;
  conversationId: string;
  isOwnMessage?: boolean;
  isWidget?: boolean;
  className?: string;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

interface MessageReaction {
  type: string;
  count: number;
  hasReacted: boolean;
}

export function MessageActions({
  messageId,
  conversationId,
  isOwnMessage = false,
  isWidget = false,
  className,
  onReply,
  onEdit,
  onDelete,
  onCopy,
}: MessageActionsProps) {
  const [reactions, setReactions] = useState<MessageReaction[]>([
    { type: "like", count: 0, hasReacted: false },
    { type: "heart", count: 0, hasReacted: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle message reaction
  const handleReaction = async (reactionType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reaction: reactionType,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }

      // Update local state optimistically
      setReactions(prev => 
        prev.map(reaction => 
          reaction.type === reactionType 
            ? { 
                ...reaction, 
                count: reaction.hasReacted ? reaction.count - 1 : reaction.count + 1,
                hasReacted: !reaction.hasReacted 
              }
            : reaction
        )
      );

      toast.success(`Reacted with ${reactionType}`);
    } catch (error) {
      toast.error("Failed to add reaction");
      // Revert optimistic update
      setReactions(prev => 
        prev.map(reaction => 
          reaction.type === reactionType 
            ? { 
                ...reaction, 
                count: reaction.hasReacted ? reaction.count + 1 : reaction.count - 1,
                hasReacted: !reaction.hasReacted 
              }
            : reaction
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message reply
  const handleReply = () => {
    onReply?.(messageId);
  };

  // Handle message copy
  const handleCopy = async () => {
    try {
      // Get message content from DOM or pass it as prop
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      const content = messageElement?.textContent || "";
      
      await navigator.clipboard.writeText(content);
      toast.success("Message copied to clipboard");
      onCopy?.(content);
    } catch (error) {
      toast.error("Failed to copy message");
    }
  };

  // Handle message edit
  const handleEdit = () => {
    onEdit?.(messageId);
  };

  // Handle message delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      toast.success("Message deleted");
      onDelete?.(messageId);
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message share
  const handleShare = async () => {
    try {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      const content = messageElement?.textContent || "";
      
      if (navigator.share) {
        await navigator.share({
          title: "Shared Message",
          text: content,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(content);
        toast.success("Message copied to clipboard");
      }
    } catch (error) {
      toast.error("Failed to share message");
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Quick Reactions */}
      <div className="flex items-center gap-1">
        {/* Like reaction */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction("like")}
          disabled={isLoading}
          className={cn(
            "h-6 w-6 p-0 hover:bg-gray-100",
            reactions.find(r => r.type === "like")?.hasReacted && "text-blue-600 bg-blue-50"
          )}
          title="Like"
        >
          <ThumbsUp className="h-3 w-3" />
          {reactions.find(r => r.type === "like")?.count > 0 && (
            <span className="ml-1 text-xs">
              {reactions.find(r => r.type === "like")?.count}
            </span>
          )}
        </Button>

        {/* Heart reaction */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction("heart")}
          disabled={isLoading}
          className={cn(
            "h-6 w-6 p-0 hover:bg-gray-100",
            reactions.find(r => r.type === "heart")?.hasReacted && "text-red-600 bg-red-50"
          )}
          title="Heart"
        >
          <Heart className="h-3 w-3" />
          {reactions.find(r => r.type === "heart")?.count > 0 && (
            <span className="ml-1 text-xs">
              {reactions.find(r => r.type === "heart")?.count}
            </span>
          )}
        </Button>
      </div>

      {/* Action Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            title="More options"
          >
            <DotsThree className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Reply - available in both inbox and widget */}
          <DropdownMenuItem onClick={handleReply}>
            <ArrowBendUpLeft className="h-4 w-4 mr-2" />
            Reply
          </DropdownMenuItem>

          {/* Copy - available everywhere */}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </DropdownMenuItem>

          {/* Edit - only for own messages */}
          {isOwnMessage && (
            <DropdownMenuItem onClick={handleEdit}>
              <PencilSimple className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Delete - only for own messages */}
          {isOwnMessage && (
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}

          {/* Share - only in inbox, not widget */}
          {!isWidget && (
            <DropdownMenuItem onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 