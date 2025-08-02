import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConditionalNavigation } from '@/components/ConditionalNavigation';
import { AuthProviders } from './app-backup/client-providers';
import { ExtensionIsolationProvider } from '@/components/system/ExtensionIsolationProvider';
import { initializeMonitoring } from '@/lib/monitoring/init';
import type { Metadata } from 'next';
import { ClientConsoleManager } from '@/components/system/ClientConsoleManager';

// Initialize monitoring for production
if (typeof window !== 'undefined') {
  initializeMonitoring();
}

export const metadata: Metadata = { 
  title: 'Campfire - Customer Support Platform',
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="/sw-cleanup.js" async></script>
        {/* PERFORMANCE: Removed unused Sundry font preloads to fix preload warnings */}
        {/* Application uses Inter fonts which are loaded via Google Fonts in design-system.css */}
      </head>
      <body>
        <ClientConsoleManager />
        <ExtensionIsolationProvider>
          <ThemeProvider>
            <AuthProviders>
              <ConditionalNavigation />
              {children}
            </AuthProviders>
          </ThemeProvider>
        </ExtensionIsolationProvider>
      </body>
    </html>
  );
}