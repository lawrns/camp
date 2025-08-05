"use client";

// Direct imports to avoid barrel export circular dependency issues
import React, { useState } from "react";
import { format } from "date-fns";
import {
  Warning as AlertTriangleIcon,
  Calendar as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Tag as TagIcon,
  User as UserIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/unified-ui/components/calendar";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/unified-ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Skeleton } from "@/components/unified-ui/components/Skeleton";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface TicketCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  conversation?: {
    id: string;
    customerName: string;
    customerEmail: string;
    subject?: string;
    messages?: unknown[];
  };
  onTicketCreated?: (ticket: unknown) => void;
}

type CreationStep = "details" | "assignment" | "review" | "success";

interface TicketData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent" | "critical";
  category: string;
  assignedTo: string;
  dueDate: Date | undefined;
  tags: string[];
  includeConversationHistory: boolean;
  notifyCustomer: boolean;
  customFields: Record<string, string>;
  attachments: File[];
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
  { value: "critical", label: "Critical", color: "bg-purple-100 text-purple-800" },
];

const CATEGORY_OPTIONS = [
  "Technical Support",
  "Billing & Payments",
  "Feature Request",
  "Bug Report",
  "Account Issues",
  "Integration Help",
  "General Inquiry",
  "Other",
];

export function TicketCreationDialog({
  open,
  onOpenChange,
  organizationId,
  conversation,
  onTicketCreated,
}: TicketCreationDialogProps) {
  const { toast } = useToast();
  const { members, loading: loadingMembers } = useOrganizationMembers(organizationId);
  const [currentStep, setCurrentStep] = useState<CreationStep>("details");
  const [isCreating, setIsCreating] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transform members to operator options
  const operatorOptions = [
    { id: "auto", name: "Auto-assign", availability: "available" as const, workload: "light" as const },
    ...members.map((member: unknown) => ({
      id: member.user_id,
      name: member.profile?.fullName || member.profile?.email || "Unknown",
      availability: member.availability || ("offline" as const),
      workload: member.workload?.status || ("light" as const),
    })),
  ];

  const [ticketData, setTicketData] = useState<TicketData>({
    title: conversation?.subject || `Support ticket for ${conversation?.customerName || "Customer"}`,
    description: "",
    priority: "medium",
    category: "General Inquiry",
    assignedTo: "auto",
    dueDate: undefined,
    tags: [],
    includeConversationHistory: true,
    notifyCustomer: true,
    customFields: {},
    attachments: [],
  });

  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !ticketData.tags.includes(newTag.trim())) {
      setTicketData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTicketData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag: unknown) => tag !== tagToRemove),
    }));
  };

  const handleCreateTicket = async () => {
    setIsCreating(true);

    try {
      // Debug: Log the data being sent
      const requestData = {
        conversationId: conversation?.id,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        assigneeId: ticketData.assignedTo === "auto" ? undefined : ticketData.assignedTo,
        dueDate: ticketData.dueDate?.toISOString(),
        tags: ticketData.tags,
        metadata: {
          category: ticketData.category,
          includeConversationHistory: ticketData.includeConversationHistory,
          notifyCustomer: ticketData.notifyCustomer,
          createdFromInbox: true,
        },
      };



      // FIXED: Use unified tickets API instead of fragmented endpoint
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}: Failed to create ticket`);
      }

      if (result.success && result.ticket) {
        // Ticket created successfully
        setCurrentStep("success");
        setCreatedTicket(result.ticket);

        // Call the onSuccess callback if provided
        if (onTicketCreated) {
          onTicketCreated(result.ticket);
        }
      } else {
        throw new Error(result.error || "Failed to create ticket");
      }
    } catch (error) {

      setError(error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Failed to create ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const resetDialog = () => {
    setCurrentStep("details");
    setCreatedTicket(null);
    setTicketData({
      title: conversation?.subject || `Support ticket for ${conversation?.customerName || "Customer"}`,
      description: "",
      priority: "medium",
      category: "General Inquiry",
      assignedTo: "auto",
      dueDate: undefined,
      tags: [],
      includeConversationHistory: true,
      notifyCustomer: true,
      customFields: {},
      attachments: [],
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetDialog, 300); // Reset after dialog closes
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="space-y-spacing-sm">
        <Label htmlFor="title">Ticket Title</Label>
        <Input
          id="title"
          value={ticketData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTicketData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter ticket title..."
        />
      </div>

      <div className="space-y-spacing-sm">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={ticketData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setTicketData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe the issue or request..."
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-spacing-sm">
          <Label>Priority</Label>
          <Select
            value={ticketData.priority}
            onValueChange={(value: string) => setTicketData((prev) => ({ ...prev, priority: value as unknown }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-ds-2">
                    <Badge className={cn("text-xs", option.color)}>{option.label}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-spacing-sm">
          <Label>Category</Label>
          <Select
            value={ticketData.category}
            onValueChange={(value: string) => setTicketData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((category: unknown) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-spacing-sm">
        <Label>Due Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "text-typography-sm inline-flex w-full cursor-pointer items-center justify-start rounded-ds-md border border-input bg-background px-3 py-2 text-left font-normal hover:bg-accent hover:text-accent-foreground",
                !ticketData.dueDate && "text-muted-foreground"
              )}
            >
              <Icon icon={CalendarIcon} className="mr-2 h-4 w-4" />
              {ticketData.dueDate ? format(ticketData.dueDate, "PPP") : "Select due date"}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={ticketData.dueDate}
              onSelect={(date) => setTicketData((prev) => ({ ...prev, dueDate: date }))}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-spacing-sm">
        <Label>Tags</Label>
        <div className="mb-2 flex flex-wrap gap-ds-2">
          {ticketData.tags.map((tag: unknown) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
              <Icon icon={TagIcon} className="mr-1 h-3 w-3" />
              {tag}
              <span className="ml-1 text-tiny">×</span>
            </Badge>
          ))}
        </div>
        <div className="flex gap-ds-2">
          <Input
            value={newTag}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-spacing-sm">
        <Checkbox
          id="includeHistory"
          checked={ticketData.includeConversationHistory}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTicketData((prev) => ({ ...prev, includeConversationHistory: e.target.checked }))
          }
        />
        <Label htmlFor="includeHistory" className="text-sm">
          Include conversation history in ticket
        </Label>
      </div>
    </div>
  );

  const renderAssignmentStep = () => (
    <div className="space-y-6">
      <div className="space-y-spacing-sm">
        <Label>Assign to Operator</Label>
        <Select
          value={ticketData.assignedTo}
          onValueChange={(value: string) => setTicketData((prev) => ({ ...prev, assignedTo: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {loadingMembers ? (
              <div className="p-spacing-sm">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              operatorOptions.map((operator: unknown) => (
                <SelectItem key={operator.id} value={operator.id}>
                  <div className="flex w-full items-center gap-3">
                    <Icon icon={UserIcon} className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{operator.name}</div>
                      <div className="text-tiny text-muted-foreground">
                        {operator.availability} • {operator.workload} workload
                      </div>
                    </div>
                    <Badge
                      variant={operator.availability === "available" ? "default" : "secondary"}
                      className="text-tiny"
                    >
                      {operator.availability}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
        <h4 className="mb-2 font-medium text-blue-900">Assignment Notes</h4>
        <Textarea placeholder="Add any special instructions or context for the assigned operator..." rows={3} />
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === ticketData.priority);
    const selectedOperator = operatorOptions.find((o) => o.id === ticketData.assignedTo);

    return (
      <div className="space-y-6">
        <div className="space-y-3 rounded-ds-lg bg-slate-50 spacing-3">
          <h4 className="font-medium">Ticket Summary</h4>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Title:</span>
              <p className="text-slate-600">{ticketData.title}</p>
            </div>
            <div>
              <span className="font-medium">Category:</span>
              <p className="text-slate-600">{ticketData.category}</p>
            </div>
            <div>
              <span className="font-medium">Priority:</span>
              <Badge className={cn("text-xs", selectedPriority?.color)}>{selectedPriority?.label}</Badge>
            </div>
            <div>
              <span className="font-medium">Assigned to:</span>
              <p className="text-slate-600">{selectedOperator?.name}</p>
            </div>
            {ticketData.dueDate && (
              <div>
                <span className="font-medium">Due Date:</span>
                <p className="text-slate-600">{format(ticketData.dueDate, "PPP")}</p>
              </div>
            )}
          </div>

          {ticketData.description && (
            <div>
              <span className="font-medium">Description:</span>
              <p className="mt-1 text-sm text-slate-600">{ticketData.description}</p>
            </div>
          )}

          {ticketData.tags.length > 0 && (
            <div>
              <span className="font-medium">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {ticketData.tags.map((tag: unknown) => (
                  <Badge key={tag} variant="secondary" className="text-tiny">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-spacing-sm">
          <Icon icon={AlertTriangleIcon} className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-slate-600">
            This will create a new ticket and {ticketData.includeConversationHistory ? "include" : "exclude"} the
            conversation history.
          </span>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Icon icon={CheckCircleIcon} className="text-semantic-success h-16 w-16" />
      </div>

      <div>
        <h3 className="text-base font-medium">Ticket Created Successfully!</h3>
        <p className="mt-2 text-slate-600">
          Ticket <span className="font-mono font-medium">{createdTicket?.id}</span> has been created and assigned.
        </p>
      </div>

      <div className="rounded-ds-lg bg-[var(--fl-color-success-subtle)] spacing-3">
        <h4 className="mb-2 font-medium text-green-900">Next Steps</h4>
        <ul className="space-y-1 text-sm text-green-800">
          <li>• The assigned operator will be notified</li>
          <li>• Customer will receive a confirmation email</li>
          <li>• You can track progress in the tickets dashboard</li>
        </ul>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case "details":
        return "Ticket Details";
      case "assignment":
        return "Assignment";
      case "review":
        return "Review & Create";
      case "success":
        return "Success";
      default:
        return "Create Ticket";
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "details":
        return ticketData.title.trim() && ticketData.category;
      case "assignment":
        return ticketData.assignedTo;
      case "review":
        return true;
      case "success":
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-background max-h-[90vh] max-w-2xl overflow-y-auto border border-[var(--fl-color-border)] shadow-xl">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {currentStep === "details" && "Fill out the ticket details and requirements."}
            {currentStep === "assignment" && "Choose who should handle this ticket."}
            {currentStep === "review" && "Review all details before creating the ticket."}
            {currentStep === "success" && "Your ticket has been created successfully."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        {currentStep !== "success" && (
          <div className="mb-6 flex items-center gap-ds-2">
            {["details", "assignment", "review"].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    "text-typography-sm flex h-8 w-8 items-center justify-center rounded-ds-full font-medium",
                    currentStep === step
                      ? "bg-brand-blue-500 text-white"
                      : ["details", "assignment", "review"].indexOf(currentStep) > index
                        ? "bg-semantic-success text-white"
                        : "bg-slate-200 text-slate-600"
                  )}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={cn(
                      "h-1 flex-1 rounded",
                      ["details", "assignment", "review"].indexOf(currentStep) > index
                        ? "bg-semantic-success"
                        : "bg-slate-200"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step content */}
        <div className="py-4">
          {currentStep === "details" && renderDetailsStep()}
          {currentStep === "assignment" && renderAssignmentStep()}
          {currentStep === "review" && renderReviewStep()}
          {currentStep === "success" && renderSuccessStep()}
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          {currentStep === "success" ? (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          ) : (
            <>
              <div>
                {currentStep === "assignment" || currentStep === "review" ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const steps = ["details", "assignment", "review"];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex > 0) {
                        setCurrentStep(steps[currentIndex - 1] as CreationStep);
                      }
                    }}
                  >
                    Back
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-ds-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>

                {currentStep === "review" ? (
                  <Button onClick={handleCreateTicket} disabled={isCreating || !canProceed()}>
                    {isCreating ? "Creating..." : "Create Ticket"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const steps = ["details", "assignment", "review"];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex < steps.length - 1) {
                        setCurrentStep(steps[currentIndex + 1] as CreationStep);
                      }
                    }}
                    disabled={!canProceed()}
                  >
                    Next
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
