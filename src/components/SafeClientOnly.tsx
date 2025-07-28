import React, { useEffect, useState } from "react";

("use client");

interface SafeClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders its children on the client side
 * Prevents hydration mismatches for client-specific content
 */
export function SafeClientOnly({ children, fallback = null }: SafeClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
