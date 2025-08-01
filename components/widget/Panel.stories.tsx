import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Panel } from "./Panel";

/**
 * Widget Panel Component
 *
 * The main chat panel component for the Campfire widget.
 * Includes messaging, FAQ, and help functionality with real-time features.
 */
const meta: Meta<typeof Panel> = {
  title: "Widget/Components/Panel",
  component: Panel,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "widgetDesktop",
    },
    docs: {
      description: {
        component:
          "The consolidated main panel component for the Campfire widget. Features messaging, FAQ, help, and real-time communication.",
      },
    },
    // Performance monitoring for panel rendering
    performance: {
      marks: ["panel-mount", "panel-ready"],
      measures: ["panel-load-time"],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    organizationId: {
      control: { type: "text" },
      description: "Organization ID for the widget instance",
    },
  },
  args: {
    organizationId: "demo-org-123",
  },
  decorators: [
    (Story) => (
      <div className="bg-background h-screen w-full spacing-3">
        <div className="mx-auto max-w-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default panel state
 */
export const Default: Story = {
  args: {
    organizationId: "demo-org-123",
  },
};

/**
 * Panel with welcome screen (no messages)
 */
export const WelcomeScreen: Story = {
  args: {
    organizationId: "demo-org-welcome",
  },
  parameters: {
    docs: {
      description: {
        story: "Panel showing the welcome screen when no conversation exists yet.",
      },
    },
  },
};

/**
 * Panel with active conversation
 */
export const ActiveConversation: Story = {
  args: {
    organizationId: "demo-org-active",
  },
  parameters: {
    mockData: {
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you today?",
          sender_type: "ai",
          created_at: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "2",
          content: "I need help with my account settings",
          sender_type: "visitor",
          created_at: new Date(Date.now() - 240000).toISOString(),
        },
        {
          id: "3",
          content: "I can help you with that! What specific setting would you like to change?",
          sender_type: "ai",
          created_at: new Date(Date.now() - 180000).toISOString(),
        },
      ],
    },
    docs: {
      description: {
        story: "Panel with an active conversation showing AI and visitor messages.",
      },
    },
  },
};

/**
 * Panel showing typing indicator
 */
export const TypingIndicator: Story = {
  args: {
    organizationId: "demo-org-typing",
  },
  parameters: {
    mockData: {
      isTyping: true,
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you today?",
          sender_type: "ai",
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ],
    },
    docs: {
      description: {
        story: "Panel showing the enhanced typing indicator when AI or user is typing.",
      },
    },
  },
};

/**
 * Panel in FAQ tab
 */
export const FAQTab: Story = {
  args: {
    organizationId: "demo-org-faq",
  },
  parameters: {
    mockData: {
      activeTab: "faq",
      faqs: [
        {
          id: "1",
          question: "How do I reset my password?",
          answer: 'You can reset your password by clicking the "Forgot Password" link on the login page.',
        },
        {
          id: "2",
          question: "How do I contact support?",
          answer: "You can contact support through this chat widget or by emailing support@campfire.com.",
        },
      ],
    },
    docs: {
      description: {
        story: "Panel showing the FAQ tab with common questions and answers.",
      },
    },
  },
};

/**
 * Panel in Help tab
 */
export const HelpTab: Story = {
  args: {
    organizationId: "demo-org-help",
  },
  parameters: {
    mockData: {
      activeTab: "help",
    },
    docs: {
      description: {
        story: "Panel showing the Help tab with support options.",
      },
    },
  },
};

/**
 * Mobile responsive panel
 */
export const Mobile: Story = {
  args: {
    organizationId: "demo-org-mobile",
  },
  parameters: {
    viewport: {
      defaultViewport: "widgetMobile",
    },
    docs: {
      description: {
        story: "Panel optimized for mobile viewport with responsive design.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background h-screen w-full">
        <Story />
      </div>
    ),
  ],
};

/**
 * Panel with loading state
 */
export const Loading: Story = {
  args: {
    organizationId: "demo-org-loading",
  },
  parameters: {
    mockData: {
      isLoading: true,
    },
    docs: {
      description: {
        story: "Panel in loading state while initializing or sending messages.",
      },
    },
  },
};

/**
 * Panel with error state
 */
export const ErrorState: Story = {
  args: {
    organizationId: "demo-org-error",
  },
  parameters: {
    mockData: {
      error: "Failed to connect to chat service. Please try again.",
    },
    docs: {
      description: {
        story: "Panel showing error state when connection or API calls fail.",
      },
    },
  },
};

/**
 * Dark theme panel
 */
export const DarkTheme: Story = {
  args: {
    organizationId: "demo-org-dark",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
    docs: {
      description: {
        story: "Panel with dark theme styling for better accessibility.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-full bg-gray-900 spacing-3">
        <div className="mx-auto max-w-sm">
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Accessibility testing panel
 */
export const AccessibilityTest: Story = {
  args: {
    organizationId: "demo-org-a11y",
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "keyboard-navigation",
            enabled: true,
          },
          {
            id: "focus-order-semantics",
            enabled: true,
          },
          {
            id: "aria-roles",
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: "Panel configured for comprehensive accessibility testing.",
      },
    },
  },
};

/**
 * Performance testing panel
 */
export const PerformanceTest: Story = {
  args: {
    organizationId: "demo-org-perf",
  },
  play: async ({ canvasElement }) => {
    // Performance marks for testing
    performance.mark("panel-render-start");

    // Wait for panel to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    performance.mark("panel-render-complete");
    performance.measure("panel-render-time", "panel-render-start", "panel-render-complete");

    // Test message input interaction
    const messageInput = canvasElement.querySelector('textarea, input[type="text"]');
    if (messageInput) {
      performance.mark("input-focus-start");
      (messageInput as HTMLElement).focus();
      performance.mark("input-focus-complete");
      performance.measure("input-focus-time", "input-focus-start", "input-focus-complete");
    }
  },
  parameters: {
    docs: {
      description: {
        story: "Panel with automated performance testing and measurements.",
      },
    },
  },
};
