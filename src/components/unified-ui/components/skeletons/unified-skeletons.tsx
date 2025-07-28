import React from "react";

export const ConversationListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-3 spacing-3">
        <div className="h-10 w-10 animate-pulse rounded-ds-full bg-gray-200" />
        <div className="flex-1 space-y-spacing-sm">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);

export const MessageListSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="h-8 w-8 animate-pulse rounded-ds-full bg-gray-200" />
        <div className="flex-1 space-y-spacing-sm">
          <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-ds-lg bg-gray-200" />
      ))}
    </div>
    <div className="h-64 animate-pulse rounded-ds-lg bg-gray-200" />
  </div>
);

// Add the missing InboxDashboardSkeletonV2 component
export const InboxDashboardSkeletonV2: React.FC = () => (
  <div className="space-y-3">
    <div className="h-10 animate-pulse rounded bg-gray-200" />
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 spacing-3">
          <div className="h-10 w-10 animate-pulse rounded-ds-full bg-gray-200" />
          <div className="flex-1 space-y-spacing-sm">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
