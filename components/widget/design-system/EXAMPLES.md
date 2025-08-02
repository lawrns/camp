# Widget Design System Examples

Complete examples showing how to use the Campfire Widget Design System components.

## 🚀 Basic Widget Setup

### Simple Implementation
```tsx
import { UltimateWidget } from './design-system';

function App() {
  return (
    <UltimateWidget
      organizationId="org-123"
      config={{
        organizationName: "Acme Corp",
        primaryColor: "#3b82f6",
        position: "bottom-right",
        welcomeMessage: "Hi there! 👋 How can we help you today?",
        showWelcomeMessage: true,
        enableHelp: true,
      }}
      onMessage={(message) => {
        console.log('New message:', message);
        // Handle message sending to your backend
      }}
      onClose={() => {
        console.log('Widget closed');
        // Handle widget close analytics
      }}
    />
  );
}
```

### Advanced Configuration
```tsx
import { UltimateWidget, type UltimateWidgetConfig } from './design-system';

const widgetConfig: UltimateWidgetConfig = {
  organizationName: "TechCorp Support",
  organizationLogo: "/logo.png",
  primaryColor: "#6366f1",
  position: "bottom-left",
  welcomeMessage: "Welcome to TechCorp! Our support team is here to help you 24/7.",
  showWelcomeMessage: true,
  enableHelp: true,
  enableNotifications: true,
};

function AdvancedWidget() {
  const handleMessage = async (message: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, organizationId: 'org-123' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Message send error:', error);
    }
  };

  return (
    <UltimateWidget
      organizationId="org-123"
      config={widgetConfig}
      onMessage={handleMessage}
      onClose={() => {
        // Analytics tracking
        gtag('event', 'widget_closed', {
          event_category: 'engagement',
          event_label: 'support_widget',
        });
      }}
    />
  );
}
```

## 🎨 Custom Chat Interface

### Standalone Chat Component
```tsx
import { 
  PixelPerfectChatInterface, 
  type MessageBubbleProps 
} from './design-system';

function CustomChat() {
  const [messages, setMessages] = useState<MessageBubbleProps[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      senderType: 'agent',
      senderName: 'Sarah',
      timestamp: new Date().toISOString(),
      isOwn: false,
      showAvatar: true,
      showTimestamp: true,
      showStatus: false,
    }
  ]);

  const [typingUsers, setTypingUsers] = useState([]);

  const handleSendMessage = (message: string) => {
    const newMessage: MessageBubbleProps = {
      id: Date.now().toString(),
      content: message,
      senderType: 'visitor',
      timestamp: new Date().toISOString(),
      isOwn: true,
      showAvatar: false,
      showTimestamp: true,
      showStatus: true,
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate agent typing
    setTypingUsers([{ id: 'agent', name: 'Sarah' }]);
    
    setTimeout(() => {
      setTypingUsers([]);
      const agentReply: MessageBubbleProps = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! I'll help you with that.",
        senderType: 'agent',
        senderName: 'Sarah',
        timestamp: new Date().toISOString(),
        isOwn: false,
        showAvatar: true,
        showTimestamp: true,
        showStatus: false,
      };
      setMessages(prev => [...prev, agentReply]);
    }, 2000);
  };

  return (
    <div className="w-96 h-[600px] border rounded-lg overflow-hidden">
      <PixelPerfectChatInterface
        messages={messages}
        isConnected={true}
        typingUsers={typingUsers}
        organizationName="Support Team"
        onSendMessage={handleSendMessage}
        onTyping={() => console.log('User is typing')}
        onStopTyping={() => console.log('User stopped typing')}
      />
    </div>
  );
}
```

## 🎯 Individual Components

