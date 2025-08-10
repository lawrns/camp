import type { Meta, StoryObj } from '@storybook/react';
import { UltimateWidget } from './design-system/UltimateWidget';

const meta: Meta<typeof UltimateWidget> = {
  title: 'Layouts/Widget',
  component: UltimateWidget,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete widget component with chat interface, file upload, and advanced features.',
      },
    },
  },
  argTypes: {
    organizationId: {
      control: 'text',
      description: 'Organization ID for the widget',
    },
    conversationId: {
      control: 'text',
      description: 'Optional conversation ID to load existing conversation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof UltimateWidget>;

const defaultConfig = {
  organizationName: 'Campfire Demo',
  primaryColor: '#3b82f6',
  position: 'bottom-right' as const,
  welcomeMessage: 'Hi there! 👋 Welcome to Campfire. How can we help you today?',
  showWelcomeMessage: true,
  enableHelp: true,
  enableNotifications: true,
  enableFileUpload: true,
  enableReactions: true,
  enableThreading: true,
  enableSoundNotifications: false, // Disabled for Storybook
  maxFileSize: 10,
  maxFiles: 5,
  acceptedFileTypes: ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
};

export const Default: Story = {
  args: {
    organizationId: 'demo-org',
    config: defaultConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default widget with standard configuration and welcome message.',
      },
    },
  },
};

export const WithoutWelcome: Story = {
  args: {
    organizationId: 'demo-org',
    config: {
      ...defaultConfig,
      showWelcomeMessage: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Widget without welcome message for returning users.',
      },
    },
  },
};

export const MinimalFeatures: Story = {
  args: {
    organizationId: 'demo-org',
    config: {
      ...defaultConfig,
      enableFileUpload: false,
      enableReactions: false,
      enableThreading: false,
      enableHelp: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Widget with minimal features enabled for simple use cases.',
      },
    },
  },
};

export const CustomBranding: Story = {
  args: {
    organizationId: 'demo-org',
    config: {
      ...defaultConfig,
      organizationName: 'Acme Corp',
      primaryColor: '#10b981',
      welcomeMessage: 'Welcome to Acme Corp support! We\'re here to help you succeed.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Widget with custom branding colors and messaging.',
      },
    },
  },
};

export const EmbeddedInPage: Story = {
  args: {
    organizationId: 'demo-org',
    config: defaultConfig,
  },
  parameters: {
    docs: {
      description: {
        story: 'Widget embedded in a realistic page context to test positioning and z-index.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: '#f9fafb', position: 'relative' }}>
        {/* Mock page content */}
        <header style={{ background: '#fff', padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Sample Website</h1>
        </header>
        <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <h2>Welcome to our platform</h2>
          <p>This is sample content to show how the widget appears on a real page.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3>Feature 1</h3>
              <p>Description of feature 1</p>
            </div>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3>Feature 2</h3>
              <p>Description of feature 2</p>
            </div>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3>Feature 3</h3>
              <p>Description of feature 3</p>
            </div>
          </div>
        </main>
        <Story />
      </div>
    ),
  ],
};
