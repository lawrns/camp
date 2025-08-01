"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Mail } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface TeamInviteStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function TeamInviteStep({ data, onUpdate, onNext, onBack, isLoading }: TeamInviteStepProps) {
  const [invites, setInvites] = useState(data.teamInvites || [{ email: '', role: 'agent' as const }]);

  const addInvite = () => {
    setInvites([...invites, { email: '', role: 'agent' as const }]);
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
    const updated = invites.map((invite, i) => 
      i === index ? { ...invite, [field]: value } : invite
    );
    setInvites(updated);
  };

  const handleNext = () => {
    onUpdate({ teamInvites: invites.filter(invite => invite.email.trim()) });
    onNext();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Invite Your Team
        </CardTitle>
        <CardDescription>
          Invite team members to collaborate on customer support. You can always add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invites.map((invite, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor={`email-${index}`}>Email</Label>
              <Input
                id={`email-${index}`}
                type="email"
                placeholder="colleague@company.com"
                value={invite.email}
                onChange={(e) => updateInvite(index, 'email', e.target.value)}
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`role-${index}`}>Role</Label>
              <select
                id={`role-${index}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={invite.role}
                onChange={(e) => updateInvite(index, 'role', e.target.value)}
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            {invites.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeInvite(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={addInvite}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Invite
        </Button>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={isLoading}>
            {isLoading ? 'Sending Invites...' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}