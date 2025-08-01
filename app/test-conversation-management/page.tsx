'use client';

import { useState } from 'react';
import { AssignmentPanel } from '@/components/conversations/AssignmentPanel';
import { PriorityManagement } from '@/components/conversations/PriorityManagement';
import { ConversationStatusDropdown } from '@/components/inbox/ConversationStatusDropdown';
import { ConversationMetadata } from '@/components/conversations/ConversationMetadata';
import { ConvertToTicketDialog } from '@/components/conversations/ConvertToTicketDialog';

export default function TestConversationManagement() {
  const [currentPriority, setCurrentPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [currentStatus, setCurrentStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [assignedAgent, setAssignedAgent] = useState<string>('');

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Conversation Management Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignment Panel */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Assignment Panel</h2>
          <AssignmentPanel
            conversationId="test-conversation-123"
            currentAgentId={assignedAgent}
            organizationId="test-org-123"
            onAssignmentChange={(agentId) => {
              setAssignedAgent(agentId);
              console.log('Assignment changed to:', agentId);
            }}
          />
        </div>

        {/* Priority Management */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Priority Management</h2>
          <PriorityManagement
            conversationId="test-conversation-123"
            currentPriority={currentPriority}
            onPriorityChange={(priority, reason) => {
              setCurrentPriority(priority);
              console.log('Priority changed to:', priority, 'Reason:', reason);
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Status Management</h2>
          <ConversationStatusDropdown
            currentStatus={currentStatus}
            conversationId="test-conversation-123"
            onStatusChange={(status, reason) => {
              setCurrentStatus(status);
              console.log('Status changed to:', status, 'Reason:', reason);
            }}
          />
        </div>

        {/* Conversation Metadata */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Tags & Notes</h2>
          <ConversationMetadata
            conversationId="test-conversation-123"
            metadata={{
              tags: ['urgent', 'vip'],
              notes: 'Test note for conversation',
              customerInfo: {
                name: 'Test Customer',
                email: 'test@example.com'
              }
            }}
            onMetadataUpdate={(metadata) => {
              console.log('Metadata updated:', metadata);
            }}
          />
        </div>

        {/* Convert to Ticket */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Convert to Ticket</h2>
          <ConvertToTicketDialog
            conversationId="test-conversation-123"
            conversationData={{
              id: 'test-conversation-123',
              customerId: 'test-customer-123',
              customerName: 'Test Customer',
              customerEmail: 'test@example.com',
              subject: 'Test Conversation',
              status: 'open',
              priority: 'medium',
              channel: 'chat',
              lastMessage: 'Test message',
              lastMessageAt: new Date(),
              unreadCount: 0,
              tags: ['urgent'],
              sentiment: 'neutral'
            }}
            onConvert={(ticketData) => {
              console.log('Conversation converted to ticket:', ticketData);
            }}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Current State:</h3>
        <pre className="text-sm">
          {JSON.stringify({
            priority: currentPriority,
            status: currentStatus,
            assignedAgent: assignedAgent || 'None'
          }, null, 2)}
        </pre>
 