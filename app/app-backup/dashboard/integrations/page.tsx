"use client";

import { useState } from "react";
import {
  ChartBar as BarChart3,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  Globe,
  Envelope as Mail,
  ChatCircle as MessageSquare,
  Plus,
  MagnifyingGlass as Search,
  Gear as Settings,
  Shield,
  Users,
  Lightning as Zap,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Switch } from "@/components/unified-ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "communication" | "productivity" | "analytics" | "crm" | "security";
  status: "connected" | "available" | "coming-soon";
  icon: unknown;
  features: string[];
  setupUrl?: string;
}

const integrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Get notifications and manage conversations directly in Slack",
    category: "communication",
    status: "available",
    icon: MessageSquare,
    features: ["Real-time notifications", "Conversation sync", "Team collaboration"],
    setupUrl: "/dashboard/integrations/slack",
  },
  {
    id: "email",
    name: "Email Integration",
    description: "Sync conversations with your email system",
    category: "communication",
    status: "connected",
    icon: Mail,
    features: ["Email sync", "Auto-replies", "Thread management"],
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect with 5000+ apps through Zapier automation",
    category: "productivity",
    status: "available",
    icon: Zap,
    features: ["Workflow automation", "5000+ app connections", "Custom triggers"],
    setupUrl: "/dashboard/integrations/zapier",
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description: "Track widget performance and user interactions",
    category: "analytics",
    status: "available",
    icon: BarChart3,
    features: ["Performance tracking", "User behavior", "Custom events"],
    setupUrl: "/dashboard/integrations/analytics",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync customer data and conversations with Salesforce CRM",
    category: "crm",
    status: "coming-soon",
    icon: Users,
    features: ["Contact sync", "Lead management", "Sales pipeline integration"],
  },
  {
    id: "webhooks",
    name: "Globes",
    description: "Custom webhooks for real-time data integration",
    category: "productivity",
    status: "available",
    icon: Globe,
    features: ["Real-time events", "Custom endpoints", "Flexible data format"],
    setupUrl: "/dashboard/integrations/webhooks",
  },
];

const categories = [
  { id: "all", name: "All Integrations", icon: Database },
  { id: "communication", name: "Communication", icon: MessageSquare },
  { id: "productivity", name: "Productivity", icon: Zap },
  { id: "analytics", name: "Analytics", icon: BarChart3 },
  { id: "crm", name: "CRM", icon: Users },
  { id: "security", name: "Security", icon: Shield },
];

export default function DashboardIntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { organization } = useOrganization();

  // Fetch real Slack integration configuration
  const {
    data: slackConfig,
    isLoading: slackLoading,
    refetch: refetchSlack,
  } = api.integrations.slack.getConfiguration.useQuery(
    { organizationId: organization?.id || "" },
    { enabled: !!organization?.id }
  );

  // Slack integration mutation
  const updateSlackSettings = api.integrations.slack.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Slack integration updated successfully");
      refetchSlack();
    },
    onError: (error) => {
      toast.error(`Failed to update Slack integration: ${(error instanceof Error ? error.message : String(error))}`);
    },
  });

  // Update integrations with real data
  const updatedIntegrations = integrations.map((integration) => {
    if (integration.id === "slack") {
      return {
        ...integration,
        status: slackConfig?.data?.isConfigured ? "connected" : "available",
      };
    }
    return integration;
  });

  const filteredIntegrations = updatedIntegrations.filter((integration: unknown) => {
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-[var(--fl-color-success-subtle)] text-green-800">
            <Icon icon={CheckCircle} className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        );
      case "available":
        return <Badge variant="outline">Available</Badge>;
      case "coming-soon":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Icon icon={Clock} className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>
        );
      default:
        return null;
    }
  };

  const connectedIntegrations = updatedIntegrations.filter((i: unknown) => i.status === "connected");
  const availableIntegrations = updatedIntegrations.filter((i: unknown) => i.status === "available");

  return (
    <div className="container mx-auto space-y-6 spacing-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-1 text-gray-600">Connect your favorite tools and streamline your workflow</p>
        </div>
        <Button leftIcon={<Icon icon={Plus} className="h-4 w-4" />}>
          Add Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connected</p>
                <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
              </div>
              <Icon icon={CheckCircle} className="text-semantic-success-dark h-8 w-8" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold">{availableIntegrations.length}</p>
              </div>
              <Icon icon={Cloud} className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="spacing-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Available</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Icon icon={Database} className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Icon icon={Search} className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories and Integrations */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:block">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map((integration) => {
                const IconComponent = integration.icon;
                return (
                  <Card key={integration.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-ds-lg bg-gray-100 spacing-2">
                            <IconComponent className="h-6 w-6 text-gray-700" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            {getStatusBadge(integration.status)}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="mt-2">{integration.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-gray-900">Features:</h4>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {integration.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <Icon icon={CheckCircle} className="text-semantic-success-dark h-3 w-3" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-3">
                          {integration.status === "connected" ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex flex-1 items-center justify-center gap-2"
                              >
                                <Icon icon={Settings} className="h-4 w-4" />
                                Configure
                              </Button>
                              <Switch defaultChecked className="flex-shrink-0" />
                            </>
                          ) : integration.status === "available" ? (
                            <Button size="sm" className="flex-1">
                              Connect
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled className="flex-1">
                              Coming Soon
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
