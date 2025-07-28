'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';
import { triggerHandoff, HandoffResponse } from '@/lib/ai/handoff';
import { toast } from '@/components/ui/use-toast';

interface HandoffButtonProps {
  conversationId: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onHandoffTriggered?: (response: HandoffResponse) => void;
}

export function HandoffButton({
  conversationId,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className,
  onHandoffTriggered
}: HandoffButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [error, setError] = useState('');

  const handleHandoff = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the handoff');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await triggerHandoff(conversationId, reason, priority);
      
      if (response.success) {
        toast({
          title: 'Handoff Initiated',
          description: response.assignedAgent 
            ? `Assigned to ${response.assignedAgent.name}` 
            : `Estimated wait time: ${response.estimatedWaitTime} minutes`,
        });
        
        setIsOpen(false);
        setReason('');
        setPriority('medium');
        onHandoffTriggered?.(response);
      } else {
        setError(response.error || 'Failed to initiate handoff');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangleIcon className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <ClockIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Critical issue requiring immediate attention';
      case 'high':
        return 'Important issue that should be addressed quickly';
      case 'medium':
        return 'Standard issue with normal response time';
      case 'low':
        return 'Non-critical issue that can wait';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          className={className}
          data-testid="handoff-button"
        >
          <UserIcon className="h-4 w-4 mr-2" />
          Transfer to Human
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer to Human Agent</DialogTitle>
          <DialogDescription>
            This conversation will be transferred to a human agent. Please provide details about why this transfer is needed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger data-testid="priority-select">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon('low')}
                    <span>Low Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon('medium')}
                    <span>Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon('high')}
                    <span>High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center space-x-2">
                    {getPriorityIcon('urgent')}
                    <span>Urgent</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getPriorityDescription(priority)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer</Label>
            <Textarea
              id="reason"
              placeholder="Describe why this conversation needs human assistance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              data-testid="handoff-reason"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setReason('');
              setError('');
            }}
            disabled={isLoading}
            data-testid="handoff-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleHandoff}
            disabled={isLoading || !reason.trim()}
            data-testid="handoff-confirm"
          >
            {isLoading ? 'Transferring...' : 'Transfer to Human'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick handoff button for common scenarios
export function QuickHandoffButton({
  conversationId,
  reason,
  priority = 'medium',
  children,
  onHandoffTriggered,
  ...props
}: {
  conversationId: string;
  reason: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  children: React.ReactNode;
  onHandoffTriggered?: (response: HandoffResponse) => void;
} & React.ComponentProps<typeof Button>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickHandoff = async () => {
    setIsLoading(true);
    
    try {
      const response = await triggerHandoff(conversationId, reason, priority);
      
      if (response.success) {
        toast({
          title: 'Handoff Initiated',
          description: response.assignedAgent 
            ? `Assigned to ${response.assignedAgent.name}` 
            : `Estimated wait time: ${response.estimatedWaitTime} minutes`,
        });
        
        onHandoffTriggered?.(response);
      } else {
        toast({
          title: 'Handoff Failed',
          description: response.error || 'Failed to initiate handoff',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      {...props}
      onClick={handleQuickHandoff}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? 'Transferring...' : children}
    </Button>
  );
}