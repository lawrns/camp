"use client";

import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/utils/api-client";
import { getAppUrl } from "@/lib/utils/env-config";
import { AlertTriangle as AlertCircle, Brain, Buildings as Building, CheckCircle as Check, CheckCircle as CheckCircle2, Clock, Copy, CurrencyDollar, Globe, Spinner as Loader2, Envelope as Mail, MessageCircle as MessageSquare, Phone, Settings as Settings, Star, Target, TrendUp as TrendingUp, Users, Zap as Zap,  } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// Types for step components
interface StepProps {
  organizationId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: "business",
    title: "Tell Us About Your Business",
    description: "Help us understand your support needs",
    icon: Building,
    component: BusinessProfileStep,
  },
  {
    id: "challenges",
    title: "Current Support Challenges",
    description: "What pain points can we help solve?",
    icon: MessageSquare,
    component: ChallengesStep,
  },
  {
    id: "goals",
    title: "Success Metrics & Goals",
    description: "Define what success looks like",
    icon: Target,
    component: GoalsStep,
  },
  {
    id: "team",
    title: "Team Structure & Workflow",
    description: "How does your team operate?",
    icon: Users,
    component: TeamStructureStep,
  },
  {
    id: "integrations",
    title: "Tools & Integrations",
    description: "Connect your existing tools",
    icon: Zap,
    component: IntegrationsStep,
  },
  {
    id: "setup",
    title: "Technical Setup",
    description: "Get Campfire running on your site",
    icon: Settings,
    component: TechnicalSetupStep,
  },
];

export default function OnboardingSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");

  function handleStepComplete() {
    const stepId = steps[currentStep]?.id;
    if (stepId) {
      setCompletedSteps([...completedSteps, stepId]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding complete - mark as completed and redirect
      void markOnboardingComplete();
    }
  }

  async function markOnboardingComplete() {
    // Mark onboarding as completed in localStorage
    localStorage.setItem("campfire-onboarding-completed", "true");
    localStorage.setItem("campfire-onboarding-welcome-seen", "true");

    // The organization ID is already passed through URL parameters
    // and will be handled by the dashboard's DashboardClientWrapper
    // No need to update metadata here as it's not implemented yet

    // Use router.push with a parameter to indicate we're coming from onboarding
    router.push("/dashboard?from=onboarding");
  }

  function handleSkip() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding complete even when skipping
      void markOnboardingComplete();
    }
  }

  const CurrentStepComponent = steps[currentStep]?.component;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-ds-full transition-all duration-300",
                  index <= currentStep
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-neutral-200 text-neutral-400"
                )}
              >
                {completedSteps.includes(step.id) ? (
                  <Icon icon={Check} className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="mx-2 flex-1">
                  <div
                    className={cn(
                      "h-1 rounded-ds-full transition-all duration-500",
                      index < currentStep ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep]?.title}</h2>
          <p className="mt-1 text-gray-700">{steps[currentStep]?.description}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-[var(--fl-color-text-muted)]">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>•</span>
            <span>~{Math.max(1, (steps.length - currentStep) * 2)} min remaining</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <OptimizedAnimatePresence mode="wait">
        <OptimizedMotion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {CurrentStepComponent && orgId ? (
            <CurrentStepComponent organizationId={orgId} onComplete={handleStepComplete} onSkip={handleSkip} />
          ) : null}
        </OptimizedMotion.div>
      </OptimizedAnimatePresence>
    </div>
  );
}

