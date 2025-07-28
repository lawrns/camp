import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Button } from "./Button";

/**
 * Widget Button Component
 *
 * A versatile button component used throughout the Campfire widget.
 * Supports multiple variants, sizes, and states for different use cases.
 */
const meta: Meta<typeof Button> = {
  title: "Widget/Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "The primary button component for the Campfire widget. Optimized for accessibility and performance.",
      },
    },
    // Performance monitoring for button interactions
    performance: {
      marks: ["button-render", "button-click"],
      measures: ["button-interaction"],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "ghost", "destructive"],
      description: "Visual style variant of the button",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size of the button",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the button is disabled",
    },
    loading: {
      control: { type: "boolean" },
      description: "Whether the button is in loading state",
    },
    children: {
      control: { type: "text" },
      description: "Button content",
    },
    onClick: {
      action: "clicked",
      description: "Click handler function",
    },
  },
  args: {
    onClick: action("button-clicked"),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default button with primary styling
 */
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Send Message",
  },
};

/**
 * Secondary button variant
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Cancel",
  },
};

/**
 * Ghost button for subtle actions
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "View FAQ",
  },
};

/**
 * Destructive button for dangerous actions
 */
export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete Conversation",
  },
};

/**
 * Small button size
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

/**
 * Large button size
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * Loading button state
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: "Sending...",
  },
};

/**
 * Button with icon
 */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Attachment
      </>
    ),
  },
};

/**
 * Interactive example showing all button states
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="space-x-spacing-sm">
        <Button variant="primary" onClick={action("primary-clicked")}>
          Primary
        </Button>
        <Button variant="secondary" onClick={action("secondary-clicked")}>
          Secondary
        </Button>
        <Button variant="ghost" onClick={action("ghost-clicked")}>
          Ghost
        </Button>
        <Button variant="destructive" onClick={action("destructive-clicked")}>
          Destructive
        </Button>
      </div>
      <div className="space-x-spacing-sm">
        <Button size="sm" onClick={action("small-clicked")}>
          Small
        </Button>
        <Button size="md" onClick={action("medium-clicked")}>
          Medium
        </Button>
        <Button size="lg" onClick={action("large-clicked")}>
          Large
        </Button>
      </div>
      <div className="space-x-spacing-sm">
        <Button disabled onClick={action("disabled-clicked")}>
          Disabled
        </Button>
        <Button loading onClick={action("loading-clicked")}>
          Loading
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "A comprehensive overview of all button variants, sizes, and states.",
      },
    },
  },
};

/**
 * Accessibility testing story
 */
export const AccessibilityTest: Story = {
  args: {
    children: "Accessible Button",
    "aria-label": "Send message to support team",
    "aria-describedby": "button-help-text",
  },
  render: (args) => (
    <div>
      <Button {...args} />
      <div id="button-help-text" className="text-foreground mt-2 text-sm">
        This button will send your message to our support team
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: "button-name",
            enabled: true,
          },
          {
            id: "color-contrast",
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Performance testing story
 */
export const PerformanceTest: Story = {
  args: {
    children: "Performance Test",
  },
  play: async ({ canvasElement }) => {
    // Performance marks for testing
    performance.mark("button-render-start");

    const button = canvasElement.querySelector("button");
    if (button) {
      // Simulate user interaction
      button.focus();
      performance.mark("button-focus");

      button.click();
      performance.mark("button-click");

      // Measure performance
      performance.measure("button-interaction", "button-render-start", "button-click");
    }
  },
  parameters: {
    docs: {
      description: {
        story: "Performance testing story with automated interactions and measurements.",
      },
    },
  },
};
