"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { OnboardingData } from '../OnboardingFlow';
import { Sparkles, MessageSquare, Users, BarChart3 } from 'lucide-react';

interface WelcomeStepProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onSkip: () => void;
}

export function WelcomeStep({ data, onComplete, onSkip }: WelcomeStepProps) {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI-Powered Support',
      description: 'Intelligent chat widget that handles customer inquiries automatically'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Seamless handoff between AI and human agents when needed'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track performance and customer satisfaction metrics'
    },
    {
      icon: Sparkles,
      title: 'Easy Integration',
      description: 'Simple widget installation with customizable appearance'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <BrandLogo className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Campfire!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your customer support with AI-powered conversations. 
          Let's get you set up in just a few minutes.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
            <div className="flex-shrink-0">
              <feature.icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Organization Info */}
      {data.organizationName && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Your Organization</h3>
          <p className="text-blue-700">
            Setting up Campfire for <strong>{data.organizationName}</strong>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <Button 
          onClick={() => onComplete({})}
          className="flex-1"
          size="lg"
        >
          Get Started
        </Button>
        <Button 
          onClick={onSkip}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          Skip Setup
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>
          This setup will take about 3-5 minutes. You can always change these settings later.
        </p>
      </div>
    </div>
  );
}
