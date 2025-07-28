# Supabase Client Architecture

This directory contains the Supabase client implementation for Campfire, featuring a robust singleton pattern and full TypeScript type safety.

## Files

- **`client-factory.ts`** - Core singleton factory that prevents multiple GoTrueClient instances
- **`typed-client.ts`** - Type-safe wrappers using generated database types
- **`client.ts`** - Legacy client exports (being phased out)
- **`server.ts`** - Server-side client utilities
- **`service-role-server.ts`** - Service role client for admin operations

## Quick Start

### 1. Generate Database Types

```bash
# Generate types from your Supabase project
pnpm db:generate-types
```

This creates/updates `types/supabase.ts` with full type definitions for your database schema.

### 2. Use Typed Clients

```typescript
// Browser/Client Components
import { createTypedBrowserClient } from "@/lib/supabase/typed-client";
const supabase = createTypedBrowserClient();

// Server Components (with cookies)
import { createTypedServerClient } from "@/lib/supabase/typed-client";
import { cookies } from "next/headers";
const supabase = createTypedServerClient(cookies());

// Service Role (server-only, admin operations)
import { createTypedServiceRoleClient } from "@/lib/supabase/typed-client";
const supabase = createTypedServiceRoleClient();
```

## Architecture

### Singleton Pattern

The client factory ensures only one instance of each client type exists, preventing:

- Multiple GoTrueClient instances that cause auth conflicts
- Unnecessary connections and memory usage
- Race conditions in authentication state

### Client Types

1. **Browser Client** (`role: 'browser'`)
   - Used in React components and client-side code
   - Handles auth persistence and session refresh
   - Supports real-time subscriptions

2. **Server Client** (`role: 'server'`)
   - Used in server components and API routes
   - Requires cookie handlers for auth
   - No session persistence

3. **Service Role Client** (`role: 'service'`)
   - Server-only with elevated permissions
   - Bypasses Row Level Security
   - Used for admin operations

4. **Anonymous Client** (`role: 'anon'`)
   - No authentication required
   - Public data access only
   - Minimal overhead

## Type Safety

All clients return fully typed responses based on your database schema:

```typescript
// TypeScript knows the exact shape of the data
const { data, error } = await supabase.from("messages").select("*").eq("organization_id", orgId);

// data is typed as:
// Database['public']['Tables']['messages']['Row'][] | null
```

## Migration Path

We're migrating from multiple client implementations to a unified, typed approach:

1. **Phase 1**: Introduce typed clients alongside existing ones ✅
2. **Phase 2**: Update all imports to use typed clients
3. **Phase 3**: Remove legacy client exports

See `docs/database-types-migration-guide.md` for detailed migration instructions.

## Best Practices

1. **Always use typed clients** for new code
2. **Regenerate types** after database schema changes
3. **Use the appropriate client** for your context (browser vs server)
4. **Never import service role client** in client-side code
5. **Let TypeScript guide you** - if it compiles, it's correct!

## Troubleshooting

### "Multiple instances detected" warning

- You're creating clients in a loop or component render
- Solution: Create client outside component or use a hook

### Type errors after schema change

- Run `pnpm db:generate-types` to update types
- Restart TypeScript server in VS Code

### "Service role key not configured" error

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is in your `.env.local`
- Service role client only works server-side

### Real-time not working

- Check browser client is used (not anon/service)
- Ensure proper channel cleanup in useEffect

## Contributing

When adding new database tables or modifying schema:

1. Update the database schema
2. Run `pnpm db:generate-types`
3. Update any affected client code
4. Add types for any new patterns in `typed-client.ts`
