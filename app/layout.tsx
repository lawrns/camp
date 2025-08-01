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
        {/* Preload critical fonts */}
        <link rel="preload" href="/fonts/Sundry-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Sundry-Medium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Sundry-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
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