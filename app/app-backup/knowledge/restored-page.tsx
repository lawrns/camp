"use client";

import KnowledgeBasePage from "@/app/dashboard/knowledge/page";
import { KnowledgeErrorBoundary } from "@/components/error/KnowledgeErrorBoundary";

/**
 * Restored Knowledge Base Page
 *
 * This page restores the full knowledge base functionality from the disabled dashboard.
 * It includes error boundaries and proper authentication handling.
 */
export default function RestoredKnowledgePage() {
  return (
    <KnowledgeErrorBoundary>
      <KnowledgeBasePage />
    </KnowledgeErrorBoundary>
  );
}
