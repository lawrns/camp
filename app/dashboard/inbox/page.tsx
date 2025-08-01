/**
 * Inbox Management Dashboard
 *
 * Comprehensive interface for managing customer conversations:
 * - Real-time conversation listing and management
 * - Message threading and conversation history
 * - AI-powered response suggestions and automation
 * - Agent assignment and handover functionality
 * - Status indicators and priority management
 * - Search and filtering capabilities
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { InboxDashboard } from "@/components/InboxDashboard/index";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";
import { Envelope } from "@phosphor-icons/react";

interface InboxPageProps {}

// Helper function to get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function InboxPage(): JSX.Element {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("there");

  // Set user name when available
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name.split(" ")[0] || "there");
    } else if (user?.email) {
      setUserName(user.email.split("@")[0] || "there");
    }
  }, [user]);

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        {/* Header Section */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {userName}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage customer conversations and support requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon icon={Envelope} className="h-4 w-4" />
                <span>Inbox</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inbox Dashboard Component */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading inbox...</div>}>
            <InboxDashboard
              currentUserId={user?.id || ''}
              currentUserName={userName}
              currentUserRole="agent"
              className="h-full w-full"
            />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
}
