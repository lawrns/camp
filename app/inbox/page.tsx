'use client';

import React from 'react';
import { AuthGuard } from '@/lib/auth/auth-guard';
import UnifiedInboxDashboard from '@/components/inbox/UnifiedInboxDashboard';

export default function InboxPage() {
  return (
    <AuthGuard requireAuth={false} requireOrganization={false}>
      <div className="h-screen w-full">
        <UnifiedInboxDashboard className="h-full w-full" />
      </div>
    </AuthGuard>
  );
}