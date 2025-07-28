// Placeholder components for remaining onboarding steps
"use client";

import { Spinner as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Icon } from "@/lib/ui/Icon";

interface StepProps {
  organizationId: string;
  onComplete: (data?: any) => void;
  onSkip: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export function GoalsStep({ organizationId, onComplete, onSkip, onBack, isLoading }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Success Metrics & Goals</h3>
        <p className="text-foreground mb-6">
          This step will help you define what success looks like for your customer support.
        </p>
        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <p className="text-sm text-blue-800">
            🚧 This step is being improved with comprehensive goal tracking and metrics configuration.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={() => onComplete()}
          disabled={isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}

export function TeamStructureStep({ organizationId, onComplete, onSkip, onBack, isLoading }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Team Structure & Workflow</h3>
        <p className="text-foreground mb-6">
          Configure your team structure and invite team members to join your Campfire workspace.
        </p>
        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <p className="text-sm text-blue-800">
            🚧 This step is being improved with team member invitations and role management.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={() => onComplete()}
          disabled={isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsStep({ organizationId, onComplete, onSkip, onBack, isLoading }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Tools & Integrations</h3>
        <p className="text-foreground mb-6">
          Connect your existing tools and set up integrations to streamline your workflow.
        </p>
        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <p className="text-sm text-blue-800">
            🚧 This step is being improved with integration setup and data import capabilities.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={() => onComplete()}
          disabled={isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}

export function TechnicalSetupStep({ organizationId, onComplete, onSkip, onBack, isLoading }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Technical Setup</h3>
        <p className="text-foreground mb-6">Get Campfire running on your website with our easy-to-install widget.</p>
        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-3">
          <p className="text-sm text-blue-800">
            🚧 This step is being improved with widget customization and installation guidance.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for Now
        </Button>
        <Button
          onClick={() => onComplete()}
          disabled={isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </div>
    </div>
  );
}
