import React from 'react';
import { Metadata } from 'next';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Page, PageHeader, PageHeaderRow, PageTitle, PageContent } from '@/components/ui/page-shell';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Profile - Campfire',
  description: 'Manage your profile and account settings',
};

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <Page>
        <PageHeader>
          <PageHeaderRow left={<PageTitle subtitle="Manage your profile and account settings">Profile</PageTitle>} />
        </PageHeader>
        <PageContent>
          <div className="grid gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="text-muted-foreground mt-2">
                  Update your name, email, and profile picture
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Security</h2>
                <p className="text-muted-foreground mt-2">
                  Change your password and manage security settings
                </p>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </Page>
    </ErrorBoundary>
  );
} 