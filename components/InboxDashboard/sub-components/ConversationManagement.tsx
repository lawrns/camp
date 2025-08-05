// Professional Conversation Management Component
// Provides tagging, priority, status, notes, and history management

import { useState, useEffect } from 'react';
import { Tag, Flag, Clock, User, Download, Plus, X, Check } from "lucide-react";
import type { Conversation } from '../types';

interface ConversationManagementProps {
  conversation: Conversation;
  onUpdate: (updates: Partial<Conversation>) => void;
  className?: string;
}

interface ConversationTag {
  id: string;
  name: string;
  color: string;
}

interface ConversationNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-800' }
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'waiting', label: 'Waiting', color: 'bg-blue-100 text-blue-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-gray-100 text-gray-700' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-200 text-gray-800' }
];

export const ConversationManagement: React.FC<ConversationManagementProps> = ({
  conversation,
  onUpdate,
  className = ''
}) => {
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversation tags and notes
  useEffect(() => {
    loadConversationData();
  }, [conversation.id]);

  const loadConversationData = async () => {
    try {
      // Load tags
      const tagsResponse = await fetch(`/api/conversations/${conversation.id}/tags`);
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData.tags || []);
      }

      // Load notes (if implemented)
      // const notesResponse = await fetch(`/api/conversations/${conversation.id}/notes`);
      // if (notesResponse.ok) {
      //   const notesData = await notesResponse.json();
      //   setNotes(notesData.notes || []);
      // }
    } catch (error) {
      console.error('Failed to load conversation data:', error);
    }
  };

  const updatePriority = async (priority: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/priority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });

      if (response.ok) {
        onUpdate({ priority });
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        onUpdate({ status });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: newTag.trim() })
      });

      if (response.ok) {
        await loadConversationData();
        setNewTag('');
        setIsAddingTag(false);
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeTag = async (tagName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: tagName })
      });

      if (response.ok) {
        await loadConversationData();
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportHistory = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversation.id}-history.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  };

  const currentPriority = PRIORITY_OPTIONS.find(p => p.value === conversation.priority) || PRIORITY_OPTIONS[1];
  const currentStatus = STATUS_OPTIONS.find(s => s.value === conversation.status) || STATUS_OPTIONS[0];

  return (
    <div className={`conversation-management bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] rounded-lg p-4 space-y-4 ${className}`}>
      {/* Priority Management */}
      <div className="space-y-2">
        <label className="typography-section-title flex items-center gap-2">
          <Flag className="h-4 w-4" />
          Priority
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority.value}
              onClick={() => updatePriority(priority.value)}
              disabled={isLoading}
              className={`btn-ghost px-3 py-1 text-xs rounded-full transition-all ${
                conversation.priority === priority.value 
                  ? priority.color 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Management */}
      <div className="space-y-2">
        <label className="typography-section-title flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => updateStatus(status.value)}
              disabled={isLoading}
              className={`btn-ghost px-3 py-1 text-xs rounded-full transition-all ${
                conversation.status === status.value 
                  ? status.color 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Management */}
      <div className="space-y-2">
        <label className="typography-section-title flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id || tag.name}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag.name}
              <button
                onClick={() => removeTag(tag.name)}
                disabled={isLoading}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {isAddingTag ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Tag name"
                className="typography-input px-2 py-1 text-xs border rounded"
                autoFocus
              />
              <button onClick={addTag} disabled={isLoading} className="btn-ghost p-1">
                <Check className="h-3 w-3" />
              </button>
              <button onClick={() => setIsAddingTag(false)} className="btn-ghost p-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="btn-ghost px-2 py-1 text-xs rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[var(--ds-color-border)]">
        <button
          onClick={exportHistory}
          className="btn-secondary text-xs"
        >
          <Download className="h-3 w-3" />
          Export History
        </button>
      </div>
    </div>
  );
};
