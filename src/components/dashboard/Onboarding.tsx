import React, { ForwardRefExoticComponent, RefAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Check,
  Code,
  FileText,
  Flame,
  MessageSquare,
  Palette,
  Settings,
  Sparkles,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/unified-ui/components/Card";
import { Dialog, DialogContent, DialogOverlay } from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Progress } from "@/components/unified-ui/components/Progress";
import { Switch } from "@/components/unified-ui/components/switch";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface OnboardingStepData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: ForwardRefExoticComponent<PhosphorIconProps & RefAttributes<SVGSVGElement>>;
  type: "welcome" | "feature" | "setup";
  completed: boolean;
  features?: string[];
  highlights?: string[];
}

const onboardingSteps: OnboardingStepData[] = [
  {
    id: 1,
    title: "Welcome to Campfire",
    subtitle: "Your AI-Powered Support Platform",
    description:
      "Discover how Campfire transforms customer support with autonomous AI agents that provide indistinguishable-from-human assistance.",
    icon: Flame,
    type: "welcome",
    completed: false,
    features: [
      "Autonomous RAG-powered responses",
      "Seamless human-AI handover",
      "Real-time collaboration tools",
      "Advanced analytics & insights",
    ],
  },
  {
    id: 2,
    title: "Autonomous RAG Platform",
    subtitle: "AI That Knows Your Business",
    description:
      "Our Retrieval-Augmented Generation system learns from your knowledge base to provide accurate, contextual responses automatically.",
    icon: Brain,
    type: "feature",
    completed: false,
    highlights: ["Instant knowledge retrieval", "Context-aware responses", "Continuous learning", "95%+ accuracy rate"],
  },
  {
    id: 3,
    title: "AI Handover & Personas",
    subtitle: "Seamless Human-AI Collaboration",
    description:
      "Configure AI personas that match your brand voice and set up intelligent handover rules for complex queries.",
    icon: Bot,
    type: "feature",
    completed: false,
    highlights: [
      "Custom AI personalities",
      "Smart escalation rules",
      "Confidence-based routing",
      "Invisible transitions",
    ],
  },
  {
    id: 4,
    title: "Knowledge Base Integration",
    subtitle: "Power Your AI with Your Content",
    description:
      "Upload documents, create articles, and build a comprehensive knowledge base that your AI agents can instantly access.",
    icon: FileText,
    type: "feature",
    completed: false,
    highlights: ["Document upload & parsing", "Auto-categorization", "Version control", "Real-time updates"],
  },
  {
    id: 5,
    title: "Team Collaboration",
    subtitle: "Work Better Together",
    description:
      "Invite team members, assign roles, and collaborate in real-time with shared conversations and unified workflows.",
    icon: Users,
    type: "feature",
    completed: false,
    highlights: [
      "Role-based permissions",
      "Real-time collaboration",
      "Shared conversation history",
      "Team performance metrics",
    ],
  },
  {
    id: 6,
    title: "Widget Customization",
    subtitle: "Match Your Brand",
    description:
      "Customize your chat widget's appearance, behavior, and integration to perfectly match your website and brand.",
    icon: Palette,
    type: "setup",
    completed: false,
    highlights: ["Brand color matching", "Custom positioning", "Behavior settings", "Mobile optimization"],
  },
];

interface OnboardingProps {
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
}

