"use client";

import { Sparkle, TrendUp, Warning, CheckCircle, Lightbulb, Target } from '@phosphor-icons/react';
import { Badge } from '@/components/unified-ui/components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/unified-ui/components/Card';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AIInsightsPanelProps {
  metrics: {
    conversations: number;
    responseTime: string;
    satisfaction: string;
    resolvedToday: number;
    pendingConversations?: number;
  };
  organizationId?: string;
}

interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'recommendation' | 'goal';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    href: string;
  };
  priority: 'high' | 'medium' | 'low';
}

const insightConfig = {
  positive: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  warning: {
    icon: Warning,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  goal: {
    icon: Target,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
};

export function AIInsightsPanel({ metrics, organizationId }: AIInsightsPanelProps) {
  const router = useRouter();

  // Generate insights based on metrics
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // Performance insights
    if (metrics.resolvedToday > 20) {
      insights.push({
        id: 'high-performance',
        type: 'positive',
        title: 'Excellent Performance Today',
        description: `You've resolved ${metrics.resolvedToday} conversations today, exceeding your daily goal!`,
        icon: CheckCircle,
        priority: 'high',
      });
    }

    if (metrics.resolvedToday < 10) {
      insights.push({
        id: 'low-performance',
        type: 'warning',
        title: 'Below Target Performance',
        description: 'You\'ve resolved fewer conversations than usual. Consider checking your workflow.',
        icon: Warning,
        action: {
          label: 'View Analytics',
          href: '/dashboard/analytics',
        },
        priority: 'high',
      });
    }

    // Response time insights
    const responseTimeNum = parseFloat(metrics.responseTime.replace('s', ''));
    if (responseTimeNum > 300) {
      insights.push({
        id: 'slow-response',
        type: 'warning',
        title: 'Response Time Alert',
        description: `Your average response time is ${metrics.responseTime}, which is above the target.`,
        icon: Warning,
        action: {
          label: 'Optimize Workflow',
          href: '/dashboard/inbox',
        },
        priority: 'medium',
      });
    } else if (responseTimeNum < 120) {
      insights.push({
        id: 'fast-response',
        type: 'positive',
        title: 'Great Response Time',
        description: `Your average response time of ${metrics.responseTime} is excellent!`,
        icon: CheckCircle,
        priority: 'medium',
      });
    }

    // Satisfaction insights
    const satisfactionNum = parseFloat(metrics.satisfaction.replace('%', ''));
    if (satisfactionNum < 80) {
      insights.push({
        id: 'low-satisfaction',
        type: 'warning',
        title: 'Customer Satisfaction Alert',
        description: `Your satisfaction rate of ${metrics.satisfaction} needs improvement.`,
        icon: Warning,
        action: {
          label: 'Review Conversations',
          href: '/dashboard/inbox',
        },
        priority: 'high',
      });
    } else if (satisfactionNum > 95) {
      insights.push({
        id: 'high-satisfaction',
        type: 'positive',
        title: 'Outstanding Satisfaction',
        description: `Your satisfaction rate of ${metrics.satisfaction} is exceptional!`,
        icon: CheckCircle,
        priority: 'medium',
      });
    }

    // Workload insights
    if (metrics.pendingConversations && metrics.pendingConversations > 15) {
      insights.push({
        id: 'high-workload',
        type: 'warning',
        title: 'High Workload Alert',
        description: `You have ${metrics.pendingConversations} pending conversations. Consider team assistance.`,
        icon: Warning,
        action: {
          label: 'Request Help',
          href: '/dashboard/team',
        },
        priority: 'high',
      });
    }

    // AI recommendations
    insights.push({
      id: 'ai-recommendation',
      type: 'recommendation',
      title: 'AI-Powered Suggestion',
      description: 'Enable AI handover for complex technical queries to improve response time.',
      icon: Lightbulb,
      action: {
        label: 'Configure AI',
        href: '/dashboard/settings',
      },
      priority: 'medium',
    });

    // Goal tracking
    const goalProgress = (metrics.resolvedToday / 25) * 100;
    if (goalProgress < 50) {
      insights.push({
        id: 'goal-progress',
        type: 'goal',
        title: 'Daily Goal Progress',
        description: `You're ${goalProgress.toFixed(0)}% toward your daily goal of 25 resolved conversations.`,
        icon: Target,
        action: {
          label: 'View Goals',
          href: '/dashboard/analytics',
        },
        priority: 'medium',
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const insights = generateInsights();

  const handleActionClick = (href: string) => {
    router.push(href);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle className="w-5 h-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No insights available</p>
            </div>
          ) : (
            insights.map((insight, index) => {
              const config = insightConfig[insight.type];
              const InsightIcon = insight.icon;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${config.bg}`}>
                      <InsightIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-gray-900">
                          {insight.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                            insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {insight.description}
                      </p>
                      
                      {insight.action && (
                        <button
                          onClick={() => handleActionClick(insight.action!.href)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {insight.action.label} →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
} 