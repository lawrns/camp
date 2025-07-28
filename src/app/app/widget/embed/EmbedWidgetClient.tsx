"use client";

import React, { useEffect, useState } from "react";
import { WidgetProvider } from "@/components/widget/index";
import { Panel } from "@/components/widget/Panel";
import { Button } from "@/components/widget/Button";
import { z } from "zod";
import { widgetLogger } from "@/lib/utils/logger";

// Validation schemas for URL parameters
const organizationIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const conversationIdSchema = z.string().uuid().optional();
const userIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .optional();
const debugSchema = z.boolean().optional();

// Sanitize and validate URL parameter
function sanitizeParam(param: string | string[] | undefined, schema: z.ZodSchema): any {
  try {
    let value: string | undefined;
    if (typeof param === "string") {
      value = param;
    } else if (Array.isArray(param) && param.length > 0) {
      value = param[0];
    }

    if (!value) return undefined;

    // Basic sanitization - remove potentially dangerous characters
    const sanitized = value.replace(/[<>"'&]/g, "");

    return schema.parse(sanitized);
  } catch (error) {
    widgetLogger.warn("Invalid parameter:", param, error);
    return undefined;
  }
}

interface EmbedWidgetClientProps {
  searchParamsObj: Record<string, string | string[] | undefined>;
}

export function EmbedWidgetClient({ searchParamsObj }: EmbedWidgetClientProps) {
  const [organizationId, setOrganizationId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [debug, setDebug] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    // Extract and validate organizationId from search params
    const orgIdParam = searchParamsObj.orgId || searchParamsObj.organizationId;
    const validatedOrgId = sanitizeParam(orgIdParam, organizationIdSchema);

    if (validatedOrgId) {
      setOrganizationId(validatedOrgId);
    } else {
      setSessionError("Valid Organization ID is required");
    }

    // Extract and validate conversationId from search params
    const validatedConversationId = sanitizeParam(searchParamsObj.conversationId, conversationIdSchema);
    setConversationId(validatedConversationId);

    // Extract and validate userId from search params
    const validatedUserId = sanitizeParam(searchParamsObj.userId, userIdSchema);
    setUserId(validatedUserId);

    // Extract and validate debug flag from search params
    const debugParam = searchParamsObj.debug;
    let debugValue = false;
    if (typeof debugParam === "string") {
      debugValue = debugParam === "true" || debugParam === "1";
    } else if (Array.isArray(debugParam) && debugParam.length > 0) {
      debugValue = debugParam[0] === "true" || debugParam[0] === "1";
    }
    const validatedDebug = sanitizeParam(debugValue, debugSchema);
    setDebug(validatedDebug || false);
  }, [searchParamsObj]);

  if (sessionError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Widget Error</h2>
          <p className="text-gray-600">{sessionError}</p>
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <p className="text-gray-600">Loading widget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[var(--fl-color-background-subtle)]">
      <WidgetProvider organizationId={organizationId} conversationId={conversationId} userId={userId} debug={debug}>
        {/* Widget Button */}
        <Button />

        {/* Widget Panel with consolidated functionality */}
        <Panel organizationId={organizationId} />
      </WidgetProvider>
    </div>
  );
}
