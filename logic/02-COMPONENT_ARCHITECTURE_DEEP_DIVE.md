# COMPONENT ARCHITECTURE DEEP DIVE

## 🏗️ COMPONENT HIERARCHY

### Foundation Layer (Base Components)
```
components/ui/
├── accordion.tsx              # Collapsible content
├── alert-dialog.tsx           # Modal alerts
├── alert.tsx                  # Alert messages
├── aspect-ratio.tsx          # Responsive aspect ratios
├── avatar.tsx                # User avatars
├── badge.tsx                 # Status badges
├── breadcrumb.tsx            # Navigation breadcrumbs
├── button.tsx                # Primary button component
├── calendar.tsx              # Date picker
├── card.tsx                  # Card containers
├── carousel.tsx              # Image/content carousel
├── checkbox.tsx              # Checkbox inputs
├── collapsible.tsx           # Collapsible sections
├── command.tsx               # Command palette
├── context-menu.tsx          # Right-click menus
├── dialog.tsx                # Modal dialogs
├── dropdown-menu.tsx         # Dropdown menus
├── form.tsx                  # Form components
├── hover-card.tsx            # Hover tooltips
├── input.tsx                 # Text inputs
├── label.tsx                 # Form labels
├── menubar.tsx               # Menu bars
├── navigation-menu.tsx       # Navigation menus
├── popover.tsx               # Popover tooltips
├── progress.tsx              # Progress bars
├── radio-group.tsx           # Radio button groups
├── scroll-area.tsx           # Scrollable containers
├── select.tsx                # Dropdown selects
├── separator.tsx             # Visual separators
├── sheet.tsx                 # Side sheets
├── skeleton.tsx              # Loading skeletons
├── slider.tsx                # Range sliders
├── switch.tsx                # Toggle switches
├── table.tsx                 # Data tables
├── tabs.tsx                  # Tab navigation
├── textarea.tsx              # Multi-line inputs
├── toast.tsx                 # Toast notifications
├── toggle-group.tsx          # Toggle button groups
├── toggle.tsx                # Toggle buttons
├── tooltip.tsx               # Tooltips
└── use-toast.ts              # Toast hook
```

### Conversation Components
```
components/conversations/
├── AgentHandoffProvider.tsx      # AI handoff management
├── ConversationCard.tsx          # Individual conversation display
├── ConversationDetail.tsx        # Detailed conversation view
├── ConversationList.tsx          # List of conversations
├── ConversationStatus.tsx        # Status indicators
├── MessageBubble.tsx             # Individual message display
├── MessageInput.tsx              # Message input field
├── MessageList.tsx               # Scrollable message list
├── RealtimeStatus.tsx            # Connection status
├── ThreadView.tsx                # Threaded conversation view
├── TypingIndicator.tsx           # Typing status display
├── VoiceMessage.tsx              # Voice message support
├── FileAttachment.tsx            # File upload/display
├── MessageReactions.tsx          # Emoji reactions
├── ConversationNotes.tsx         # Internal notes
├── ConversationSearch.tsx        # Search functionality
├── ConversationFilters.tsx       # Filter controls
├── BulkActions.tsx               # Batch operations
└── ConversationAnalytics.tsx     # Conversation metrics
```

### Dashboard Components
```
components/dashboard/
├── DashboardLayout.tsx           # Main dashboard wrapper
├── DashboardHeader.tsx           # Top navigation
├── DashboardSidebar.tsx          # Side navigation
├── DashboardMetrics.tsx          # Key performance indicators
├── DashboardCharts.tsx           # Data visualizations
├── DashboardWidgets.tsx          # Modular dashboard widgets
├── DashboardSettings.tsx         # Configuration panels
├── DashboardNotifications.tsx    # Notification center
├── DashboardSearch.tsx           # Global search
├── DashboardUserMenu.tsx         # User profile menu
├── DashboardBreadcrumb.tsx       # Navigation breadcrumbs
├── DashboardLoading.tsx          # Loading states
├── DashboardError.tsx            # Error handling
└── DashboardEmptyState.tsx       # Empty state displays
```

### Widget Components
```
components/widget/
├── WidgetContainer.tsx           # Main widget wrapper
├── WidgetHeader.tsx              # Widget title bar
├── WidgetBody.tsx                # Widget content area
├── WidgetFooter.tsx              # Widget actions
├── WidgetLauncher.tsx            # Launch button
├── WidgetSettings.tsx            # Configuration panel
├── WidgetMinimized.tsx           # Minimized state
├── WidgetMaximized.tsx           # Full-screen mode
├── WidgetDragHandle.tsx          # Drag functionality
├── WidgetResizeHandle.tsx        # Resize functionality
├── WidgetThemeProvider.tsx       # Theme management
├── WidgetAnalytics.tsx           # Usage tracking
├── WidgetErrorBoundary.tsx       # Error handling
└── WidgetPreview.tsx             # Live preview mode
```

