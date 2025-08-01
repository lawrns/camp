import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConditionalNavigation } from '@/components/ConditionalNavigation';
import { AuthProviders } from './app/client-providers';
import { ExtensionIsolationProvider } from '@/components/system/ExtensionIsolationProvider';
import { initializeMonitoring } from '@/lib/monitoring/init';
import type { Metadata } from 'next';
import { ConsoleManager } from '@/components/system/ConsoleManager';

// Initialize monitoring for production
if (typeof window !== 'undefined') {
  initializeMonitoring();
}

export const metadata: Metadata = { title: 'Campfire - Customer Support Platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsoleManager />
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