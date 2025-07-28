'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
  delay?: number;
}

export function FeatureCard({
  title,
  description,
  icon,
  features,
  badge,
  ctaText = 'Learn More',
  ctaLink = '#',
  className,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      <Card className="h-full group hover:shadow-lg transition-all duration-300 border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features List */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.1 + (index * 0.1) }}
                className="flex items-start space-x-3"
              >
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href={ctaLink}>
              <Button 
                variant="outline" 
                className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900 transition-colors duration-300"
              >
                {ctaText}
                <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Preset feature cards for common use cases
export function AIFeatureCard({ delay = 0 }: { delay?: number }) {
  return (
    <FeatureCard
      title="Intelligent AI Assistant"
      description="Advanced AI that understands context, learns from interactions, and provides accurate, helpful responses to customer inquiries."
      icon={
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      }
      features={[
        'Natural language understanding with GPT-4 and Claude',
        'Context-aware responses based on conversation history',
        'Multi-language support for global customers',
        'Continuous learning from customer interactions',
        'Integration with knowledge base and documentation'
      ]}
      badge="AI-Powered"
      ctaText="Explore AI Features"
      ctaLink="/features/ai"
      delay={delay}
    />
  );
}

export function HandoffFeatureCard({ delay = 0 }: { delay?: number }) {
  return (
    <FeatureCard
      title="Seamless Human Handoff"
      description="Smart escalation system that knows when to transfer conversations to human agents while preserving full context."
      icon={
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      features={[
        'Intelligent escalation triggers based on sentiment and complexity',
        'Complete conversation context preservation',
        'Agent availability and workload balancing',
        'Priority-based queue management',
        'Real-time handoff notifications and alerts'
      ]}
      badge="Smart Routing"
      ctaText="Learn About Handoffs"
      ctaLink="/features/handoff"
      delay={delay}
    />
  );
}

export function IntegrationFeatureCard({ delay = 0 }: { delay?: number }) {
  return (
    <FeatureCard
      title="Multi-Channel Integration"
      description="Connect all your customer touchpoints in one unified platform with seamless integrations across channels."
      icon={
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      }
      features={[
        'Email, chat, Slack, and API integrations',
        'Unified customer conversation history',
        'Cross-channel context preservation',
        'Custom webhook and API endpoints',
        'Third-party CRM and helpdesk sync'
      ]}
      badge="Connected"
      ctaText="View Integrations"
      ctaLink="/integrations"
      delay={delay}
    />
  );
}

export function AnalyticsFeatureCard({ delay = 0 }: { delay?: number }) {
  return (
    <FeatureCard
      title="Real-Time Analytics"
      description="Comprehensive insights into customer satisfaction, AI performance, and support team efficiency with actionable metrics."
      icon={
        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
      features={[
        'Customer satisfaction scores and sentiment analysis',
        'AI response accuracy and performance metrics',
        'Agent productivity and workload analytics',
        'Response time and resolution rate tracking',
        'Custom dashboards and automated reports'
      ]}
      badge="Data-Driven"
      ctaText="See Analytics"
      ctaLink="/features/analytics"
      delay={delay}
    />
  );
}