### Custom Button Examples
```tsx
import { WidgetButton, WidgetIconButton } from './design-system';

function ButtonExamples() {
  return (
    <div className="space-y-4 p-4">
      {/* Primary Actions */}
      <div className="space-x-2">
        <WidgetButton variant="primary" size="lg">
          Start Conversation
        </WidgetButton>
        <WidgetButton variant="secondary" size="lg">
          Browse Help
        </WidgetButton>
      </div>

      {/* Loading States */}
      <div className="space-x-2">
        <WidgetButton variant="primary" isLoading>
          Sending...
        </WidgetButton>
        <WidgetButton variant="secondary" disabled>
          Disabled
        </WidgetButton>
      </div>

      {/* Icon Buttons */}
      <div className="space-x-2">
        <WidgetIconButton
          icon={<SendIcon />}
          variant="primary"
          size="md"
          aria-label="Send message"
        />
        <WidgetIconButton
          icon={<CloseIcon />}
          variant="ghost"
          size="sm"
          aria-label="Close"
        />
      </div>

      {/* With Icons */}
      <div className="space-x-2">
        <WidgetButton
          variant="primary"
          leftIcon={<ChatIcon />}
          onClick={() => console.log('Chat clicked')}
        >
          Start Chat
        </WidgetButton>
        <WidgetButton
          variant="secondary"
          rightIcon={<ArrowIcon />}
          onClick={() => console.log('Help clicked')}
        >
          Get Help
        </WidgetButton>
      </div>
    </div>
  );
}
```

### Custom Header Examples
```tsx
import { WidgetHeader, CompactWidgetHeader } from './design-system';

function HeaderExamples() {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <CompactWidgetHeader
        organizationName="Support"
        isConnected={true}
        onRestore={() => setIsMinimized(false)}
        onClose={() => console.log('Closed')}
      />
    );
  }

  return (
    <WidgetHeader
      organizationName="TechCorp Support"
      organizationLogo="/logo.png"
      isConnected={true}
      connectionStatus="connected"
      isExpanded={false}
      onMinimize={() => setIsMinimized(true)}
      onExpand={() => console.log('Expand')}
      onClose={() => console.log('Close')}
    />
  );
}
```

### Tab Navigation Examples
```tsx
import { WidgetTabs, WidgetBottomTabs, type WidgetTab } from './design-system';

function TabExamples() {
  const [activeTab, setActiveTab] = useState('chat');

  const tabs: WidgetTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <HomeIcon />,
    },
    {
      id: 'chat',
      label: 'Messages',
      icon: <ChatIcon />,
      badge: 3,
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpIcon />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Standard Tabs */}
      <WidgetTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="default"
        size="md"
      />

      {/* Pills Variant */}
      <WidgetTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        size="sm"
      />

      {/* Bottom Tab Bar */}
      <WidgetBottomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
```

## 📱 Responsive Examples

### Mobile-Optimized Widget
```tsx
import { UltimateWidget, useResponsive } from './design-system';

function ResponsiveWidget() {
  const { isMobile, isTablet } = useResponsive();

  const config = {
    organizationName: "Mobile Support",
    primaryColor: "#3b82f6",
    position: isMobile ? "bottom-right" : "bottom-right",
    welcomeMessage: isMobile 
      ? "Hi! Tap to chat 💬" 
      : "Hello! How can we help you today?",
    showWelcomeMessage: true,
    enableHelp: !isMobile, // Hide help on mobile for simplicity
  };

  return (
    <UltimateWidget
      organizationId="mobile-org"
      config={config}
      onMessage={(message) => {
        // Mobile-specific analytics
        if (isMobile) {
          gtag('event', 'mobile_message_sent', {
            event_category: 'mobile_engagement',
            message_length: message.length,
          });
        }
      }}
    />
  );
}
```

