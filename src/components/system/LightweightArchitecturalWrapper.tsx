"use client";

import { ReactNode } from "react";
import { TRPCReactProvider } from "@/trpc/react";
import { ConditionalAuthWrapper } from "./ConditionalAuthWrapper";

interface LightweightArchitecturalWrapperProps {
  children: ReactNode;
}

/**
 * LightweightArchitecturalWrapper - Simplified following Helper.ai approach
 * Now includes tRPC provider for API calls
 */
export function LightweightArchitecturalWrapper({ children }: LightweightArchitecturalWrapperProps) {
  return (
    <TRPCReactProvider>
      <ConditionalAuthWrapper>{children}</ConditionalAuthWrapper>
    </TRPCReactProvider>
  );
}
