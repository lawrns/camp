"use client";

import { LazyKnowledgeBaseDashboard } from "@/components/LazyComponents";
import { useAuth } from "@/hooks/useAuth";

function KnowledgeContent() {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  if (!organizationId) {
    return (
      <div className="container mx-auto flex items-center justify-center spacing-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="container mx-auto spacing-6">
        <LazyKnowledgeBaseDashboard organizationId={organizationId} className="w-full" />
      </div>
    </motion.div>
  );
}

export default function DashboardKnowledgePage() {
  return <KnowledgeContent />;
}
