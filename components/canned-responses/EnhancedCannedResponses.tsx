"use client";

import React, { useState, useRef, useEffect } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import { VariablePicker } from "./VariablePicker";
import {
  substituteVariables,
  validateTemplate,
  extractVariables,
  type VariableContext,
} from "@/lib/cannedResponses/variableSubstitution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/unified-ui/components/Input";
import { Textarea } from "@/components/unified-ui/components/Textarea";
import { Badge } from "@/components/unified-ui/components/Badge";
import { MessageSquare, Search, Plus, Edit2, Trash2, Star, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedCannedResponsesProps {
  onSelect: (content: string) => void;
  variableContext: VariableContext;
  className?: string;
}

export function EnhancedCannedResponses({ onSelect, variableContext, className }: EnhancedCannedResponsesProps) {
  const { responses, loading, error, refetch, createResponse, updateResponse, deleteResponse } = useCannedResponses();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    shortcut: "",
  });
  const [templateErrors, setTemplateErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter responses based on search and category
  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.shortcut?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || response.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(responses.map((r) => r.category)));

  // Handle response selection with variable substitution
  const handleSelectResponse = (response: (typeof responses)[0]) => {
    const { text, unresolvedVariables } = substituteVariables(response.content, variableContext);

    onSelect(text);

    // Show notification if there are unresolved variables
    if (unresolvedVariables.length > 0) {
      // You might want to show a toast notification here

    }
  };

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = formData.content;

    const newText = text.substring(0, start) + variable + text.substring(end);
    setFormData({ ...formData, content: newText });

    // Set cursor position after inserted variable
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + variable.length;
        textareaRef.current.selectionEnd = start + variable.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Validate template on content change
  useEffect(() => {
    if (formData.content) {
      const validation = validateTemplate(formData.content);
      setTemplateErrors(validation.errors);
    } else {
      setTemplateErrors([]);
    }
  }, [formData.content]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.title || !formData.content) return;

    try {
      if (editingId) {
        await updateResponse(editingId, formData);
      } else {
        await createResponse(formData);
      }

      // Reset form
      setFormData({ title: "", content: "", category: "general", shortcut: "" });
      setIsCreating(false);
      setEditingId(null);
    } catch (error) {

    }
  };

  // Preview with variable substitution
  const PreviewContent = ({ content }: { content: string }) => {
    const { text, unresolvedVariables } = substituteVariables(content, variableContext);
    const variables = extractVariables(content);

    return (
      <div className="space-y-spacing-sm">
        <p className="text-foreground whitespace-pre-wrap text-sm">{text}</p>
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {variables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className={cn(
                  "text-xs",
                  unresolvedVariables.includes(variable)
                    ? "border-[var(--fl-color-danger-muted)] text-red-600"
                    : "border-[var(--fl-color-success-muted)] text-green-600"
                )}
              >
                {variable}
                {unresolvedVariables.includes(variable) ? (
                  <AlertCircle className="ml-1 h-3 w-3" />
                ) : (
                  <Check className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center spacing-8", className)}>
        <OptimizedMotion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="border-ds-border-strong h-8 w-8 rounded-ds-full border-2 border-t-blue-500"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="border-b spacing-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-ds-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5" />
            Canned Responses
          </h2>
          <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center gap-ds-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-ds-2">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      <OptimizedAnimatePresence>
        {(isCreating || editingId) && (
          <OptimizedMotion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b bg-[var(--fl-color-background-subtle)] spacing-3"
          >
            <div className="space-y-3">
              <Input
                placeholder="Response title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <div className="space-y-spacing-sm">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content</label>
                  <VariablePicker onVariableSelect={insertVariable} />
                </div>
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your response here... Use {variableName} for dynamic content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className={cn(templateErrors.length > 0 && "border-[var(--fl-color-danger)] focus:ring-red-500")}
                />
                {templateErrors.length > 0 && (
                  <div className="space-y-1">
                    {templateErrors.map((error, index) => (
                      <p key={index} className="text-tiny text-[var(--fl-color-danger)]">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Category (e.g., greeting)"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
                <Input
                  placeholder="Shortcut (e.g., /hello)"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                />
              </div>

              {formData.content && (
                <div className="bg-background rounded-ds-md border spacing-3">
                  <p className="mb-2 text-tiny font-medium text-[var(--fl-color-text-muted)]">Preview:</p>
                  <PreviewContent content={formData.content} />
                </div>
              )}

              <div className="flex justify-end gap-ds-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                    setFormData({ title: "", content: "", category: "general", shortcut: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!formData.title || !formData.content || templateErrors.length > 0}
                >
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>

      {/* Responses List */}
      <div className="flex-1 overflow-y-auto spacing-3">
        {filteredResponses.length > 0 ? (
          <div className="space-y-spacing-sm">
            {filteredResponses.map((response) => (
              <OptimizedMotion.div
                key={response.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-ds-lg border spacing-3 transition-colors hover:bg-[var(--fl-color-background-subtle)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-ds-2">
                      <h3 className="font-medium">{response.title}</h3>
                      {response.shortcut && (
                        <Badge variant="secondary" className="text-tiny">
                          {response.shortcut}
                        </Badge>
                      )}
                      {response.is_favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    </div>
                    <PreviewContent content={response.content} />
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(response.id);
                        setFormData({
                          title: response.title,
                          content: response.content,
                          category: response.category,
                          shortcut: response.shortcut || "",
                        });
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteResponse(response.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSelectResponse(response)}>
                      Use
                    </Button>
                  </div>
                </div>
              </OptimizedMotion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-[var(--fl-color-text-muted)]">
              {searchQuery ? "No responses found" : "No canned responses yet"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreating(true)}>
              Create your first response
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