### Custom Responsive Hook Usage
```tsx
import { useResponsive, useWidgetDimensions } from './design-system';

function ResponsiveComponent() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    screenWidth, 
    orientation 
  } = useResponsive();
  
  const { getWidgetDimensions } = useWidgetDimensions();

  const widgetSize = getWidgetDimensions('open');

  return (
    <div className="p-4">
      <h3>Device Info</h3>
      <ul>
        <li>Mobile: {isMobile ? 'Yes' : 'No'}</li>
        <li>Tablet: {isTablet ? 'Yes' : 'No'}</li>
        <li>Desktop: {isDesktop ? 'Yes' : 'No'}</li>
        <li>Screen Width: {screenWidth}px</li>
        <li>Orientation: {orientation}</li>
      </ul>
      
      <h3>Widget Dimensions</h3>
      <pre>{JSON.stringify(widgetSize, null, 2)}</pre>
    </div>
  );
}
```

## 🎨 Custom Theming

### Brand Color Customization
```tsx
import { UltimateWidget } from './design-system';

// Custom CSS variables for theming
const customTheme = {
  '--widget-primary': '#8b5cf6',
  '--widget-primary-hover': '#7c3aed',
  '--widget-surface': '#faf5ff',
  '--widget-border': '#e9d5ff',
} as React.CSSProperties;

function ThemedWidget() {
  return (
    <div style={customTheme}>
      <UltimateWidget
        organizationId="themed-org"
        config={{
          organizationName: "Purple Brand",
          primaryColor: "#8b5cf6",
          position: "bottom-right",
        }}
      />
    </div>
  );
}
```

### Dark Mode Support
```tsx
import { UltimateWidget, COLORS } from './design-system';

function DarkModeWidget() {
  const [isDark, setIsDark] = useState(false);

  const darkTheme = {
    '--widget-bg': '#1f2937',
    '--widget-surface': '#374151',
    '--widget-text': '#f9fafb',
    '--widget-border': '#4b5563',
  } as React.CSSProperties;

  return (
    <div style={isDark ? darkTheme : {}}>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle Dark Mode
      </button>
      
      <UltimateWidget
        organizationId="dark-org"
        config={{
          organizationName: "Dark Support",
          primaryColor: isDark ? "#60a5fa" : "#3b82f6",
        }}
      />
    </div>
  );
}
```

## 🔧 Integration Examples

### Next.js Integration
```tsx
// pages/_app.tsx
import { UltimateWidget } from '../components/widget/design-system';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <UltimateWidget
        organizationId={process.env.NEXT_PUBLIC_ORG_ID}
        config={{
          organizationName: "Next.js App",
          primaryColor: "#000000",
        }}
      />
    </>
  );
}
```

### React Router Integration
```tsx
import { useLocation } from 'react-router-dom';
import { UltimateWidget } from './design-system';

function App() {
  const location = useLocation();
  
  // Hide widget on certain pages
  const hideWidget = ['/login', '/signup'].includes(location.pathname);

  if (hideWidget) return null;

  return (
    <UltimateWidget
      organizationId="router-org"
      config={{
        organizationName: "Router App",
        welcomeMessage: `Welcome to ${location.pathname}! Need help?`,
      }}
    />
  );
}
```

## 🧪 Testing Examples

### Component Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetButton } from './design-system';

describe('WidgetButton', () => {
  it('renders with correct text', () => {
    render(<WidgetButton>Click me</WidgetButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<WidgetButton onClick={handleClick}>Click me</WidgetButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<WidgetButton isLoading>Loading</WidgetButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E Testing
```tsx
// cypress/integration/widget.spec.ts
describe('Widget Integration', () => {
  it('opens and sends a message', () => {
    cy.visit('/');
    
    // Open widget
    cy.get('[data-testid="widget-button"]').click();
    
    // Type message
    cy.get('[data-testid="message-input"]').type('Hello support!');
    
    // Send message
    cy.get('[data-testid="send-button"]').click();
    
    // Verify message appears
    cy.contains('Hello support!').should('be.visible');
  });
});
```

These examples demonstrate the flexibility and power of the Campfire Widget Design System. Each component is designed to be composable, accessible, and performant while maintaining pixel-perfect design standards.
