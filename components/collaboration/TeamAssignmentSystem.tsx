'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Star,
  Activity,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'specialist';
  status: 'online' | 'away' | 'busy' | 'offline';
  skills: string[];
  currentLoad: number;
  maxLoad: number;
  averageResponseTime: number;
  satisfactionScore: number;
  availability: {
    timezone: string;
    workingHours: { start: string; end: string };
    isAvailable: boolean;
  };
}

interface Assignment {
  id: string;
  conversationId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  estimatedResolutionTime?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'escalated';
}

interface TeamAssignmentSystemProps {
  conversationId: string;
  organizationId: string;
  currentAssignment?: Assignment;
  onAssignmentChange: (assignment: Assignment) => void;
  className?: string;
}

export function TeamAssignmentSystem({
  conversationId,
  organizationId,
  currentAssignment,
  onAssignmentChange,
  className = '',
}: TeamAssignmentSystemProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    loadTeamMembers();
  }, [organizationId]);

  const loadTeamMembers = async () => {
    try {
      // Mock data - in production, this would fetch from API
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah@company.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          role: 'specialist',
          status: 'online',
          skills: ['Technical Support', 'API Integration', 'Billing'],
          currentLoad: 3,
          maxLoad: 8,
          averageResponseTime: 2.5,
          satisfactionScore: 4.8,
          availability: {
            timezone: 'PST',
            workingHours: { start: '09:00', end: '17:00' },
            isAvailable: true,
          },
        },
        {
          id: '2',
          name: 'Mike Rodriguez',
          email: 'mike@company.com',
          role: 'agent',
          status: 'online',
          skills: ['Customer Success', 'Product Support', 'Onboarding'],
          currentLoad: 5,
          maxLoad: 10,
          averageResponseTime: 3.2,
          satisfactionScore: 4.6,
          availability: {
            timezone: 'EST',
            workingHours: { start: '08:00', end: '16:00' },
            isAvailable: true,
          },
        },
        {
          id: '3',
          name: 'Emma Thompson',
          email: 'emma@company.com',
          role: 'admin',
          status: 'busy',
          skills: ['Escalations', 'Team Management', 'Complex Issues'],
          currentLoad: 2,
          maxLoad: 5,
          averageResponseTime: 4.1,
          satisfactionScore: 4.9,
          availability: {
            timezone: 'GMT',
            workingHours: { start: '09:00', end: '17:00' },
            isAvailable: false,
          },
        },
      ];
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const getSuggestedAssignments = () => {
    return teamMembers
      .filter(member => member.availability.isAvailable && member.status !== 'offline')
      .map(member => {
        let score = 0;
        
        // Load balancing (prefer less loaded agents)
        const loadRatio = member.currentLoad / member.maxLoad;
        score += (1 - loadRatio) * 30;
        
        // Response time (prefer faster responders)
        score += Math.max(0, (10 - member.averageResponseTime) * 5);
        
        // Satisfaction score
        score += member.satisfactionScore * 10;
        
        // Role bonus
        if (member.role === 'specialist') score += 15;
        if (member.role === 'admin') score += 10;
        
        // Availability bonus
        if (member.status === 'online') score += 20;
        else if (member.status === 'away') score += 5;
        
        return { member, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const handleAssign = async () => {
    if (!selectedMember || !assignmentReason.trim()) return;

    setIsAssigning(true);
    try {
      const assignment: Assignment = {
        id: `assignment_${Date.now()}`,
        conversationId,
        assignedTo: selectedMember,
        assignedBy: 'current_user', // Would be actual user ID
        assignedAt: new Date(),
        priority,
        reason: assignmentReason,
        status: 'pending',
      };

      // In production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onAssignmentChange(assignment);
      
      // Reset form
      setSelectedMember('');
      setAssignmentReason('');
      setPriority('medium');
    } catch (error) {
      console.error('Error assigning conversation:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const suggestedAssignments = getSuggestedAssignments();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Assignment */}
      {currentAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Current Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {teamMembers.find(m => m.id === currentAssignment.assignedTo)?.name.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {teamMembers.find(m => m.id === currentAssignment.assignedTo)?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Assigned {currentAssignment.assignedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={getPriorityColor(currentAssignment.priority)}>
                {currentAssignment.priority}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Assignments */}
      {showSuggestions && suggestedAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Suggested Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestedAssignments.map(({ member, score }) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedMember(member.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="h-3 w-3" />
                        <span>{member.currentLoad}/{member.maxLoad} conversations</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{member.averageResponseTime}min avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {Math.round(score)}% match
                    </div>
                    <div className="flex gap-1 mt-1">
                      {member.skills.slice(0, 2).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Conversation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Team Member</label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                      <span>{member.name}</span>
                      <span className="text-gray-500">({member.currentLoad}/{member.maxLoad})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Assignment Reason</label>
            <Textarea
              value={assignmentReason}
              onChange={(e) => setAssignmentReason(e.target.value)}
              placeholder="Why are you assigning this conversation? (e.g., technical expertise needed, escalation, etc.)"
              rows={3}
            />
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedMember || !assignmentReason.trim() || isAssigning}
            className="w-full"
          >
            {isAssigning ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Assign Conversation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
