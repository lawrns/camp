'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Zap, 
  User, 
  Clock, 
  Star, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';

interface AssignmentSuggestion {
  agentId: string;
  agentName: string;
  agentEmail: string;
  currentWorkload: number;
  maxCapacity: number;
  utilizationRate: number;
  availabilityScore: number;
  skillMatchScore: number;
  performanceScore: number;
  totalScore: number;
  estimatedResponseTime: number;
  skills: string[];
  status: string;
  recommendation: string;
}

interface EnhancedAssignmentInterfaceProps {
  organizationId: string;
  targetId: string;
  targetType: 'ticket' | 'conversation';
  currentAssignee?: string;
  requiredSkills?: string[];
  priority?: number;
  onAssignmentChange?: (assignment: unknown) => void;
}

export function EnhancedAssignmentInterface({
  organizationId,
  targetId,
  targetType,
  currentAssignee,
  requiredSkills = [],
  priority = 1,
  onAssignmentChange
}: EnhancedAssignmentInterfaceProps) {
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [validateCapacity, setValidateCapacity] = useState(true);
  const [forceAssign, setForceAssign] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch assignment suggestions
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organizationId,
        requiredSkills: JSON.stringify(requiredSkills),
        priority: priority.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/assignment/auto/suggestions?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-assign function
  const handleAutoAssign = async () => {
    try {
      setAssigning(true);
      setError(null);

      const response = await fetch('/api/assignment/auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          ticketId: targetType === 'ticket' ? targetId : undefined,
          conversationId: targetType === 'conversation' ? targetId : undefined,
          requiredSkills,
          priority,
          fallbackToManual: true
        })
      });

      if (!response.ok) {
        throw new Error(`Auto-assignment failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.assigned) {
        onAssignmentChange?.(data.assignment);
        setShowSuggestions(false);
      } else {
        setError(data.reason || 'Auto-assignment failed');
        // Show suggestions as fallback
        await fetchSuggestions();
      }
    } catch (err) {
      console.error('Error in auto-assignment:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssigning(false);
    }
  };

  // Manual assign function
  const handleManualAssign = async (agentId: string) => {
    try {
      setAssigning(true);
      setError(null);

      const endpoint = targetType === 'ticket' 
        ? `/api/tickets/${targetId}/assign-manual`
        : `/api/conversations/${targetId}/assign-manual`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          organizationId,
          reason: assignmentReason || 'Manual assignment',
          validateCapacity,
          forceAssign
        })
      });

      if (!response.ok) {
        throw new Error(`Manual assignment failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        onAssignmentChange?.(data.assignment);
        setShowSuggestions(false);
        setSelectedAgent('');
        setAssignmentReason('');
      } else {
        throw new Error(data.error || 'Manual assignment failed');
      }
    } catch (err) {
      console.error('Error in manual assignment:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssigning(false);
    }
  };

  // Unassign function
  const handleUnassign = async () => {
    try {
      setAssigning(true);
      setError(null);

      const endpoint = targetType === 'ticket' 
        ? `/api/tickets/${targetId}/assign-manual`
        : `/api/conversations/${targetId}/assign-manual`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          reason: assignmentReason || 'Manual unassignment'
        })
      });

      if (!response.ok) {
        throw new Error(`Unassignment failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        onAssignmentChange?.(data);
        setShowSuggestions(false);
      } else {
        throw new Error(data.error || 'Unassignment failed');
      }
    } catch (err) {
      console.error('Error in unassignment:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssigning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation.includes('Excellent')) return 'default';
    if (recommendation.includes('Good')) return 'secondary';
    if (recommendation.includes('Fair')) return 'outline';
    return 'destructive';
  };

  return (
    <div className="space-y-spacing-md">
      {/* Current Assignment Status */}
      {currentAssignee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-ds-2">
              <User className="h-5 w-5" />
              Currently Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {currentAssignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentAssignee}</p>
                  <p className="text-sm text-muted-foreground">Assigned Agent</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleUnassign}
                disabled={assigning}
              >
                Unassign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-ds-2">
            <Target className="h-5 w-5" />
            Assignment Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-spacing-md">
          {/* Auto Assignment */}
          <div className="flex items-center justify-between spacing-3 border rounded-ds-lg">
            <div>
              <h4 className="font-medium flex items-center gap-ds-2">
                <Zap className="h-4 w-4" />
                Auto Assignment
              </h4>
              <p className="text-sm text-muted-foreground">
                Automatically assign to the best available agent
              </p>
            </div>
            <Button 
              onClick={handleAutoAssign}
              disabled={assigning || loading}
            >
              Auto Assign
            </Button>
          </div>

          {/* Manual Assignment */}
          <div className="spacing-3 border rounded-ds-lg space-y-3">
            <h4 className="font-medium flex items-center gap-ds-2">
              <Users className="h-4 w-4" />
              Manual Assignment
            </h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="reason">Assignment Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Reason for this assignment..."
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-spacing-sm">
                <Switch
                  id="validate-capacity"
                  checked={validateCapacity}
                  onCheckedChange={setValidateCapacity}
                />
                <Label htmlFor="validate-capacity">Validate agent capacity</Label>
              </div>

              <div className="flex items-center space-x-spacing-sm">
                <Switch
                  id="force-assign"
                  checked={forceAssign}
                  onCheckedChange={setForceAssign}
                />
                <Label htmlFor="force-assign">Force assignment (override capacity)</Label>
              </div>

              <Button 
                onClick={fetchSuggestions}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Loading...' : 'Get Assignment Suggestions'}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="spacing-3 bg-red-50 border border-[var(--fl-color-danger-muted)] rounded-ds-lg">
              <div className="flex items-center gap-ds-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Suggestions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-spacing-md">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No available agents found</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <Card key={suggestion.agentId} className="p-spacing-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {suggestion.agentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-spacing-sm">
                        <div>
                          <h4 className="font-medium">{suggestion.agentName}</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.agentEmail}</p>
                        </div>

                        <div className="flex items-center gap-ds-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{suggestion.status}</Badge>
                          </div>
                          <div>
                            Workload: {suggestion.currentWorkload}/{suggestion.maxCapacity}
                          </div>
                          <div>
                            Utilization: {suggestion.utilizationRate.toFixed(1)}%
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Overall Score</span>
                            <span className={`font-medium ${getScoreColor(suggestion.totalScore)}`}>
                              {suggestion.totalScore.toFixed(1)}/100
                            </span>
                          </div>
                          <Progress value={suggestion.totalScore} className="h-2" />
                        </div>

                        <div className="grid grid-cols-3 gap-ds-2 text-tiny">
                          <div>
                            <span className="text-muted-foreground">Skills:</span>
                            <span className={`ml-1 ${getScoreColor(suggestion.skillMatchScore)}`}>
                              {suggestion.skillMatchScore.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Availability:</span>
                            <span className={`ml-1 ${getScoreColor(suggestion.availabilityScore)}`}>
                              {suggestion.availabilityScore.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Performance:</span>
                            <span className={`ml-1 ${getScoreColor(suggestion.performanceScore)}`}>
                              {suggestion.performanceScore.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-ds-2">
                          <Badge variant={getRecommendationBadge(suggestion.recommendation)}>
                            {suggestion.recommendation}
                          </Badge>
                        </div>

                        <div className="text-tiny text-muted-foreground">
                          Skills: {suggestion.skills.join(', ') || 'None specified'}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleManualAssign(suggestion.agentId)}
                      disabled={assigning}
                      size="sm"
                    >
                      Assign
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
