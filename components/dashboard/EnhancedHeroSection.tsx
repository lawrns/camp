"use client";

import { Sparkles, Users, Clock, Star } from "lucide-react";
import { Card, CardContent } from '@/components/unified-ui/components/Card';
import { useAuth } from '@/hooks/useAuth';

interface EnhancedHeroSectionProps {
  metrics: {
    conversations: number;
    responseTime: string;
    satisfaction: string;
    resolvedToday: number;
    pendingConversations?: number;
  };
  userName?: string;
}

export function EnhancedHeroSection({ metrics, userName }: EnhancedHeroSectionProps) {
  const { user } = useAuth();
  const displayName = userName || user?.firstName || user?.email?.split('@')[0] || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGoalProgress = () => {
    const goal = 25; // Daily goal
    const progress = Math.min(metrics.resolvedToday, goal);
    const percentage = (progress / goal) * 100;
    return { progress, goal, percentage };
  };

  const { progress, goal, percentage } = getGoalProgress();

  return (
    <div className="hero-welcome bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 rounded-2xl p-6 md:p-8 mb-8 border border-blue-100 dark:border-blue-800 animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in-left">
            {getGreeting()}, {displayName}! 👋
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 animate-fade-in-left delay-200">
            Ready to help customers today? You have {metrics.pendingConversations || 0} conversations waiting.
          </p>
          
          {/* Quick stats row */}
          <div className="flex flex-wrap gap-4 mt-4 animate-fade-in-up delay-400">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{metrics.conversations} active conversations</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Avg {metrics.responseTime} response time</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Star className="w-4 h-4 text-yellow-600" />
              <span>{metrics.satisfaction} satisfaction</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 animate-scale-in delay-600">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today's Goal</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {progress}/{goal}
            </p>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-scale-in-x"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
} 