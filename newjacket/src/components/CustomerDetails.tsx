import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Mail, 
  Calendar,
  Clock,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

interface CustomerDetailsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerDetails({ isOpen, onClose }: CustomerDetailsProps) {
  const tickets = [
    {
      id: '1241',
      title: 'zPhone Refund for Ashlin Paul',
      status: 'Open',
      priority: 'Medium',
      created: '31 May 2019 00:47'
    },
    {
      id: '1237',
      title: 'Screen protection warranty on my zPhone',
      status: 'Closed',
      priority: 'Low',
      created: '30 May 2019 07:06'
    },
    {
      id: '1236',
      title: 'Thanks for the timely refund!',
      status: 'Closed',
      priority: 'Low',
      created: '30 May 2019 06:58'
    },
    {
      id: '1234',
      title: 'Enquiry on Return Period',
      status: 'Closed',
      priority: 'Medium',
      created: '29 May 2019 01:58'
    },
    {
      id: '895',
      title: 'Z Phone battery related issue',
      status: 'Open',
      priority: 'None',
      created: '13 Mar 2018 19:19'
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '100%', opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="w-96 bg-card border-l border-border flex flex-col"
          variants={sidebarVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Customer Details</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Customer Information */}
          <motion.div 
            className="p-4 border-b border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Customer Information</span>
              </h4>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold text-lg">
                  AP
                </AvatarFallback>
              </Avatar>
              <h5 className="font-semibold text-foreground">Ashlin Paul</h5>
              
              <div className="w-full space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>ashlinpaul.w@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined August 6, 2025</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Assistant */}
          <motion.div 
            className="p-4 border-b border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>AI Assistant</span>
              </h4>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">AI Assistant Status</span>
                <Badge variant="secondary">Inactive</Badge>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <h6 className="font-medium text-primary mb-1">AI Suggestions</h6>
                <p className="text-sm text-muted-foreground">
                  AI-powered response suggestions and customer insights will appear here.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Generate Response
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Summarize Chat
                </Button>
              </div>
            </div>
          </motion.div>

          {/* All Tickets */}
          <div className="flex-1 overflow-y-auto">
            <motion.div 
              className="p-4 border-b border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">All Tickets from Ashlin Paul</h4>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex space-x-2 mb-4">
                <Button variant="secondary" size="sm">All</Button>
                <Button variant="ghost" size="sm">Open</Button>
                <Button variant="ghost" size="sm">Closed</Button>
                <Button variant="ghost" size="sm">On Hold</Button>
              </div>

              <div className="space-y-3">
                {tickets.map((ticket, index) => (
                  <motion.div 
                    key={ticket.id}
                    className="p-3 border border-border rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer hover:bg-accent/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h6 className="font-medium text-foreground text-sm">
                        {ticket.id} {ticket.title}
                      </h6>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusVariant(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <span className={cn("text-xs font-medium", getPriorityColor(ticket.priority))}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{ticket.created}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button variant="ghost" className="w-full mt-4 text-primary">
                Show 5 More
              </Button>
            </motion.div>

            {/* Activity & Engagement */}
            <motion.div 
              className="p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground">Activity & Engagement</h4>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Customer activity and engagement metrics will appear here.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}