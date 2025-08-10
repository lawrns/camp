/**
 * Enhanced Customer Details Component - Extracted from InboxDashboard for performance
 * Provides customer information and interaction history
 */

import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Phone, MapPin, Calendar, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CustomerDetailsProps {
  selectedConversation: any;
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedCustomerDetails = React.memo(({ 
  selectedConversation, 
  isOpen, 
  onClose 
}: CustomerDetailsProps) => {
  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 }
  };

  if (!selectedConversation) return null;

  const customerInfo = {
    name: selectedConversation.customerName || 'Unknown Customer',
    email: selectedConversation.customerEmail || '',
    phone: selectedConversation.customerPhone || '',
    location: selectedConversation.customerLocation || '',
    joinDate: selectedConversation.customerJoinDate || new Date(),
    tags: selectedConversation.customerTags || [],
    totalConversations: selectedConversation.customerTotalConversations || 1,
    lastSeen: selectedConversation.customerLastSeen || new Date(),
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div
      className="w-80 bg-card border-l border-border flex flex-col h-full"
      variants={sidebarVariants}
      animate={isOpen ? 'open' : 'closed'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      initial={false}
      data-testid="customer-details"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Customer Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer Profile */}
      <div className="p-4 border-b border-border">
        <motion.div
          className="text-center"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-medium text-primary">
              {customerInfo.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h4 className="font-semibold text-foreground mb-1" data-testid="customer-name">
            {customerInfo.name}
          </h4>
          <p className="text-sm text-muted-foreground" data-testid="customer-email">
            {customerInfo.email}
          </p>
          {selectedConversation.isOnline && (
            <Badge variant="secondary" className="mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Online
            </Badge>
          )}
        </motion.div>
      </div>

      {/* Contact Information */}
      <div className="p-4 border-b border-border">
        <h5 className="font-medium text-foreground mb-3">Contact Information</h5>
        <div className="space-y-3">
          {customerInfo.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{customerInfo.email}</span>
            </div>
          )}
          {customerInfo.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{customerInfo.phone}</span>
            </div>
          )}
          {customerInfo.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{customerInfo.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Stats */}
      <div className="p-4 border-b border-border">
        <h5 className="font-medium text-foreground mb-3">Customer Stats</h5>
        <div className="space-y-3">
          <motion.div
            className="flex items-center justify-between"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Joined</span>
            </div>
            <span className="text-sm text-foreground">{formatDate(customerInfo.joinDate)}</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-between"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conversations</span>
            </div>
            <span className="text-sm text-foreground">{customerInfo.totalConversations}</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-between"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last seen</span>
            </div>
            <span className="text-sm text-foreground">{formatDate(customerInfo.lastSeen)}</span>
          </motion.div>
        </div>
      </div>

      {/* Tags */}
      {customerInfo.tags.length > 0 && (
        <div className="p-4 border-b border-border">
          <h5 className="font-medium text-foreground mb-3">Tags</h5>
          <div className="flex flex-wrap gap-2">
            {customerInfo.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History */}
      <div className="flex-1 p-4" data-testid="customer-history">
        <h5 className="font-medium text-foreground mb-3">Recent Activity</h5>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Started conversation</span>
            </div>
            <div className="text-xs text-muted-foreground ml-4">
              {formatDate(selectedConversation.createdAt || new Date())}
            </div>
          </div>
          
          {selectedConversation.lastMessage && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Last message</span>
              </div>
              <div className="text-xs text-muted-foreground ml-4">
                {formatDate(selectedConversation.updatedAt || new Date())}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Tag className="h-4 w-4 mr-2" />
            Add Tag
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

EnhancedCustomerDetails.displayName = 'EnhancedCustomerDetails';

export { EnhancedCustomerDetails };