### Inbox Components
```
components/inbox/
├── InboxContainer.tsx            # Main inbox wrapper
├── InboxHeader.tsx               # Inbox header with filters
├── InboxList.tsx                 # Scrollable conversation list
├── InboxItem.tsx                 # Individual conversation item
├── InboxFilters.tsx              # Filter controls
├── InboxSearch.tsx               # Search functionality
├── InboxSort.tsx                 # Sorting options
├── InboxBulkActions.tsx          # Batch operations
├── InboxEmptyState.tsx           # Empty inbox display
├── InboxLoading.tsx              # Loading states
├── InboxError.tsx                # Error handling
├── InboxPagination.tsx           # Pagination controls
├── InboxRefresh.tsx              # Manual refresh
└── InboxNotification.tsx         # Real-time notifications
```

### Homepage Components
```
components/homepage/
├── HeroSection.tsx               # Main hero banner
├── FeatureGrid.tsx               # Feature showcase
├── TestimonialSection.tsx        # Customer testimonials
├── PricingSection.tsx            # Pricing tiers
├── FAQSection.tsx                # Frequently asked questions
├── CTASection.tsx                # Call-to-action
├── Footer.tsx                    # Site footer
├── Navigation.tsx                # Site navigation
├── MobileMenu.tsx                # Mobile navigation
├── NewsletterSignup.tsx          # Email capture
├── SocialProof.tsx               # Trust indicators
├── DemoSection.tsx               # Product demonstration
└── IntegrationShowcase.tsx       # Integration highlights
```

## 🔄 COMPONENT COMPOSITION PATTERNS

### Provider Pattern
```typescript
// AgentHandoffProvider - Central state management
interface AgentHandoffContextType {
  isAIActive: boolean;
  aiConfidence: 'high' | 'medium' | 'low';
  reasoningStatus: 'idle' | 'thinking' | 'complete';
  handoffHistory: HandoffEvent[];
  requestHandoff: (reason: string) => void;
  acceptHandoff: () => void;
  rejectHandoff: () => void;
}
```

### Compound Component Pattern
```typescript
// ConversationCard compound components
<ConversationCard>
  <ConversationCard.Header />
  <ConversationCard.Body>
    <ConversationCard.Messages />
    <ConversationCard.Input />
  </ConversationCard.Body>
  <ConversationCard.Footer />
</ConversationCard>
```

### Render Props Pattern
```typescript
// RealtimeStatus with render props
<RealtimeStatus>
  {(status) => (
    <div className={status.isConnected ? 'connected' : 'disconnected'}>
      {status.message}
    </div>
  )}
</RealtimeStatus>
```

### Higher-Order Component Pattern
```typescript
// withWidget HOC for widget functionality
const EnhancedWidget = withWidget(WidgetComponent, {
  theme: 'dark',
  position: 'bottom-right',
  analytics: true
});
```

## 🎯 COMPONENT STATE MANAGEMENT

### Local State Management
```typescript
// Component-level state hooks
const [isExpanded, setIsExpanded] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType | null>(null);
```

### Global State Integration
```typescript
// Zustand store integration
const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  activeConversation: null,
  filters: {},
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversation) => set({ activeConversation: conversation }),
  updateFilters: (filters) => set({ filters })
}));
```

### Real-time State Sync
```typescript
// Supabase realtime subscription
const { data: messages } = useSubscription(
  'messages',
  { channel: `conversation:${conversationId}` },
  (payload) => {
    // Handle realtime updates
    addMessage(payload.new);
  }
);
```

## 🎨 STYLING ARCHITECTURE

### Tailwind Configuration
```javascript
// tailwind.config.js - Extended design system
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a'
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  }
}
```

### Component Styling Patterns
```typescript
// Variants pattern for flexible styling
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    }
  }
);
```

## 🔄 PERFORMANCE OPTIMIZATIONS

### Code Splitting Strategy
```typescript
// Dynamic imports for code splitting
const ConversationDetail = dynamic(
  () => import('@/components/conversations/ConversationDetail'),
  { 
    loading: () => <ConversationDetailSkeleton />,
    ssr: false 
  }
);
```

### Memoization Patterns
```typescript
// React.memo for component optimization
const MessageBubble = React.memo(({ message, user }) => {
  return (
    <div className="message-bubble">
      <Avatar user={user} />
      <MessageContent message={message} />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id &&
         prevProps.user.id === nextProps.user.id;
});
```

### Virtual Scrolling
```typescript
// Virtualized lists for performance
const VirtualizedMessageList = () => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={messages.length}
          rowHeight={80}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

## 🧪 TESTING STRATEGY

### Component Testing Patterns
```typescript
// Component testing with React Testing Library
describe('ConversationCard', () => {
  it('renders conversation details correctly', () => {
    const conversation = mockConversation();
    render(<ConversationCard conversation={conversation} />);
    
    expect(screen.getByText(conversation.title)).toBeInTheDocument();
    expect(screen.getByText(conversation.lastMessage)).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const conversation = mockConversation();
    
    render(
      <ConversationCard 
        conversation={conversation} 
        onClick={handleClick} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(conversation);
  });
});
```

### Visual Regression Testing
```typescript
// Storybook stories for visual testing
export default {
  title: 'Components/ConversationCard',
  component: ConversationCard,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'detailed']
    }
  }
};

export const Default = {
  args: {
    conversation: mockConversation(),
    variant: 'default'
  }
};
```
