"use client";

import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { TextB as Bold, Code, FileText, TextHOne as Heading1, TextHTwo as Heading2, TextHThree as Heading3, Image, TextItalic as Italic, Link, List, Plus, Quotes as Quote, FloppyDisk as Save, Settings as Settings, Sparkles as Sparkles, X,  } from "lucide-react";
import DOMPurify from "dompurify";
import React, { useRef, useState } from "react";

interface Article {
  id?: string;
  title: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  sourceType: "markdown" | "html" | "text";
  metadata?: {
    author?: string;
    lastModified?: Date;
    version?: number;
  };
}

interface ArticleEditorProps {
  article?: Article;
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article) => void;
  categories: string[];
}

const toolbarButtons = [
  { icon: Bold, action: "bold", tooltip: "Bold" },
  { icon: Italic, action: "italic", tooltip: "Italic" },
  { icon: Heading1, action: "h1", tooltip: "Heading 1" },
  { icon: Heading2, action: "h2", tooltip: "Heading 2" },
  { icon: Heading3, action: "h3", tooltip: "Heading 3" },
  { icon: List, action: "list", tooltip: "Bullet List" },
  { icon: Link, action: "link", tooltip: "Insert Link" },
  { icon: Image, action: "image", tooltip: "Insert Image" },
  { icon: Code, action: "code", tooltip: "Code Block" },
  { icon: Quote, action: "quote", tooltip: "Quote" },
];

export function ArticleEditor({ article, isOpen, onClose, onSave, categories }: ArticleEditorProps) {
  const [formData, setFormData] = useState<Article>({
    title: article?.title || "",
    content: article?.content || "",
    description: article?.description || "",
    category: article?.category || "",
    tags: article?.tags || [],
    status: article?.status || "draft",
    sourceType: article?.sourceType || "markdown",
    metadata: article?.metadata || {},
  });

  const [newTag, setNewTag] = useState("");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (field: keyof Article, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag: unknown) => tag !== tagToRemove),
    }));
  };

  const handleToolbarAction = (action: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = "";

    switch (action) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        break;
      case "h1":
        replacement = `# ${selectedText || "Heading 1"}`;
        break;
      case "h2":
        replacement = `## ${selectedText || "Heading 2"}`;
        break;
      case "h3":
        replacement = `### ${selectedText || "Heading 3"}`;
        break;
      case "list":
        replacement = `- ${selectedText || "List item"}`;
        break;
      case "link":
        replacement = `[${selectedText || "link text"}](url)`;
        break;
      case "image":
        replacement = `![${selectedText || "alt text"}](image-url)`;
        break;
      case "code":
        replacement = selectedText.includes("\n")
          ? `\`\`\`\n${selectedText || "code"}\n\`\`\``
          : `\`${selectedText || "code"}\``;
        break;
      case "quote":
        replacement = `> ${selectedText || "Quote text"}`;
        break;
    }

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    handleInputChange("content", newContent);

    // Set cursor position after replacement
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleGenerateContent = async () => {
    setIsGeneratingContent(true);
    try {
      // Simulate AI content generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiContent = `# ${formData.title}

## Overview
This article provides comprehensive information about ${formData.title.toLowerCase()}.

## Key Points
- Important concept 1
- Important concept 2
- Important concept 3

## Implementation
\`\`\`javascript
// Example code snippet
const example = "Generated content";
// \`\`\`

## Best Practices
> Always follow these guidelines for optimal results.

## Conclusion
This concludes the overview of ${formData.title.toLowerCase()}.`;

      handleInputChange("content", aiContent);
    } catch (error) {
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSave = () => {
    const articleToSave: Article = {
      ...formData,
      id: article?.id || `article-${Date.now()}`,
      metadata: {
        ...formData.metadata,
        lastModified: new Date(),
        version: (formData.metadata?.version || 0) + 1,
      },
    };
    onSave(articleToSave);
    onClose();
  };

  const renderPreview = () => {
    // Simple markdown-to-HTML conversion for preview
    const html = formData.content
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/`([^`]+)`/gim, "<code>$1</code>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/\n/gim, "<br>");

    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-ds-2">
            <Icon icon={FileText} className="h-5 w-5" />
            {article ? "Edit Article" : "Create New Article"}
          </DialogTitle>
          <DialogDescription>Create and edit knowledge base articles with AI assistance</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-3">
            {/* Article Settings */}
            <div className="space-y-3 overflow-y-auto">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-ds-2 text-sm">
                    <Icon icon={Settings} className="h-4 w-4" />
                    Article Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("title", e.target.value)}
                      placeholder="Enter article title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Brief description..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: string) => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: unknown) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) => handleInputChange("status", value as Article["status"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="mt-1 flex gap-ds-2">
                      <Input
                        value={newTag}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                        placeholder="Add tag..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                        <Icon icon={Plus} className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.tags.map((tag: unknown) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-[var(--fl-color-danger-subtle)]"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <Icon icon={X} className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateContent}
                    disabled={isGeneratingContent || !formData.title}
                    className="w-full"
                    variant="outline"
                  >
                    {isGeneratingContent ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-ds-full border-b-2 border-current" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon icon={Sparkles} className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Content Editor */}
            <div className="flex flex-col lg:col-span-2">
              <Tabs
                value={activeTab}
                onValueChange={(value: string) => setActiveTab(value)}
                className="flex flex-1 flex-col"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="mt-4 flex flex-1 flex-col">
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 rounded-t-md border bg-[var(--fl-color-background-subtle)] p-spacing-sm">
                    {toolbarButtons.map(({ icon: Icon, action, tooltip }) => (
                      <Button
                        key={action}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToolbarAction(action)}
                        title={tooltip}
                        className="h-8 w-8 p-0"
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    ref={textareaRef}
                    value={formData.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange("content", e.target.value)
                    }
                    placeholder="Start writing your article content..."
                    className="min-h-[400px] flex-1 resize-none rounded-t-none border-t-0 font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-4 flex-1">
                  <div className="bg-background min-h-[400px] overflow-y-auto rounded-ds-md border spacing-3">
                    {formData.content ? (
                      renderPreview()
                    ) : (
                      <p className="italic text-[var(--fl-color-text-muted)]">No content to preview</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()} leftIcon={<Icon icon={Save} className="h-4 w-4" />}>
            {isGeneratingContent ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