export function Onboarding({ isOpen = true, onClose, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { user } = useAuth();

  // Prevent hydration mismatch by only showing modal on client
  useEffect(() => {
    setIsClient(true);
    setShowModal(isOpen);
  }, [isOpen]);

  const currentStepData = useMemo(() => onboardingSteps.find((step) => step.id === currentStep), [currentStep]);
  const totalSteps = onboardingSteps.length;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, totalSteps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    // Store completion status in localStorage (only on client)
    if (typeof window !== "undefined") {
      localStorage.setItem("campfire-onboarding-completed", "true");
    }

    const timer = setTimeout(() => {
      setShowModal(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setShowModal(false);
    onClose?.();
  }, [onClose]);

  const handleStepClick = useCallback((stepId: number) => {
    setCurrentStep(stepId);
  }, []);

  // Don't render on server to prevent hydration mismatch
  if (!isClient || !showModal) return null;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="h-[90vh] w-full max-w-4xl gap-0 border-0 bg-transparent p-0 shadow-none">
        <OptimizedMotion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative h-full w-full"
        >
          {/* Glass morphism container */}
          <div className="relative h-full w-full overflow-hidden radius-2xl">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />

            {/* Glass effect overlay */}
            <div className="bg-background/70 absolute inset-0 radius-2xl border border-white/20 shadow-2xl backdrop-blur-xl" />

            {/* Content */}
            <div className="relative z-10 flex h-full">
              {/* Sidebar with step navigation */}
              <div className="bg-background/40 flex w-80 flex-col border-r border-white/30 p-spacing-md backdrop-blur-sm">
                {/* Header */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-ds-xl bg-gradient-to-r from-blue-600 to-blue-700">
                      <Icon icon={Flame} className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Campfire</h2>
                      <p className="text-foreground text-sm">Setup Guide</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-spacing-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">Progress</span>
                      <span className="font-medium text-gray-900">
                        {currentStep}/{totalSteps}
                      </span>
                    </div>
                    <Progress value={(currentStep / totalSteps) * 100} className="bg-background/50 h-2" />
                  </div>
                </div>

                {/* Step navigation */}
                <div className="flex-1 space-y-spacing-sm">
                  {onboardingSteps.map((step, index) => (
                    <OptimizedMotion.button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      className={cn(
                        "w-full rounded-ds-xl spacing-3 text-left transition-all duration-200",
                        currentStep === step.id
                          ? "bg-status-info-light border-status-info-light border shadow-sm"
                          : "border border-transparent hover:bg-white/50"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-ds-lg transition-colors",
                            currentStep === step.id
                              ? "bg-blue-600 text-white"
                              : currentStep > step.id
                                ? "bg-status-success-light text-semantic-success-dark"
                                : "bg-neutral-100 text-neutral-400"
                          )}
                        >
                          {currentStep > step.id ? (
                            <Icon icon={Check} className="h-4 w-4" />
                          ) : step.icon ? (
                            React.createElement(step.icon, { className: "w-4 h-4" })
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-typography-sm truncate font-medium",
                              currentStep === step.id ? "text-blue-900" : "text-gray-700"
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="truncate text-tiny text-[var(--fl-color-text-muted)]">{step.subtitle}</p>
                        </div>
                      </div>
                    </OptimizedMotion.button>
                  ))}
                </div>

                {/* Footer actions */}
                <div className="mt-6 border-t border-white/30 pt-6">
                  <Button variant="ghost" onClick={handleSkip} className="text-foreground w-full hover:text-gray-800">
                    Skip for now
                  </Button>
                </div>
              </div>

              {/* Main content area */}
              <div className="flex flex-1 flex-col">
                {/* Close button */}
                <div className="absolute right-6 top-6 z-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="hover:bg-background/80 h-8 w-8 rounded-ds-full bg-background/50 p-0 backdrop-blur-sm"
                  >
                    <Icon icon={X} className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step content */}
                <div className="flex-1 overflow-y-auto p-spacing-lg">
                  <OptimizedAnimatePresence mode="wait">
                    <OptimizedMotion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex h-full flex-col"
                    >
                      {currentStepData && (
                        <>
                          {/* Step header */}
                          <div className="mb-8">
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-16 w-16 items-center justify-center radius-2xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-card-deep">
                                {React.createElement(currentStepData.icon, { className: "w-8 h-8 text-white" })}
                              </div>
                              <div>
                                <h1 className="mb-2 text-3xl font-bold text-gray-900">{currentStepData.title}</h1>
                                <p className="text-base font-medium text-blue-600">{currentStepData.subtitle}</p>
                              </div>
                            </div>
                            <p className="leading-relaxed text-foreground max-w-2xl text-base">
                              {currentStepData.description}
                            </p>
                          </div>

                          {/* Step-specific content */}
                          <div className="flex-1">
                            {currentStepData.type === "welcome" && <WelcomeStep step={currentStepData} user={user} />}
                            {currentStepData.type === "feature" && <FeatureStep step={currentStepData} />}
                            {currentStepData.type === "setup" && <SetupStep step={currentStepData} />}
                          </div>
                        </>
                      )}
                    </OptimizedMotion.div>
                  </OptimizedAnimatePresence>
                </div>

                {/* Navigation footer */}
                <div className="bg-background/30 border-t border-white/30 p-spacing-md backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 1} className="gap-ds-2">
                      <Icon icon={ArrowLeft} className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-ds-2">
                      {onboardingSteps.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "h-2 w-2 rounded-ds-full transition-colors",
                            index + 1 <= currentStep ? "bg-blue-600" : "bg-gray-300"
                          )}
                        />
                      ))}
                    </div>

                    <Button
                      onClick={handleNext}
                      className="gap-ds-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      {currentStep === totalSteps ? "Complete Setup" : "Next"}
                      <Icon icon={ArrowRight} className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </OptimizedMotion.div>
      </DialogContent>
    </Dialog>
  );
}

