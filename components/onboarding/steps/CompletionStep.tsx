"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Users, MessageSquare, Settings, ExternalLink } from 'lucide-react';
import { OnboardingData } from '../OnboardingFlow';

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function CompletionStep({ data, onComplete, onBack, isLoading }: CompletionStepProps) {
  const completedSteps = [
    {
      icon: CheckCircle,
      title: 'Organization Setup',
      description: `${data.organizationName} is ready to go`,
      completed: true
    },
    {
      icon: Users,
      title: 'Team Invitations',
      description: `${data.teamInvites?.length || 0} team members invited`,
      completed: true
    },
    {
      icon: Settings,
      title: 'Widget Configuration',
      description: 'Chat widget customized and ready',
      completed: true
    }
  ];

  const nextSteps = [
    {
      title: 'Test Your Widget',
      description: 'Try out the chat widget on your website',
      action: 'Go to Widget Demo',
      href: '/widget/demo'
    },
    {
      title: 'Manage Conversations',
      description: 'Start handling customer inquiries',
      action: 'Open Inbox',
      href: '/inbox'
    },
    {
      title: 'View Analytics',
      description: 'Monitor your support performance',
      action: 'See Dashboard',
      href: '/dashboard'
    },
    {
      title: 'Knowledge Base',
      description: 'Add articles to help customers self-serve',
      action: 'Manage Knowledge',
      href: '/knowledge'
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl">
          Welcome to Campfire! 🎉
        </CardTitle>
        <CardDescription className="text-lg">
          Your customer support platform is ready. Here's what we've set up for you:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completed Steps Summary */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Setup Complete</h3>
          {completedSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <IconComponent className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">{step.title}</div>
                  <div className="text-sm text-green-700">{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nextSteps.map((step, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900 mb-1">{step.title}</div>
                <div className="text-sm text-gray-600 mb-3">{step.description}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(step.href, '_blank')}
                >
                  {step.action}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Organization Summary</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div><strong>Name:</strong> {data.organizationName}</div>
            <div><strong>ID:</strong> {data.organizationId}</div>
            <div><strong>Your Role:</strong> {data.userRole}</div>
            <div><strong>Widget Color:</strong> {data.widgetSettings?.primaryColor || '#3b82f6'}</div>
            <div><strong>Team Size:</strong> {(data.teamInvites?.length || 0) + 1} members</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onComplete} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? 'Finishing...' : (
              <>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help Section */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">
            Need help getting started?
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="link" size="sm">
              View Documentation
            </Button>
            <Button variant="link" size="sm">
              Contact Support
            </Button>
            <Button variant="link" size="sm">
              Watch Tutorial
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}