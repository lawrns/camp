import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Simple dashboard component for Storybook since StandardizedDashboard might have complex dependencies
const SimpleDashboard = () => (
  <div style={{ height: '100vh', background: '#f9fafb', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <header style={{ background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Dashboard</h1>
    </header>
    
    <main style={{ padding: '2rem' }}>
      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Total Conversations</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#111827' }}>1,247</p>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Active Conversations</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#059669' }}>89</p>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Avg Response Time</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>2.3m</p>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 500, color: '#6b7280' }}>Customer Satisfaction</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>4.8</p>
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>Recent Activity</h2>
        </div>
        <div style={{ padding: '1rem' }}>
          {[
            { message: 'New conversation from john@example.com', time: '2 minutes ago', type: 'new' },
            { message: 'Agent Sarah replied to ticket #1234', time: '5 minutes ago', type: 'reply' },
            { message: 'Ticket #1233 marked as resolved', time: '10 minutes ago', type: 'resolved' },
            { message: 'New conversation from jane@example.com', time: '15 minutes ago', type: 'new' },
          ].map((activity, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', background: index % 2 === 0 ? '#f9fafb' : 'transparent' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: activity.type === 'new' ? '#3b82f6' : activity.type === 'reply' ? '#059669' : '#f59e0b',
                marginRight: '0.75rem'
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#111827' }}>{activity.message}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

const meta: Meta<typeof SimpleDashboard> = {
  title: 'Layouts/Dashboard',
  component: SimpleDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main dashboard layout with metrics, activity feed, and navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SimpleDashboard>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default dashboard with standard layout and spacing.',
      },
    },
  },
};

export const MobileDashboard: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Dashboard optimized for mobile viewport with responsive layout.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '375px', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const TabletDashboard: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Dashboard on tablet viewport to test medium-screen layout.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '768px', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};