// Welcome step component
function WelcomeStep({ step, user }: { step: { features?: string[] }; user: { email?: string } | null }) {
  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div className="radius-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-spacing-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-gradient-to-r from-blue-600 to-blue-700">
            <Icon icon={Sparkles} className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Welcome, {(user?.email && typeof user.email === "string" ? user.email.split("@")[0] : null) || "Agent"}!
            </h3>
            <p className="text-blue-600">Ready to transform your customer support?</p>
          </div>
        </div>
        <p className="text-foreground">
          You're about to experience the future of customer support. Campfire's AI agents work alongside your team to
          provide instant, accurate responses that your customers will love.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 gap-3">
        {step.features?.map((feature: string, index: number) => (
          <OptimizedMotion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="hover:bg-background/80 rounded-ds-xl border border-white/40 bg-background/60 spacing-3 backdrop-blur-sm transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-ds-lg bg-[var(--fl-color-success-subtle)]">
                <Icon icon={Check} className="text-semantic-success-dark h-4 w-4" />
              </div>
              <span className="font-medium text-gray-900">{feature}</span>
            </div>
          </OptimizedMotion.div>
        ))}
      </div>

      {/* Stats preview */}
      <div className="bg-background/60 radius-2xl border border-white/40 p-spacing-md backdrop-blur-sm">
        <h4 className="mb-4 font-bold text-gray-900">What to expect:</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="mb-1 text-3xl font-bold text-blue-600">95%</div>
            <div className="text-foreground text-sm">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-semantic-success-dark mb-1 text-3xl font-bold">&lt; 2s</div>
            <div className="text-foreground text-sm">Response Time</div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-3xl font-bold text-blue-600">24/7</div>
            <div className="text-foreground text-sm">Availability</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature step component
function FeatureStep({ step }: { step: OnboardingStepData }) {
  return (
    <div className="space-y-6">
      {/* Feature highlights */}
      <div className="grid grid-cols-2 gap-3">
        {step.highlights?.map((highlight: string, index: number) => (
          <OptimizedMotion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="hover:bg-background/80 rounded-ds-xl border border-white/40 bg-background/60 spacing-3 backdrop-blur-sm transition-all hover:scale-105"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
                <div className="bg-primary h-2 w-2 rounded-ds-full" />
              </div>
              <span className="font-medium text-gray-900">{highlight}</span>
            </div>
          </OptimizedMotion.div>
        ))}
      </div>

      {/* Interactive demo area */}
      <div className="radius-2xl border border-white/40 bg-gradient-to-br from-white/80 to-gray-50/80 p-spacing-md backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-ds-lg bg-[var(--fl-color-info-subtle)]">
            {step.icon ? (
              React.createElement(step.icon, { className: "w-4 h-4 text-blue-600" })
            ) : (
              <div className="h-4 w-4" />
            )}
          </div>
          <h4 className="font-bold text-gray-900">See it in action</h4>
        </div>

        {step.id === 2 && <RAGDemo />}
        {step.id === 3 && <HandoverDemo />}
        {step.id === 4 && <KnowledgeDemo />}
        {step.id === 5 && <CollaborationDemo />}
      </div>
    </div>
  );
}

// Setup step component
function SetupStep({ step }: { step: OnboardingStepData }) {
  return (
    <div className="space-y-6">
      {/* Setup options */}
      <div className="grid grid-cols-2 gap-3">
        {step.highlights?.map((highlight: string, index: number) => (
          <OptimizedMotion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-background/60 rounded-ds-xl border border-white/40 spacing-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]">
                <Icon icon={Settings} className="h-3 w-3 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">{highlight}</span>
            </div>
          </OptimizedMotion.div>
        ))}
      </div>

      {/* Quick setup form */}
      <div className="bg-background/60 radius-2xl border border-white/40 p-spacing-md backdrop-blur-sm">
        <h4 className="mb-4 font-bold text-gray-900">Quick Setup</h4>
        <div className="space-y-3">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                defaultValue="#4f46e5"
                className="border-ds-border-strong h-10 w-12 cursor-pointer rounded-ds-lg border"
              />
              <Input placeholder="#4f46e5" className="flex-1" />
            </div>
          </div>
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">Widget Position</label>
            <div className="grid grid-cols-2 gap-ds-2">
              <Button variant="outline" className="justify-start">
                Bottom Right
              </Button>
              <Button variant="outline" className="justify-start">
                Bottom Left
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo components for interactive features
const RAGDemo = React.memo(function RAGDemo() {
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([{ type: "user", text: "How do I reset my password?" }]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: 'I can help you reset your password! You can do this by clicking "Forgot Password" on the login page, or I can send you a reset link right now. Which would you prefer?',
          },
        ]);
      }, 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isClient]);

  return (
    <div className="bg-background max-w-md rounded-ds-xl border border-[var(--fl-color-border)] spacing-3">
      <div className="space-y-3">
        {messages.map((message, index) => (
          <div key={index} className={cn("flex", message.type === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "text-typography-sm max-w-[80%] rounded-ds-lg px-3 py-2",
                message.type === "user" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-900"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-background rounded-ds-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400" />
                <div
                  className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-ds-full bg-neutral-400"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const HandoverDemo = React.memo(function HandoverDemo() {
  const [step, setStep] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(timer);
  }, [isClient]);

  const steps = [
    { label: "AI Handling", color: "bg-[var(--fl-color-info-subtle)]0", icon: Bot },
    { label: "Confidence Check", color: "bg-orange-500", icon: Brain },
    { label: "Human Takeover", color: "bg-[var(--fl-color-success-subtle)]0", icon: Users },
  ];

  return (
    <div className="flex max-w-md items-center justify-between">
      {steps.map((stepData, index) => {
        const Icon = stepData.icon;
        return (
          <div key={index} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-ds-full text-white transition-all duration-500",
                index === step ? stepData.color : "bg-gray-300",
                index === step && "scale-110 shadow-lg"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span
              className={cn(
                "text-typography-xs mt-2 transition-colors",
                index === step ? "font-medium text-neutral-900" : "text-[var(--fl-color-text-muted)]"
              )}
            >
              {stepData.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className="absolute mt-6 h-0.5 w-16 bg-gray-300"
                style={{ left: "50%", transform: "translateX(-50%)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

const KnowledgeDemo = React.memo(function KnowledgeDemo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Array<{ title: string; relevance: number }>>([]);

  const mockResults = [
    { title: "Password Reset Guide", relevance: 95 },
    { title: "Account Security FAQ", relevance: 87 },
    { title: "Login Troubleshooting", relevance: 82 },
  ];

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        setResults(mockResults);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
    return undefined;
  }, [searchTerm]);

  return (
    <div className="max-w-md space-y-3">
      <Input
        placeholder="Search knowledge base..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      {results.length > 0 && (
        <div className="space-y-spacing-sm">
          {results.map((result, index) => (
            <OptimizedMotion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background flex items-center justify-between rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm"
            >
              <span className="text-sm font-medium">{result.title}</span>
              <Badge variant="secondary" className="text-tiny">
                {result.relevance}% match
              </Badge>
            </OptimizedMotion.div>
          ))}
        </div>
      )}
    </div>
  );
});

const CollaborationDemo = React.memo(function CollaborationDemo() {
  const [activeUsers] = useState([
    { name: "Sarah", status: "online", avatar: "👩‍💼" },
    { name: "Mike", status: "busy", avatar: "👨‍💻" },
    { name: "Alex", status: "away", avatar: "👨‍🎨" },
  ]);

  return (
    <div className="max-w-md">
      <h5 className="mb-3 text-sm font-medium text-gray-900">Team Members Online</h5>
      <div className="space-y-spacing-sm">
        {activeUsers.map((user, index) => (
          <OptimizedMotion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-background flex items-center gap-3 rounded-ds-lg border border-[var(--fl-color-border)] p-spacing-sm"
          >
            <div className="text-base">{user.avatar}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-tiny capitalize text-[var(--fl-color-text-muted)]">{user.status}</div>
            </div>
            <div
              className={cn(
                "h-2 w-2 rounded-ds-full",
                user.status === "online"
                  ? "bg-semantic-success"
                  : user.status === "busy"
                    ? "bg-brand-mahogany-500"
                    : "bg-semantic-warning"
              )}
            />
          </OptimizedMotion.div>
        ))}
      </div>
    </div>
  );
});
