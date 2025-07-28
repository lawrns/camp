# Organization Store

Domain-specific store for managing organization context and settings.

## Features

- Organization state management (id, name, settings)
- Settings management (AI, RAG, auto-handoff configurations)
- Automatic cleanup on auth events
- TypeScript-first with full type safety
- Optimized hooks for specific data access

## Usage

### Basic Usage

```typescript
import { useOrganizationStore } from '@/store/domains/organization';

// In a component
function MyComponent() {
  const organization = useOrganization();
  const orgId = useOrganizationId();
  const isAIEnabled = useIsAIEnabled();

  const updateSettings = useUpdateOrganizationSettings();

  const handleToggleAI = () => {
    updateSettings({ aiEnabled: !isAIEnabled });
  };

  return (
    <div>
      <h1>{organization?.name}</h1>
      <button onClick={handleToggleAI}>
        {isAIEnabled ? 'Disable' : 'Enable'} AI
      </button>
    </div>
  );
}
```

### Available Hooks

#### State Hooks

- `useOrganization()` - Get the full organization object
- `useOrganizationId()` - Get just the organization ID
- `useOrganizationName()` - Get just the organization name
- `useOrganizationSettings()` - Get the settings object

#### Settings Hooks

- `useIsAIEnabled()` - Check if AI is enabled
- `useIsRAGEnabled()` - Check if RAG is enabled
- `useIsAutoHandoffEnabled()` - Check if auto-handoff is enabled

#### Action Hooks

- `useSetOrganization()` - Set the entire organization
- `useUpdateOrganizationSettings()` - Update specific settings
- `useClearOrganization()` - Clear organization state

### Direct Store Access

```typescript
import { useOrganizationStore } from "@/store/domains/organization";

// Get current state
const state = useOrganizationStore.getState();
const org = state.organization;

// Subscribe to changes
const unsubscribe = useOrganizationStore.subscribe(
  (state) => state.organization,
  (organization) => {
    console.log("Organization changed:", organization);
  }
);

// Update state directly
useOrganizationStore.getState().setOrganization({
  id: "org-123",
  name: "My Organization",
  settings: {
    aiEnabled: true,
    ragEnabled: false,
    autoHandoff: true,
  },
});
```

### Integration with Auth

The organization store automatically clears when auth events occur:

- `auth:clear` - Clears organization state
- `auth:logout` - Clears organization state

This ensures organization data doesn't persist across user sessions.

## Types

```typescript
interface OrganizationSettings {
  aiEnabled: boolean;
  ragEnabled: boolean;
  autoHandoff: boolean;
  [key: string]: any; // Extensible for additional settings
}

interface Organization {
  id: string;
  name: string;
  settings: OrganizationSettings;
}
```

## Migration from Unified Store

If migrating from the unified store:

```typescript
// Before (unified store)
import { useCampfireStore } from "@/store/unified-campfire-store";
const organization = useCampfireStore((state) => state.organization);
const updateSettings = useCampfireStore((state) => state.updateOrganizationSettings);

// After (domain store)
import { useOrganization, useUpdateOrganizationSettings } from "@/store/domains/organization";
const organization = useOrganization();
const updateSettings = useUpdateOrganizationSettings();
```
