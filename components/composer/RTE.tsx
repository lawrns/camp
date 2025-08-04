"use client";

import { useEffect } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextB as Bold, Code, TextItalic as Italic, List, ListNumbers as ListOrdered } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface RTEProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export function RTE({
  value,
  onChange,
  placeholder = "Type your message...",
  disabled = false,
  className,
  onKeyDown,
}: RTEProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "max-h-[200px] min-h-[80px] overflow-y-auto px-3 py-2",
          "text-typography-sm text-neutral-900",
          className
        ),
      },
      handleKeyDown: (view, event) => {
        // Pass through to parent handler
        if (onKeyDown && event.key === "Enter" && !event.shiftKey) {
          const keyboardEvent = new KeyboardEvent("keydown", {
            key: event.key,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
          });
          onKeyDown(keyboardEvent as unknown);
          return true; // Prevent default
        }
        return false;
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-7 w-7 p-0", active && "bg-neutral-100 text-neutral-900")}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-[var(--fl-color-border-subtle)] bg-[var(--fl-color-background-subtle)] px-2 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Cmd+B)"
        >
          <Icon icon={Bold} className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Cmd+I)"
        >
          <Icon icon={Italic} className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Code (Cmd+E)"
        >
          <Icon icon={Code} className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <Icon icon={List} className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <Icon icon={ListOrdered} className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