// Strategic onboarding step components
function BusinessProfileStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [profile, setProfile] = useState({
    industry: "",
    companySize: "",
    supportVolume: "",
    currentSolution: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      await apiPost(`/api/organizations/${organizationId}/profile`, profile);
      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Tell Us About Your Business</h3>
          <p className="text-gray-700">
            Help us understand your business so we can provide the most relevant recommendations and setup.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={profile.industry} onValueChange={(value) => setProfile({ ...profile, industry: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">SaaS / Technology</SelectItem>
                <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Financial Services</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="consulting">Consulting / Services</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select
              value={profile.companySize}
              onValueChange={(value) => setProfile({ ...profile, companySize: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Number of employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                <SelectItem value="1000+">1,000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Monthly Support Volume</Label>
            <Select
              value={profile.supportVolume}
              onValueChange={(value) => setProfile({ ...profile, supportVolume: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estimated monthly tickets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-100">0-100 tickets</SelectItem>
                <SelectItem value="101-500">101-500 tickets</SelectItem>
                <SelectItem value="501-2000">501-2,000 tickets</SelectItem>
                <SelectItem value="2001-10000">2,001-10,000 tickets</SelectItem>
                <SelectItem value="10000+">10,000+ tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Current Support Solution</Label>
            <Select
              value={profile.currentSolution}
              onValueChange={(value) => setProfile({ ...profile, currentSolution: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="What do you use now?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No formal system</SelectItem>
                <SelectItem value="email">Email only</SelectItem>
                <SelectItem value="zendesk">Zendesk</SelectItem>
                <SelectItem value="intercom">Intercom</SelectItem>
                <SelectItem value="freshdesk">Freshdesk</SelectItem>
                <SelectItem value="helpscout">Help Scout</SelectItem>
                <SelectItem value="other">Other platform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Website URL (Optional)</Label>
          <Input
            type="url"
            placeholder="https://yourcompany.com"
            value={profile.website}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
          />
          <p className="text-sm text-gray-600">We'll use this to provide personalized setup recommendations</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChallengesStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [challenges, setChallenges] = useState({
    primaryChallenges: [] as string[],
    responseTime: "",
    customerSatisfaction: "",
    teamBurnout: "",
    specificPainPoints: "",
  });
  const [loading, setLoading] = useState(false);

  const challengeOptions = [
    { id: "response-time", label: "Slow response times", icon: Clock },
    { id: "volume", label: "High ticket volume", icon: TrendingUp },
    { id: "consistency", label: "Inconsistent responses", icon: AlertCircle },
    { id: "knowledge", label: "Knowledge management", icon: Brain },
    { id: "handoffs", label: "Complex escalations", icon: Users },
    { id: "availability", label: "24/7 coverage", icon: Globe },
  ];

  function toggleChallenge(challengeId: string) {
    setChallenges((prev) => ({
      ...prev,
      primaryChallenges: prev.primaryChallenges.includes(challengeId)
        ? prev.primaryChallenges.filter((id) => id !== challengeId)
        : [...prev.primaryChallenges, challengeId],
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPost(`/api/organizations/${organizationId}/challenges`, challenges);
      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">What Are Your Biggest Support Challenges?</h3>
          <p className="text-gray-700">
            Understanding your pain points helps us configure Campfire to address your specific needs.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Primary Challenges (Select all that apply)</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {challengeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = challenges.primaryChallenges.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleChallenge(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-4 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-[var(--fl-color-text-muted)]")}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Average Response Time</Label>
              <Select
                value={challenges.responseTime}
                onValueChange={(value) => setChallenges({ ...challenges, responseTime: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How quickly do you respond?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Under 1 hour</SelectItem>
                  <SelectItem value="same-day">Same day</SelectItem>
                  <SelectItem value="next-day">Next business day</SelectItem>
                  <SelectItem value="2-3-days">2-3 days</SelectItem>
                  <SelectItem value="longer">Longer than 3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer Satisfaction Level</Label>
              <Select
                value={challenges.customerSatisfaction}
                onValueChange={(value) => setChallenges({ ...challenges, customerSatisfaction: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How satisfied are customers?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very-high">Very High (90%+)</SelectItem>
                  <SelectItem value="high">High (80-89%)</SelectItem>
                  <SelectItem value="moderate">Moderate (70-79%)</SelectItem>
                  <SelectItem value="low">Low (60-69%)</SelectItem>
                  $1{"<"}60%)$3
                  <SelectItem value="unknown">Not measured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specific Pain Points (Optional)</Label>
            <textarea
              className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] spacing-3 focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe any specific challenges or frustrations your team faces..."
              value={challenges.specificPainPoints}
              onChange={(e) => setChallenges({ ...challenges, specificPainPoints: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Goals and Success Metrics Step
function GoalsStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [goals, setGoals] = useState({
    primaryGoals: [] as string[],
    responseTimeGoal: "",
    satisfactionGoal: "",
    volumeGrowth: "",
    successMetrics: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const goalOptions = [
    { id: "reduce-response-time", label: "Reduce response times", icon: Clock },
    { id: "improve-satisfaction", label: "Improve customer satisfaction", icon: Star },
    { id: "reduce-costs", label: "Reduce support costs", icon: CurrencyDollar },
    { id: "scale-team", label: "Scale without growing team", icon: TrendingUp },
    { id: "24-7-support", label: "Provide 24/7 support", icon: Globe },
    { id: "self-service", label: "Increase self-service", icon: Brain },
  ];

  const metricOptions = [
    { id: "response-time", label: "Average response time" },
    { id: "resolution-time", label: "Time to resolution" },
    { id: "csat-score", label: "Customer satisfaction score" },
    { id: "ticket-volume", label: "Ticket volume handled" },
    { id: "first-contact-resolution", label: "First contact resolution rate" },
    { id: "agent-productivity", label: "Agent productivity" },
  ];

  function toggleGoal(goalId: string) {
    setGoals((prev) => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goalId)
        ? prev.primaryGoals.filter((id) => id !== goalId)
        : [...prev.primaryGoals, goalId],
    }));
  }

  function toggleMetric(metricId: string) {
    setGoals((prev) => ({
      ...prev,
      successMetrics: prev.successMetrics.includes(metricId)
        ? prev.successMetrics.filter((id) => id !== metricId)
        : [...prev.successMetrics, metricId],
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPost(`/api/organizations/${organizationId}/goals`, goals);
      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">What Are Your Success Goals?</h3>
          <p className="text-gray-700">
            Help us understand what success looks like for your team so we can track progress and optimize accordingly.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Primary Goals (Select all that apply)</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {goalOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = goals.primaryGoals.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleGoal(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-4 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-[var(--fl-color-text-muted)]")}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Response Time</Label>
              <Select
                value={goals.responseTimeGoal}
                onValueChange={(value) => setGoals({ ...goals, responseTimeGoal: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What's your goal?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-15-min">Under 15 minutes</SelectItem>
                  <SelectItem value="under-1-hour">Under 1 hour</SelectItem>
                  <SelectItem value="under-4-hours">Under 4 hours</SelectItem>
                  <SelectItem value="same-day">Same day</SelectItem>
                  <SelectItem value="next-day">Next business day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Customer Satisfaction</Label>
              <Select
                value={goals.satisfactionGoal}
                onValueChange={(value) => setGoals({ ...goals, satisfactionGoal: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What's your target?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="95-plus">95%+ (Excellent)</SelectItem>
                  <SelectItem value="90-94">90-94% (Very Good)</SelectItem>
                  <SelectItem value="85-89">85-89% (Good)</SelectItem>
                  <SelectItem value="80-84">80-84% (Acceptable)</SelectItem>
                  <SelectItem value="improve">Just want to improve</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Key Metrics to Track</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {metricOptions.map((option) => {
                const isSelected = goals.successMetrics.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleMetric(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-3 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Team Structure Step
function TeamStructureStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [teamInfo, setTeamInfo] = useState({
    teamSize: "",
    roles: [] as string[],
    workingHours: "",
    timezone: "",
    escalationProcess: "",
    emails: [""],
  });
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { id: "support-manager", label: "Support Manager" },
    { id: "senior-agent", label: "Senior Support Agent" },
    { id: "support-agent", label: "Support Agent" },
    { id: "technical-specialist", label: "Technical Specialist" },
    { id: "customer-success", label: "Customer Success" },
    { id: "product-specialist", label: "Product Specialist" },
  ];

  function toggleRole(roleId: string) {
    setTeamInfo((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleId) ? prev.roles.filter((id) => id !== roleId) : [...prev.roles, roleId],
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      // Save team structure
      await apiPost(`/api/organizations/${organizationId}/team-structure`, teamInfo);

      // Send invitations if emails provided
      const validEmails = teamInfo.emails.filter((e) => e.trim() && e.includes("@"));
      for (const email of validEmails) {
        await apiPost(`/api/organizations/${organizationId}/members`, {
          email,
          role: "agent",
        });
      }

      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Tell Us About Your Team</h3>
          <p className="text-gray-700">
            Understanding your team structure helps us set up the right workflows and permissions.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Support Team Size</Label>
              <Select
                value={teamInfo.teamSize}
                onValueChange={(value) => setTeamInfo({ ...teamInfo, teamSize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How many people?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="just-me">Just me</SelectItem>
                  <SelectItem value="2-5">2-5 people</SelectItem>
                  <SelectItem value="6-15">6-15 people</SelectItem>
                  <SelectItem value="16-50">16-50 people</SelectItem>
                  <SelectItem value="50-plus">50+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Working Hours</Label>
              <Select
                value={teamInfo.workingHours}
                onValueChange={(value) => setTeamInfo({ ...teamInfo, workingHours: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When do you provide support?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business-hours">Business hours only</SelectItem>
                  <SelectItem value="extended">Extended hours (12+ hours)</SelectItem>
                  <SelectItem value="24-7">24/7 coverage</SelectItem>
                  <SelectItem value="follow-sun">Follow-the-sun model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Team Roles (Select all that apply)</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const isSelected = teamInfo.roles.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleRole(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-3 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Invite Team Members (Optional)</Label>
            <p className="mb-3 text-sm text-gray-600">Add email addresses to send invitations</p>
            <div className="space-y-3">
              {teamInfo.emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="teammate@company.com"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...teamInfo.emails];
                      newEmails[index] = e.target.value;
                      setTeamInfo({ ...teamInfo, emails: newEmails });
                    }}
                    className="flex-1"
                  />
                  {teamInfo.emails.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTeamInfo({
                          ...teamInfo,
                          emails: teamInfo.emails.filter((_, i) => i !== index),
                        })
                      }
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setTeamInfo({ ...teamInfo, emails: [...teamInfo.emails, ""] })}
              className="mt-3 w-full"
            >
              Add Another Email
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Integrations Step
function IntegrationsStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [integrations, setIntegrations] = useState({
    currentTools: [] as string[],
    priorityIntegrations: [] as string[],
    dataImport: "",
  });
  const [loading, setLoading] = useState(false);

  const toolOptions = [
    { id: "slack", label: "Slack", icon: MessageSquare },
    { id: "email", label: "Email (Gmail/Outlook)", icon: Mail },
    { id: "phone", label: "Phone System", icon: Phone },
    { id: "crm", label: "CRM (Salesforce, HubSpot)", icon: Users },
    { id: "helpdesk", label: "Current Helpdesk", icon: Settings },
    { id: "analytics", label: "Analytics Tools", icon: TrendingUp },
  ];

  const integrationOptions = [
    { id: "slack-notifications", label: "Slack Notifications" },
    { id: "email-sync", label: "Email Integration" },
    { id: "crm-sync", label: "CRM Data Sync" },
    { id: "knowledge-base", label: "Knowledge Base Import" },
    { id: "analytics", label: "Analytics & Reporting" },
    { id: "api-access", label: "API Access" },
  ];

  function toggleTool(toolId: string) {
    setIntegrations((prev) => ({
      ...prev,
      currentTools: prev.currentTools.includes(toolId)
        ? prev.currentTools.filter((id) => id !== toolId)
        : [...prev.currentTools, toolId],
    }));
  }

  function toggleIntegration(integrationId: string) {
    setIntegrations((prev) => ({
      ...prev,
      priorityIntegrations: prev.priorityIntegrations.includes(integrationId)
        ? prev.priorityIntegrations.filter((id) => id !== integrationId)
        : [...prev.priorityIntegrations, integrationId],
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPost(`/api/organizations/${organizationId}/integrations`, integrations);
      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Connect Your Tools</h3>
          <p className="text-gray-700">
            Tell us about your current tools so we can set up the right integrations and data imports.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Current Tools & Platforms</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {toolOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = integrations.currentTools.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleTool(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-4 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-[var(--fl-color-text-muted)]")}
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Priority Integrations</Label>
            <p className="mb-3 text-sm text-gray-600">Which integrations are most important for your workflow?</p>
            <div className="grid grid-cols-2 gap-3">
              {integrationOptions.map((option) => {
                const isSelected = integrations.priorityIntegrations.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleIntegration(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-3 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data Import Needs</Label>
            <Select
              value={integrations.dataImport}
              onValueChange={(value) => setIntegrations({ ...integrations, dataImport: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Do you need to import existing data?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No existing data to import</SelectItem>
                <SelectItem value="tickets">Historical tickets/conversations</SelectItem>
                <SelectItem value="customers">Customer database</SelectItem>
                <SelectItem value="knowledge-base">Knowledge base articles</SelectItem>
                <SelectItem value="all">All of the above</SelectItem>
                <SelectItem value="custom">Custom data migration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Our team will help you set up these integrations during your onboarding call. You can
            also configure them later in your dashboard.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            Skip for Now
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Technical Setup Step
function TechnicalSetupStep({ organizationId, onComplete, onSkip }: StepProps) {
  const [setup, setSetup] = useState({
    implementationType: "",
    technicalContact: "",
    launchTimeline: "",
    testingNeeds: [] as string[],
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const widgetCode = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${getAppUrl()}/widget.js';
    script.setAttribute('data-org-id', '${organizationId}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  const testingOptions = [
    { id: "staging", label: "Staging environment testing" },
    { id: "mobile", label: "Mobile responsiveness" },
    { id: "performance", label: "Performance impact" },
    { id: "accessibility", label: "Accessibility compliance" },
    { id: "integration", label: "Integration testing" },
    { id: "user-acceptance", label: "User acceptance testing" },
  ];

  function handleCopy() {
    void navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleTesting(testingId: string) {
    setSetup((prev) => ({
      ...prev,
      testingNeeds: prev.testingNeeds.includes(testingId)
        ? prev.testingNeeds.filter((id) => id !== testingId)
        : [...prev.testingNeeds, testingId],
    }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      await apiPost(`/api/organizations/${organizationId}/technical-setup`, setup);
      onComplete();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-sm">
      <CardContent className="space-y-6 spacing-8">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Technical Setup & Launch</h3>
          <p className="text-gray-700">Let's get Campfire installed on your website and plan your launch strategy.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Implementation Approach</Label>
              <Select
                value={setup.implementationType}
                onValueChange={(value) => setSetup({ ...setup, implementationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How will you implement?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self-service">Self-service installation</SelectItem>
                  <SelectItem value="developer">Our developer will handle it</SelectItem>
                  <SelectItem value="agency">Third-party agency/developer</SelectItem>
                  <SelectItem value="assisted">Need assistance from Campfire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Launch Timeline</Label>
              <Select
                value={setup.launchTimeline}
                onValueChange={(value) => setSetup({ ...setup, launchTimeline: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When do you want to go live?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As soon as possible</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="next-week">Next week</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="next-month">Next month</SelectItem>
                  <SelectItem value="flexible">Flexible timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Technical Contact Email (Optional)</Label>
            <Input
              type="email"
              placeholder="developer@company.com"
              value={setup.technicalContact}
              onChange={(e) => setSetup({ ...setup, technicalContact: e.target.value })}
            />
            <p className="text-sm text-gray-600">We'll send implementation details and support to this person</p>
          </div>

          <div>
            <Label className="text-base font-medium">Testing Requirements</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {testingOptions.map((option) => {
                const isSelected = setup.testingNeeds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleTesting(option.id)}
                    className={cn(
                      "rounded-ds-lg border-2 spacing-3 text-left transition-all",
                      isSelected
                        ? "bg-status-info-light border-brand-blue-500 text-blue-900"
                        : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                    )}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Widget Installation Code</Label>
            <p className="mb-3 text-sm text-gray-600">Add this code to your website to enable the chat widget</p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-ds-lg bg-neutral-900 spacing-4 text-sm text-neutral-100">
                <code>{widgetCode}</code>
              </pre>
              <Button size="sm" variant="secondary" onClick={handleCopy} className="absolute right-2 top-2">
                {copied ? (
                  <>
                    <Icon icon={CheckCircle2} className="mr-1 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Icon icon={Copy} className="mr-1 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-status-info-light rounded-ds-lg border bg-[var(--fl-color-info-subtle)] spacing-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Add this code just before the closing{" "}
              <code className="rounded bg-[var(--fl-color-info-subtle)] px-1">&lt;/body&gt;</code> tag on every page
              where you want the chat widget to appear.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            I'll Set This Up Later
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
            {loading ? (
              <>
                <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                Completing Setup...
              </>
            ) : (
              "Complete Onboarding"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
