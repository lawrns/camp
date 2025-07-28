"use client";

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Don't show navigation on dashboard or auth pages
  const hideNavigation = pathname?.startsWith('/dashboard') || 
                         pathname?.startsWith('/login') || 
                         pathname?.startsWith('/register');
  
  if (hideNavigation) {
    return null;
  }
  
  return <Navigation />;
}
