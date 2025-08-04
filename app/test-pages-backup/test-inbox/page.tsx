'use client';

import { InboxDashboard } from '@/components/inbox/InboxDashboard';
import { PerformanceMonitor } from '@/components/inbox/PerformanceMonitor';
import { AccessibilityTester } from '@/components/inbox/AccessibilityTester';

export default function TestInboxPage() {
  return (
    <div className="h-screen w-full">
      <AccessibilityTester>
        <div className="h-full">
          <InboxDashboard
            currentUserId="test-user-123"
            currentUserName="Test Agent"
            currentUserRole="agent"
          />
          <PerformanceMonitor showPanel={true} />
        </div>
      </AccessibilityTester>
    </div>
  );
} 