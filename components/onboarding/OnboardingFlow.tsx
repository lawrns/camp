"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { WelcomeStep } from './steps/WelcomeStep';
import { OrganizationSetupStep } from './steps/OrganizationSetupStep';
import { TeamInviteStep } from './steps/TeamInviteStep';
import { WidgetSetupStep } from './steps/WidgetSetupStep';
import { CompletionStep } from './steps/CompletionStep';

export interface OnboardingData {
  organizationId: string;
  organizationName: string;
  userRole: string;
  widgetSettings?: {
    primaryColor?: string;
    welcomeMessage?: string;
    position?: 'bottom-right' | 'bottom-left';
  };
  teamInvites?: Array<{
    email: string;
    role: 'admin' | 'agent' | 'viewer';
  }>;
}

interface OnboardingFlowProps {
  userId: string;
  organizationId: string;
  initialData?: Partial<OnboardingData>;
  onComplete?: (data: OnboardingData) => void;
}

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with Campfire' },
  { id: 'organization', title: 'Organization', description: 'Set up your organization' },
  { id: 'team', title: 'Team', description: 'Invite team members' },
  { id: 'widget', title: 'Widget', description: 'Configure your chat widget' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
];

export function OnboardingFlow({ userId, organizationId, initialData, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    organizationId,
    organizationName: '',
    userRole: 'admin',
    ...initialData,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load existing onboarding progress
  useEffect(() => {
    loadOnboardingProgress();
  }, [userId, organizationId]);

  const loadOnboardingProgress = async () => {
    try {
      const response = await fetch(`/api/onboarding/progress?userId=${userId}&organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setCurrentStep(data.progress.currentStep || 0);
          setOnboardingData(prev => ({ ...prev, ...data.progress.data }));
        }
      }
    } catch (error) {
      console.error('[Onboarding] Failed to load progress:', error);
    }
  };

  const saveProgress = async (stepIndex: number, data: Partial<OnboardingData>) => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId,
          currentStep: stepIndex,
          data: { ...onboardingData, ...data },
        }),
      });
    } catch (error) {
      console.error('[Onboarding] Failed to save progress:', error);
    }
  };

  const handleStepComplete = async (stepData: Partial<OnboardingData>) => {
    const updatedData = { ...onboardingData, ...stepData };
    setOnboardingData(updatedData);

    // Save progress
    await saveProgress(currentStep + 1, stepData);

    // Move to next step
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding(updatedData);
    }
  };

  const completeOnboarding = async (finalData: OnboardingData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          organizationId,
          data: finalData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Call completion callback
      onComplete?.(finalData);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('[Onboarding] Completion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Skip to completion with minimal data
    await completeOnboarding(onboardingData);
  };

  const renderStep = () => {
    const stepId = ONBOARDING_STEPS[currentStep]?.id;

    switch (stepId) {
      case 'welcome':
        return (
          <WelcomeStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onSkip={handleSkip}
          />
        );
      case 'organization':
        return (
          <OrganizationSetupStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
          />
        );
      case 'team':
        return (
          <TeamInviteStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
            onSkip={() => handleStepComplete({})}
          />
        );
      case 'widget':
        return (
          <WidgetSetupStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onPrevious={handlePrevious}
          />
        );
      case 'complete':
        return (
          <CompletionStep
            data={onboardingData}
            onComplete={() => router.push('/dashboard')}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Setup Campfire</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="mb-4" />
          
          <div className="flex items-center space-x-4 overflow-x-auto">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2 min-w-0">
                <div className="flex items-center space-x-2">
                  {index < currentStep ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : index === currentStep ? (
                    <Circle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Current Step */}
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[currentStep]?.title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[currentStep]?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
