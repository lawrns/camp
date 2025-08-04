"use client";

import { Button } from "@/components/ui/Button-unified";
import { Badge } from "@/components/unified-ui/components/Badge";
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
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, CheckCircle, Ticket, User, AlertTriangle as Warning } from "lucide-react";
import { useEffect, useState } from "react";
// REMOVED: Old fragmented ticket creation - now using unified API
import { getAvailableAgents } from "@/lib/tickets";
import { Icon } from "@/lib/ui/Icon";

interface ConvertToTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: {
    id: string;
    subject: string;
    customer: {
      name: string;
      email: string;
    };
    messages: Array<{
      content: string;
      sender: string;
      timestamp: string;
    }>;
    priority?: string;
    category?: string;
  };
  onConvert: (ticketData: unknown) => Promise<void>;
}

interface TicketCreationData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  assigneeId?: string;
  dueDate?: string;
  tags: string[];
  includeConversationHistory: boolean;
}

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
];

const categoryOptions = [
  "Technical Support",
  "Billing & Payments",
  "Product Information",
  "Account Management",
  "Bug Report",
  "Feature Request",
  "General Inquiry",
  "Complaint",
];

export function ConvertToTicketDialog({ open, onOpenChange, conversation, onConvert }: ConvertToTicketDialogProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "preview" | "success">("details");
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Get auth context for organization ID
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  // Form state
  const [title, setTitle] = useState(conversation.subject || "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketCreationData["priority"]>("medium");
  const [category, setCategory] = useState(conversation.category || "");
  const [assigneeId, setAssigneeId] = useState<string>("auto-assign");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [includeHistory, setIncludeHistory] = useState(true);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep("details");
      setTitle(conversation.subject || "");
      setDescription("");
      setPriority("medium");
      setCategory(conversation.category || "");
      setAssigneeId("auto-assign");
      setDueDate("");
      setTags([]);
      setNewTag("");
      setIncludeHistory(true);
    }
  }, [open, conversation]);

  // Fetch available agents when category changes (with authentication check)
  useEffect(() => {
    if (category && organizationId && user) {
      // Add a small delay to ensure authentication is ready
      const timer = setTimeout(() => {
        fetchAvailableAgents();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [category, organizationId, user]);

  const fetchAvailableAgents = async (retryCount = 0) => {
    if (!organizationId || !user) return;

    setLoadingAgents(true);
    try {
      const availableAgents = await getAvailableAgents(organizationId, category);
      setAgents(availableAgents);
    } catch (error) {
      // Retry once if it's an authentication error and we haven't retried yet
      if (retryCount === 0 && (error as unknown)?.message?.includes("401")) {
        setTimeout(() => fetchAvailableAgents(1), 500);
        return;
      }

      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag: unknown) => tag !== tagToRemove));
  };

  const handleNext = () => {
    if (step === "details") {
      setStep("preview");
    }
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("details");
    }
  };

  const handleConvert = async () => {
    if (!organizationId || !user) {
      return;
    }

    setLoading(true);
    try {
      const ticketData: unknown = {
        title,
        description,
        priority,
        category,
        tags,
        includeConversationHistory: includeHistory,
        conversationId: conversation.id,
        assigneeId: assigneeId === "auto-assign" ? undefined : assigneeId,
        dueDate: dueDate || undefined,
      };

      // Call the parent's onConvert function which will handle the API call
      await onConvert(ticketData);
      setStep("success");
    } catch (error) {
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorityOptions.find((p) => p.value === priority);
  const selectedAgent = agents.find((a) => a.userId === assigneeId);

  const isFormValid = title.trim() && category && priority;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-ds-2">
            <Icon icon={Ticket} className="h-5 w-5" />
            Convert to Ticket
          </DialogTitle>
          <DialogDescription>
            Convert this conversation into a trackable support ticket with priority, assignment, and due date.
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Customer Information *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-spacing-sm">
                <div className="flex items-center gap-ds-2">
                  <Icon icon={User} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />
                  <span className="font-medium">{conversation.customer.name}</span>
                </div>
                <div className="text-foreground text-sm">{conversation.customer.email}</div>
              </CardContent>
            </Card>

            {/* Ticket Details */}
            <div className="space-y-spacing-md">
              <div className="space-y-spacing-sm">
                <Label htmlFor="title">Ticket Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="e.g., Customer unable to log in to account"
                />
              </div>

              <div className="space-y-spacing-sm">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Provide additional context or details about the issue..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-spacing-sm">
                  <Label>Priority *</Label>
                  <Select value={priority} onValueChange={(value: unknown) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option: unknown) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-ds-2">
                            <Badge className={option.color}>{option.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-spacing-sm">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={(value: string) => setCategory(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat: unknown) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-spacing-sm">
                  <Label>Assign to Agent</Label>
                  <Select value={assigneeId} onValueChange={(value: string) => setAssigneeId(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto-assign">Auto-assign</SelectItem>
                      {loadingAgents ? (
                        <div className="p-spacing-sm text-center text-sm text-[var(--fl-color-text-muted)]">
                          Loading agents...
                        </div>
                      ) : agents.length === 0 ? (
                        <div className="p-spacing-sm text-center text-sm text-[var(--fl-color-text-muted)]">
                          No agents available
                        </div>
                      ) : (
                        agents
                          .filter((agent: unknown) => agent.available)
                          .map((agent: unknown) => (
                            <SelectItem key={agent.userId} value={agent.userId}>
                              <div className="flex items-center gap-ds-2">
                                <div
                                  className={`h-2 w-2 rounded-ds-full ${agent.status === "online"
                                    ? "bg-semantic-success"
                                    : agent.status === "busy"
                                      ? "bg-semantic-warning"
                                      : "bg-neutral-400"
                                    }`}
                                />
                                <span>{agent.name}</span>
                                <span className="text-tiny text-[var(--fl-color-text-muted)]">
                                  ({agent.activeTickets}/{agent.maxCapacity} tickets)
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-spacing-sm">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-spacing-sm">
                <Label>Tags</Label>
                <div className="flex gap-ds-2">
                  <Input
                    value={newTag}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                    placeholder="Enter tag name..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="min-w-[60px]"
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag: unknown) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Include History Option */}
              <div className="flex items-center space-x-spacing-sm">
                <input
                  type="checkbox"
                  id="includeHistory"
                  checked={includeHistory}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeHistory(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="includeHistory" className="cursor-pointer text-sm">
                  Include conversation history in ticket
                </Label>
              </div>
            </div>

            {/* Validation Feedback */}
            {!isFormValid && (
              <div className="rounded-ds-md bg-yellow-50 spacing-3 border border-yellow-200">
                <div className="flex items-center gap-ds-2">
                  <Icon icon={Warning} className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">Please complete required fields:</span>
                </div>
                <ul className="mt-1 ml-6 text-sm text-yellow-700 list-disc">
                  {!title.trim() && <li>Ticket title is required</li>}
                  {!category && <li>Category is required</li>}
                  {!priority && <li>Priority is required</li>}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-base font-semibold">Review Ticket Details</h3>
              <p className="text-foreground text-sm">Please review the ticket information before creating</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{title}</span>
                  {selectedPriority && <Badge className={selectedPriority.color}>{selectedPriority.label}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Category:</span> {category}
                  </div>
                  <div>
                    <span className="font-medium">Assignee:</span> {selectedAgent?.name || "Auto-assign"}
                  </div>
                  {dueDate && (
                    <div>
                      <span className="font-medium">Due Date:</span> {new Date(dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Customer:</span> {conversation.customer.name}
                  </div>
                </div>

                {description && (
                  <div>
                    <span className="text-sm font-medium">Description:</span>
                    <p className="text-foreground mt-1 text-sm">{description}</p>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map((tag: unknown) => (
                        <Badge key={tag} variant="secondary" className="text-tiny">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {includeHistory && (
                  <div className="text-foreground text-sm">✓ Conversation history will be included</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-3 py-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-success-subtle)]">
              <Icon icon={CheckCircle} className="text-semantic-success-dark h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Ticket Created Successfully!</h3>
              <p className="text-foreground mt-1 text-sm">
                The conversation has been converted to a ticket and assigned to the appropriate agent.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "details" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleNext} disabled={!isFormValid}>
                Next
                <Icon icon={ArrowRight} className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleConvert} disabled={loading}>
                {loading ? "Creating..." : "Create Ticket"}
                <Icon icon={Ticket} className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "success" && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
