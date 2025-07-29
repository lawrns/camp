import '../src/app/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConditionalNavigation } from '@/components/ConditionalNavigation';
import { AuthProviders } from '../src/app/app/client-providers';
import { ExtensionIsolationProvider } from '@/components/system/ExtensionIsolationProvider';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
import { initializeMonitoring } from '@/lib/monitoring/init';
import type { Metadata } from 'next';

// Initialize monitoring for production
if (typeof window !== 'undefined') {
  initializeMonitoring();
}

export const metadata: Metadata = { title: 'Campfire - Customer Support Platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ExtensionIsolationProvider>
          <ThemeProvider>
            <AuthProviders>
              <ConditionalNavigation />
              {children}
              <AuthDebugPanel />
            </AuthProviders>
          </ThemeProvider>
        </ExtensionIsolationProvider>
      </body>
    </html>
  );
}