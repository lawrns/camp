"use client";

import React, { useState } from "react";
import { CheckCircle as Check, FileText, Spinner as Loader2, Sparkle as Sparkles, Tag, X } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
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
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/ui/Icon";

interface ArticleCreationDialogProps {
  conversationId: string;
  selectedMessages?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (articleId: string) => void;
}

export function ArticleCreationDialog({
  conversationId,
  selectedMessages,
  open,
  onOpenChange,
  onSuccess,
}: ArticleCreationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [editedDraft, setEditedDraft] = useState<any>(null);
  const [publish, setPublish] = useState(false);
  const [newTag, setNewTag] = useState("");

  const generateDraft = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/knowledge/articles/create-from-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageIds: selectedMessages,
          publish: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate draft");
      }

      const data = await response.json();
      setDraft(data.draft);
      setEditedDraft(data.draft);

      toast({
        title: "Draft Generated",
        description: "AI has created an article draft from the conversation",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate draft",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/knowledge/articles/create-from-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageIds: selectedMessages,
          publish,
          ...editedDraft,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save article");
      }

      const data = await response.json();

      toast({
        title: publish ? "Article Published" : "Draft Saved",
        description: publish
          ? "The article has been published to the knowledge base"
          : "The article draft has been saved",
      });

      onSuccess?.(data.articleId);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && editedDraft) {
      setEditedDraft({
        ...editedDraft,
        tags: [...editedDraft.tags, newTag.toLowerCase()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    if (editedDraft) {
      setEditedDraft({
        ...editedDraft,
        tags: editedDraft.tags.filter((t: string) => t !== tag),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create Knowledge Base Article</DialogTitle>
          <DialogDescription>Transform this conversation into a helpful knowledge base article</DialogDescription>
        </DialogHeader>

        {!draft ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="space-y-3 text-center">
              <Icon icon={FileText} className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-base font-medium">Generate Article from Conversation</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                AI will analyze the conversation and create a draft article based on the questions and answers
              </p>
              <Button onClick={generateDraft} disabled={generating}>
                {generating ? (
                  <>
                    <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <Icon icon={Sparkles} className="mr-2 h-4 w-4" />
                    Generate Article Draft
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="edit" className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="flex-1 space-y-3 overflow-auto spacing-3">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedDraft.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditedDraft({ ...editedDraft, title: e.target.value })
                      }
                      placeholder="Article title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={editedDraft.summary}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditedDraft({ ...editedDraft, summary: e.target.value })
                      }
                      placeholder="Brief summary of the article"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editedDraft.category}
                      onValueChange={(value: string) => setEditedDraft({ ...editedDraft, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Support">General Support</SelectItem>
                        <SelectItem value="Technical Issues">Technical Issues</SelectItem>
                        <SelectItem value="Account Management">Account Management</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Features">Features</SelectItem>
                        <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="mb-2 flex flex-wrap gap-ds-2">
                      {editedDraft.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          <Icon icon={Tag} className="mr-1 h-3 w-3" />
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-2 hover:text-destructive">
                            <Icon icon={X} className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-ds-2">
                      <Input
                        placeholder="Add tag"
                        value={newTag}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        Add Tag
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Content (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={editedDraft.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditedDraft({ ...editedDraft, content: e.target.value })
                      }
                      placeholder="Article content in markdown format"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Card className="border-status-info-light bg-[var(--fl-color-info-subtle)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-ds-2 text-sm">
                        <Icon icon={Sparkles} className="h-4 w-4" />
                        AI Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence in article quality</span>
                        <span className="text-base font-medium">{Math.round(editedDraft.confidence * 100)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-auto spacing-3">
                <article className="prose prose-sm max-w-none">
                  <h1>{editedDraft.title}</h1>
                  <p className="lead">{editedDraft.summary}</p>
                  <div className="mb-4 flex gap-ds-2">
                    <Badge variant="outline">{editedDraft.category}</Badge>
                    {editedDraft.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <ReactMarkdown>{editedDraft.content}</ReactMarkdown>
                </article>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {draft && (
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-ds-2">
              <Switch id="publish" checked={publish} onCheckedChange={setPublish} />
              <Label htmlFor="publish" className="font-normal">
                Publish immediately
              </Label>
            </div>
            <div className="flex gap-ds-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={saveDraft} disabled={loading}>
                {loading ? (
                  <>
                    <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon={Check} className="mr-2 h-4 w-4" />
                    {publish ? "Publish Article" : "Save Draft"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
