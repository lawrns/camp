"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OnboardingData } from '../OnboardingFlow';
import { Building2, ArrowLeft } from 'lucide-react';

interface OrganizationSetupStepProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onPrevious: () => void;
}

export function OrganizationSetupStep({ data, onComplete, onPrevious }: OrganizationSetupStepProps) {
  const [organizationName, setOrganizationName] = useState(data.organizationName || '');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Update organization details via API
      const response = await fetch(`/api/organizations/${data.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: organizationName.trim(),
          description: description.trim() || null,
          settings: {
            website: website.trim() || null,
            industry: industry.trim() || null,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      // Continue to next step
      onComplete({
        organizationName: organizationName.trim(),
      });
    } catch (err) {
      console.error('[Onboarding] Organization setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    'Technology',
    'E-commerce',
    'Healthcare',
    'Education',
    'Finance',
    'Real Estate',
    'Manufacturing',
    'Consulting',
    'Non-profit',
    'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Organization Setup
        </h2>
        <p className="text-gray-600">
          Tell us about your organization to personalize your Campfire experience.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="organizationName">
            Organization Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organizationName"
            type="text"
            placeholder="Enter your organization name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of your organization"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://your-website.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry (Optional)</Label>
          <select
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select an industry</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            type="button"
            onClick={onPrevious}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !organizationName.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          This information helps us customize your experience and can be updated later.
        </p>
      </div>
    </div>
  );
}
