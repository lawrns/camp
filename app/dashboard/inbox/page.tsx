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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InboxDashboard from "@/components/InboxDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/store/domains/organization";
import { Icon } from "@/lib/ui/Icon";
import {
  Clock,
  Warning as AlertCircle,
  Envelope,
  Users,
} from "@phosphor-icons/react";

interface InboxPageProps {}

// Helper function to get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function InboxPage(): JSX.Element {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const organization = useOrganization(); // This returns Organization | null directly
  const [userName, setUserName] = useState<string>("there");

  // Set user name when available
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name.split(" ")[0] || "there");
    } else if (user?.email) {
      setUserName(user.email.split("@")[0] || "there");
    }
  }, [user]);

  // Combined loading state (only auth loading since organization hook doesn't have loading state)
  const loading = authLoading;

  // Debug logging for development
  useEffect(() => {
    if (user && organization) {
      console.log("[InboxPage] User:", user);
      console.log("[InboxPage] Organization:", organization);
    }
  }, [user, organization]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading your inbox...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <Icon icon={AlertCircle} className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access your inbox.</p>
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Organization check
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <Icon icon={Users} className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900">Organization Required</h2>
            <p className="text-gray-600 mb-4">Please select or create an organization to access your inbox.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main inbox interface
  return (
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
        <InboxDashboard className="h-full w-full" />
      </div>
    </div>
  );
}
