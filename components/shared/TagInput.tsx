// components/shared/TagInput.tsx
import { useEffect, useRef, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Hash, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagInputProps {
  tags: Tag[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tagId: string) => void;
  suggestions?: Tag[];
  placeholder?: string;
  className?: string;
}

export function TagInput({
  tags,
  onAddTag,
  onRemoveTag,
  suggestions = [],
  placeholder = "Add tag",
  className,
}: TagInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => s.name.toLowerCase().includes(inputValue.toLowerCase()) && !tags.find((t) => t.id === s.id)
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue("");
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Auto-show suggestions when typing #
  useEffect(() => {
    if (inputValue.startsWith("#")) {
      setShowSuggestions(true);
    }
  }, [inputValue]);

  return (
    <div className={cn("relative", className)}>
      {/* Tag Pills */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        <OptimizedAnimatePresence>
          {tags.map((tag: unknown) => (
            <OptimizedMotion.span
              key={tag.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "text-typography-xs inline-flex items-center gap-1 rounded-ds-full py-1 pl-2 pr-1 font-medium",
                "bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200",
                tag.color && `bg-${tag.color}-100 text-${tag.color}-700`
              )}
            >
              <Hash className="h-3 w-3 opacity-50" />
              {tag.name}
              <button
                onClick={() => onRemoveTag(tag.id)}
                className="ml-1 rounded-ds-full p-0.5 transition-colors hover:bg-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </OptimizedMotion.span>
          ))}
        </OptimizedAnimatePresence>

        {/* Add Tag Button */}
        <button
          onClick={() => {
            setIsTyping(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "text-typography-xs inline-flex items-center gap-1 rounded-ds-full px-2 py-1",
            "border border-dashed border-[var(--fl-color-border-strong)] text-neutral-500",
            "transition-all hover:border-neutral-400 hover:text-neutral-600",
            isTyping && "hidden"
          )}
        >
          <Hash className="h-3 w-3" />
          {placeholder}
        </button>
      </div>

      {/* Inline Input */}
      {isTyping && (
        <div className="relative inline-block">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!inputValue) {
                setIsTyping(false);
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (inputValue.startsWith("#") || filteredSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Type tag name..."
            className="border-ds-border-strong rounded-ds-md border px-2 py-1 text-tiny focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />

          {/* Suggestions Dropdown */}
          <OptimizedAnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <OptimizedMotion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-background absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] shadow-card-deep"
              >
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredSuggestions.map((suggestion: unknown) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        onAddTag(suggestion.name);
                        setInputValue("");
                        setIsTyping(false);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center gap-ds-2 px-3 py-2 text-left text-sm hover:bg-[var(--fl-color-background-subtle)]"
                    >
                      <Hash className="h-3 w-3 text-gray-400" />
                      <span>{suggestion.name}</span>
                      {suggestion.color && (
                        <span className={cn("ml-auto h-2 w-2 rounded-ds-full", `bg-${suggestion.color}-500`)} />
                      )}
                    </button>
                  ))}
                </div>
              </OptimizedMotion.div>
            )}
          </OptimizedAnimatePresence>
        </div>
      )}
    </div>
  );
}

// Companion component for message composer integration
export function MessageComposerTags({ className }: { className?: string }) {
  const [tags, setTags] = useState<Tag[]>([]);

  const tagSuggestions: Tag[] = [
    { id: "1", name: "sales", color: "blue" },
    { id: "2", name: "support", color: "green" },
    { id: "3", name: "billing", color: "yellow" },
    { id: "4", name: "feature-request", color: "purple" },
    { id: "5", name: "bug", color: "red" },
    { id: "6", name: "urgent", color: "pink" },
  ];

  return (
    <div className={cn("border-t border-[var(--fl-color-border)] pt-2", className)}>
      <div className="flex items-center justify-between">
        <div className="text-tiny text-[var(--fl-color-text-muted)]">Tag as</div>
        <TagInput
          tags={tags}
          onAddTag={(tagName) => {
            const existing = tagSuggestions.find((s) => s.name === tagName);
            const newTag = existing || {
              id: Date.now().toString(),
              name: tagName,
              color: "gray",
            };
            setTags([...tags, newTag]);
          }}
          onRemoveTag={(tagId) => {
            setTags(tags.filter((t: unknown) => t.id !== tagId));
          }}
          suggestions={tagSuggestions}
          className="ml-2 flex-1"
        />
      </div>
    </div>
  );
}

// Export types for use in other components
export type { Tag };
