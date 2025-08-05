"use client";

import { useEffect, useState } from "react";
import { AlertTriangle as AlertCircle, Brain, Clock, Globe, Spinner as Loader2, TrendUp as TrendingUp, Users,  } from "lucide-react";
import { Button } from "@/components/ui/Button-unified";
import { Checkbox } from "@/components/unified-ui/components/checkbox";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { apiGet, apiPost } from "@/lib/utils/api-client";

interface ChallengesData {
  primaryChallenges: string[];
  responseTimeCurrent: string;
  customerSatisfactionCurrent: string;
  teamBurnoutLevel: string;
  specificPainPoints: string;
}

interface ChallengesStepProps {
  organizationId: string;
  onComplete: (data?: unknown) => void;
  onSkip: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const challengeOptions = [
  { id: "response-time", label: "Slow response times", icon: Clock },
  { id: "volume", label: "High ticket volume", icon: TrendingUp },
  { id: "consistency", label: "Inconsistent responses", icon: AlertCircle },
  { id: "knowledge", label: "Knowledge management", icon: Brain },
  { id: "handoffs", label: "Complex escalations", icon: Users },
  { id: "availability", label: "24/7 coverage", icon: Globe },
];

const responseTimeOptions = [
  { value: "under-1h", label: "Under 1 hour" },
  { value: "1-4h", label: "1-4 hours" },
  { value: "4-24h", label: "4-24 hours" },
  { value: "1-3d", label: "1-3 days" },
  { value: "over-3d", label: "Over 3 days" },
];

const satisfactionOptions = [
  { value: "excellent", label: "Excellent (90%+)" },
  { value: "good", label: "Good (80-89%)" },
  { value: "fair", label: "Fair (70-79%)" },
  { value: "poor", label: "Poor (60-69%)" },
  { value: "very-poor", label: "Very Poor (<60%)" },
  { value: "unknown", label: "Don't know" },
];

const burnoutOptions = [
  { value: "low", label: "Low - Team is energized" },
  { value: "moderate", label: "Moderate - Some stress" },
  { value: "high", label: "High - Team is overwhelmed" },
  { value: "critical", label: "Critical - High turnover" },
];

export function ChallengesStep({ organizationId, onComplete, onSkip, onBack, isLoading }: ChallengesStepProps) {
  const [challenges, setChallenges] = useState<ChallengesData>({
    primaryChallenges: [],
    responseTimeCurrent: "",
    customerSatisfactionCurrent: "",
    teamBurnoutLevel: "",
    specificPainPoints: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadExistingData();
  }, [organizationId]);

  const loadExistingData = async () => {
    try {
      const response = await apiGet("/api/onboarding/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setChallenges({
            primaryChallenges: data.profile.primary_challenges || [],
            responseTimeCurrent: data.profile.response_time_current || "",
            customerSatisfactionCurrent: data.profile.customer_satisfaction_current || "",
            teamBurnoutLevel: data.profile.team_burnout_level || "",
            specificPainPoints: data.profile.specific_pain_points || "",
          });
        }
      }
    } catch (error) {
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleChallenge = (challengeId: string) => {
    setChallenges((prev) => ({
      ...prev,
      primaryChallenges: prev.primaryChallenges.includes(challengeId)
        ? prev.primaryChallenges.filter((id: unknown) => id !== challengeId)
        : [...prev.primaryChallenges, challengeId],
    }));
  };

  const updateChallenges = (field: keyof ChallengesData, value: string) => {
    setChallenges((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await apiPost("/api/onboarding/profile", challenges);

      if (response.ok) {
        onComplete(challenges);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon icon={Loader2} className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-foreground">Loading challenges data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">What are your biggest support challenges?</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {challengeOptions.map((challenge: unknown) => {
            const Icon = challenge.icon;
            const isSelected = challenges.primaryChallenges.includes(challenge.id);

            return (
              <div
                key={challenge.id}
                className={`cursor-pointer rounded-ds-lg border-2 spacing-4 transition-all ${
                  isSelected
                    ? "border-[var(--fl-color-brand)] bg-[var(--fl-color-info-subtle)]"
                    : "border-[var(--fl-color-border)] hover:border-[var(--fl-color-border-strong)]"
                }`}
                onClick={() => toggleChallenge(challenge.id)}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox checked={isSelected} onChange={() => {}} />
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{challenge.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-spacing-sm">
          <Label>Current Response Time</Label>
          <Select
            value={challenges.responseTimeCurrent}
            onValueChange={(value: string) => updateChallenges("responseTimeCurrent", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select current response time" />
            </SelectTrigger>
            <SelectContent>
              {responseTimeOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-spacing-sm">
          <Label>Customer Satisfaction</Label>
          <Select
            value={challenges.customerSatisfactionCurrent}
            onValueChange={(value: string) => updateChallenges("customerSatisfactionCurrent", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select satisfaction level" />
            </SelectTrigger>
            <SelectContent>
              {satisfactionOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-spacing-sm">
          <Label>Team Burnout Level</Label>
          <Select
            value={challenges.teamBurnoutLevel}
            onValueChange={(value: string) => updateChallenges("teamBurnoutLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select burnout level" />
            </SelectTrigger>
            <SelectContent>
              {burnoutOptions.map((option: unknown) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-spacing-sm">
        <Label htmlFor="specificPainPoints">Specific Pain Points</Label>
        <Textarea
          id="specificPainPoints"
          placeholder="Describe any specific challenges or pain points your team faces..."
          value={challenges.specificPainPoints}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateChallenges("specificPainPoints", e.target.value)
          }
          rows={4}
        />
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
          onClick={handleSave}
          disabled={loading || isLoading}
          className="bg-primary flex-1 text-white hover:bg-blue-700"
        >
          {loading || isLoading ? (
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
