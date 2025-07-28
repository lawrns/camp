// CustomerSidebar component with accordion-based design

import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, Envelope, Flag, MapPin, Phone, Star, Tag } from "@phosphor-icons/react";
import * as React from "react";
import { useState } from "react";
import { useAddCustomerNote, useCustomerData } from "../hooks/useCustomerData";
import type { Conversation } from "../types";

interface CustomerSidebarProps {
  conversation: Conversation;
  onClose: () => void;
}

/**
 * Customer details sidebar component
 */
export const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ conversation, onClose }) => {
  // Get auth context for organization ID
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  // State for adding new notes
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Accordion state management
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["customer-details", "ai-drawer"]) // Default expanded sections
  );

  // Toggle accordion section
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Fetch real customer data from Supabase
  const { customerData, isLoading, error, refetch } = useCustomerData(organizationId, conversation.customer_email);

  // Hook for adding notes
  const { addNote, isAdding } = useAddCustomerNote();

  // Handle adding new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !organizationId || !user?.email) return;

    try {
      await addNote(organizationId, conversation.customer_email, newNote.trim(), user.email);
      setNewNote("");
      setIsAddingNote(false);
      refetch(); // Refresh customer data
    } catch (error) {

    }
  };

  // Format date with error handling
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Unknown date";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {

      return "Unknown date";
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Accordion Section Component
  const AccordionSection: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }> = ({ id, title, icon, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border-b border-[var(--fl-color-border)]" data-testid={`customer-sidebar-section-${id}`}>
        <button
          onClick={() => toggleSection(id)}
          className="flex w-full items-center justify-between p-spacing-md text-left transition-colors hover:bg-background"
          data-testid={`customer-sidebar-section-${id}-toggle`}
        >
          <div className="flex items-center space-x-3" data-testid={`customer-sidebar-section-${id}-header`}>
            <div data-testid={`customer-sidebar-section-${id}-icon`}>{icon}</div>
            <span className="text-sm font-medium text-gray-900" data-testid={`customer-sidebar-section-${id}-title`}>{title}</span>
          </div>
          <div className={`transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} data-testid={`customer-sidebar-section-${id}-chevron`}>
            <svg
              className="h-4 w-4 text-foreground-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              data-testid={`customer-sidebar-section-${id}-chevron-icon`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {isExpanded && <div className="px-4 pb-4 pt-2" data-testid={`customer-sidebar-section-${id}-content`}>{children}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-full w-96 flex-col border-l border-ds-border bg-background" data-testid="customer-sidebar">
      {/* Header with proper spacing */}
      <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] px-6 py-4" data-testid="customer-sidebar-header">
        <h2 className="text-base font-semibold text-gray-900" data-testid="customer-sidebar-title">Customer Details</h2>
        <button
          onClick={onClose}
          className="rounded-ds-lg p-spacing-sm text-gray-400 hover:bg-background hover:text-foreground transition-colors"
          aria-label="Close sidebar"
          data-testid="customer-sidebar-close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid="customer-sidebar-close-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" data-testid="customer-sidebar-content">
        {isLoading ? (
          <div className="space-y-3 p-spacing-md" data-testid="customer-sidebar-loading">
            <div className="animate-pulse" data-testid="customer-sidebar-loading-skeleton">
              <div className="mx-auto mb-3 h-20 w-20 rounded-ds-full bg-gray-200" data-testid="customer-sidebar-loading-avatar"></div>
              <div className="mx-auto mb-2 h-4 w-3/4 rounded bg-gray-200" data-testid="customer-sidebar-loading-name"></div>
              <div className="mx-auto h-3 w-1/2 rounded bg-gray-200" data-testid="customer-sidebar-loading-email"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-spacing-md text-center" data-testid="customer-sidebar-error">
            <p className="text-sm text-red-600" data-testid="customer-sidebar-error-message">Failed to load customer data</p>
            <button onClick={refetch} className="mt-2 text-sm text-blue-600 hover:underline" data-testid="customer-sidebar-error-retry">
              Try again
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100" data-testid="customer-sidebar-sections">
            {/* Customer Details Section */}
            <AccordionSection
              id="customer-details"
              title="Customer Information"
              icon={
                <svg
                  className="h-4 w-4 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            >
              <div className="space-y-3" data-testid="customer-details-content">
                {/* Customer Avatar and Basic Info */}
                <div className="text-center" data-testid="customer-basic-info">
                  <img
                    src={
                      customerData?.avatar ||
                      (() => {
                        const { getAvatarPath } = require("@/lib/utils/avatar");
                        return getAvatarPath(conversation.customer_email || conversation.customer_name, "customer");
                      })()
                    }
                    alt={customerData?.name || conversation.customer_name}
                    className="mx-auto mb-3 h-16 w-16 rounded-ds-full"
                    data-testid="customer-avatar"
                  />
                  <h3 className="text-base font-semibold text-gray-900" data-testid="customer-name">
                    {customerData?.name || conversation.customer_name}
                  </h3>
                  <p className="text-foreground text-sm" data-testid="customer-email">{customerData?.email || conversation.customer_email}</p>
                </div>

                {/* Contact Information */}
                <div className="space-y-3" data-testid="customer-contact-info">
                  <div className="flex items-center space-x-3" data-testid="customer-email-row">
                    <Envelope className="h-4 w-4 text-gray-400" data-testid="customer-email-icon" />
                    <span className="text-sm text-gray-900" data-testid="customer-email-text">
                      {customerData?.email || conversation.customer_email}
                    </span>
                  </div>
                  {customerData?.phone && (
                    <div className="flex items-center space-x-3" data-testid="customer-phone-row">
                      <Phone className="h-4 w-4 text-gray-400" data-testid="customer-phone-icon" />
                      <span className="text-sm text-gray-900" data-testid="customer-phone-text">{customerData.phone}</span>
                    </div>
                  )}
                  {customerData?.location && (
                    <div className="flex items-center space-x-3" data-testid="customer-location-row">
                      <MapPin className="h-4 w-4 text-gray-400" data-testid="customer-location-icon" />
                      <span className="text-sm text-gray-900" data-testid="customer-location-text">{customerData.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3" data-testid="customer-joined-row">
                    <Calendar className="h-4 w-4 text-gray-400" data-testid="customer-joined-icon" />
                    <span className="text-sm text-gray-900" data-testid="customer-joined-text">
                      Joined {formatDate(customerData?.joinDate || conversation.last_message_at)}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* AI Drawer Section */}
            <AccordionSection
              id="ai-drawer"
              title="AI Assistant"
              icon={
                <svg
                  className="h-4 w-4 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              <div className="space-y-3" data-testid="ai-drawer-content">
                {/* AI Status */}
                <div className="flex items-center justify-between" data-testid="ai-status-section">
                  <span className="text-foreground text-sm" data-testid="ai-status-label">AI Assistant Status</span>
                  <span
                    className={`inline-flex items-center rounded-ds-full px-2 py-1 text-xs font-medium ${conversation.assigned_to_ai ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                      }`}
                    data-testid="ai-status-badge"
                  >
                    {conversation.assigned_to_ai ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* AI Suggestions Placeholder */}
                <div className="rounded-ds-lg border border-[var(--fl-color-info-muted)] bg-[var(--fl-color-info-subtle)] spacing-3" data-testid="ai-suggestions-section">
                  <h5 className="mb-2 text-sm font-medium text-blue-900" data-testid="ai-suggestions-title">AI Suggestions</h5>
                  <p className="text-tiny text-blue-700" data-testid="ai-suggestions-placeholder">
                    AI-powered response suggestions and customer insights will appear here.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="space-y-spacing-sm" data-testid="ai-quick-actions">
                  <h5 className="text-sm font-medium text-gray-900" data-testid="ai-quick-actions-title">Quick Actions</h5>
                  <div className="grid grid-cols-2 gap-ds-2" data-testid="ai-quick-actions-grid">
                    <button className="bg-background text-foreground rounded px-2 py-1 text-tiny transition-colors hover:bg-gray-200" data-testid="ai-generate-response-button">
                      Generate Response
                    </button>
                    <button className="bg-background text-foreground rounded px-2 py-1 text-tiny transition-colors hover:bg-gray-200" data-testid="ai-summarize-chat-button">
                      Summarize Chat
                    </button>
                  </div>
                </div>
              </div>
            </AccordionSection>

            {/* Tags Section */}
            {conversation.tags && conversation.tags.length > 0 && (
              <AccordionSection
                id="tags"
                title="Tags"
                icon={<Tag className="h-4 w-4 text-foreground-muted" />}
              >
                <div className="flex flex-wrap gap-ds-2" data-testid="tags-content">
                  {conversation.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-background inline-flex items-center rounded-ds-full px-2 py-1 text-tiny font-medium text-gray-800"
                      data-testid={`tag-${index}`}
                    >
                      <Tag className="mr-1 h-3 w-3" data-testid={`tag-${index}-icon`} />
                      <span data-testid={`tag-${index}-text`}>{tag}</span>
                    </span>
                  ))}
                </div>
              </AccordionSection>
            )}

            {/* Notes Section */}
            <AccordionSection
              id="notes"
              title="Notes"
              icon={
                <svg
                  className="h-4 w-4 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            >
              <div className="space-y-3" data-testid="notes-content">
                {customerData?.notes && customerData.notes.length > 0 ? (
                  customerData.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-ds-lg border border-[var(--fl-color-warning-muted)] bg-[var(--fl-color-warning-subtle)] spacing-3"
                      data-testid={`note-${note.id}`}
                    >
                      <p className="mb-2 text-sm text-gray-900" data-testid={`note-${note.id}-content`}>{note.content}</p>
                      <div className="flex items-center space-x-spacing-sm text-tiny text-foreground" data-testid={`note-${note.id}-meta`}>
                        <Clock className="h-3 w-3" data-testid={`note-${note.id}-clock-icon`} />
                        <span data-testid={`note-${note.id}-date`}>{formatDate(note.createdAt)}</span>
                        <span>•</span>
                        <span data-testid={`note-${note.id}-author`}>{note.createdBy}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-foreground" data-testid="notes-empty-state">No notes yet</p>
                )}

                {/* Add note form */}
                {isAddingNote ? (
                  <div className="space-y-spacing-sm" data-testid="add-note-form">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this customer..."
                      className="border-ds-border-strong w-full resize-none rounded-ds-lg border p-spacing-sm text-sm"
                      rows={3}
                      data-testid="add-note-textarea"
                    />
                    <div className="flex space-x-spacing-sm" data-testid="add-note-actions">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || isAdding}
                        className="bg-primary rounded px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        data-testid="add-note-submit-button"
                      >
                        {isAdding ? "Adding..." : "Add Note"}
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNote("");
                        }}
                        className="border-ds-border-strong text-foreground rounded border px-3 py-1 text-sm hover:bg-[var(--fl-color-background-subtle)]"
                        data-testid="add-note-cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="w-full rounded-ds-lg border-2 border-dashed border-ds-border-strong p-spacing-sm text-left text-sm text-foreground transition-colors hover:border-gray-400 hover:text-gray-800"
                    data-testid="add-note-trigger-button"
                  >
                    + Add a note
                  </button>
                )}
              </div>
            </AccordionSection>

            {/* Last Seen Section */}
            <AccordionSection
              id="last-seen"
              title="Activity & Engagement"
              icon={<Clock className="h-4 w-4 text-foreground-muted" />}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm">Total Conversations</span>
                  <span className="text-sm font-medium text-gray-900">{customerData?.totalConversations || 0}</span>
                </div>
                {customerData?.averageRating && customerData.averageRating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {customerData.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm">Last Activity</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(conversation.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm">Status</span>
                  <span
                    className={`inline-flex items-center rounded-ds-full px-2 py-1 text-xs font-medium ${conversation.status === "open"
                        ? "bg-green-100 text-green-800"
                        : conversation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : conversation.status === "resolved"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                      }`}
                  >
                    {conversation.status}
                  </span>
                </div>
                {conversation.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm">Priority</span>
                    <span
                      className={`inline-flex items-center rounded-ds-full px-2 py-1 text-xs font-medium ${getPriorityColor(conversation.priority)}`}
                    >
                      <Flag className="mr-1 h-3 w-3" />
                      {conversation.priority}
                    </span>
                  </div>
                )}
              </div>
            </AccordionSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSidebar;
