# E2E Test Data Documentation

This document describes the standardized test data setup for Campfire v2 E2E testing.

## Overview

The E2E test suite uses a standardized set of test data to ensure consistent and reliable testing across all test scenarios. This includes predefined users, organizations, conversations, and other entities.

## Test Data Structure

### Organization
- **ID**: `b5e80170-004c-4e82-a88c-3e2166b169dd`
- **Name**: `E2E Test Organization`
- **Slug**: `e2e-test-org`
- **Settings**: Widget enabled, Realtime enabled, AI enabled

### Test Users

#### Agent User
- **Email**: `jam@jam.com`
- **Password**: `password123`
- **Name**: `Test Agent`
- **Role**: `agent`
- **Purpose**: Primary test user for agent dashboard functionality

#### Admin User
- **Email**: `admin@test.com`
- **Password**: `password123`
- **Name**: `Test Admin`
- **Role**: `admin`
- **Purpose**: Testing admin-level functionality and permissions

#### Customer User
- **Email**: `customer@test.com`
- **Password**: `password123`
- **Name**: `Test Customer`
- **Role**: `customer`
- **Purpose**: Testing customer interactions and widget functionality

### Test Conversations

#### Active Conversation
- **ID**: `48eedfba-2568-4231-bb38-2ce20420900d`
- **Title**: `Test Active Conversation`
- **Status**: `active`
- **Purpose**: Testing real-time messaging and active conversation features

#### Closed Conversation
- **ID**: `12345678-1234-1234-1234-123456789012`
- **Title**: `Test Closed Conversation`
- **Status**: `closed`
- **Purpose**: Testing conversation history and closed conversation handling

## Setup and Management

### Automatic Setup
Test data is automatically created during the E2E global setup process. The setup includes:

1. **Organization Creation**: Creates the test organization with proper settings
2. **User Creation**: Creates all test users with authentication and profiles
3. **Conversation Setup**: Creates test conversations with proper organization linking
4. **Message Setup**: Creates sample messages for testing conversation flows
5. **Presence Setup**: Initializes user presence records

### Manual Setup
You can manually setup test data using:

```bash
npm run test:data:setup
```

### Verification
Verify test data integrity:

```bash
npm run test:data:verify
```

### Cleanup
Clean up test data between test runs:

```bash
npm run test:data:cleanup
```

## Usage in Tests

### Authentication
All E2E tests should use the standardized test credentials:

```typescript
// Login as agent
await page.fill('#email', 'jam@jam.com');
await page.fill('#password', 'password123');

// Login as admin
await page.fill('#email', 'admin@test.com');
await page.fill('#password', 'password123');

// Login as customer
await page.fill('#email', 'customer@test.com');
await page.fill('#password', 'password123');
```

### API Testing
Use the standardized IDs for API testing:

```typescript
const testConversationId = '8ddf595b-b75d-42f2-98e5-9efd3513ea4b'; // FIXED: Aligned with dashboard
const testOrganizationId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

// Test API endpoints
const response = await page.request.get(`/api/dashboard/conversations/${testConversationId}/messages`);
```

### Real-time Testing
Use standardized channel patterns:

```typescript
// Conversation channel
const conversationChannel = `org:${testOrganizationId}:conv:${testConversationId}`;

// Organization channel
const organizationChannel = `org:${testOrganizationId}`;
```

## Data Isolation

### Between Tests
- Each test should clean up any data it creates
- Use the cleanup utilities for test isolation
- Avoid dependencies between tests

### Between Test Runs
- Global cleanup is performed before each test run
- Transient data (messages, presence, typing indicators) is cleared
- Persistent data (users, organization) is preserved for reuse

## Best Practices

### Test Data Usage
1. **Always use standardized credentials** - Don't create ad-hoc test users
2. **Use predefined IDs** - Don't generate random IDs in tests
3. **Clean up after tests** - Remove any test-specific data created
4. **Handle missing data gracefully** - Tests should work even if some data is missing

### Error Handling
1. **Check for 404 responses** - Test data might not exist in all environments
2. **Provide fallback behavior** - Tests should continue even if setup fails
3. **Log meaningful messages** - Help debug test data issues

### Performance
1. **Reuse existing data** - Don't recreate data unnecessarily
2. **Batch operations** - Use efficient database operations
3. **Minimize setup time** - Keep test data setup fast

## Troubleshooting

### Common Issues

#### Authentication Failures
- Verify Supabase environment variables are set
- Check that test users exist in the auth system
- Ensure organization linking is correct

#### Missing Conversations
- Run test data setup to create conversations
- Verify organization ID matches
- Check conversation status and permissions

#### API Errors
- Verify authentication is working
- Check organization scoping
- Ensure proper error handling for missing data

### Debug Commands

```bash
# Verify test data exists
npm run test:data:verify

# Clean and recreate test data
npm run test:data:cleanup && npm run test:data:setup

# Run specific test data verification
npx playwright test e2e/tests/setup/test-data-verification.spec.ts
```

## Environment Variables

Required environment variables for test data setup:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security Considerations

1. **Test credentials are public** - Never use in production
2. **Service role key** - Keep secure, only use in test environments
3. **Data isolation** - Ensure test data doesn't affect production
4. **Cleanup policies** - Regularly clean up test environments

## Maintenance

### Adding New Test Data
1. Update `e2e/test-data-setup.ts` with new data structures
2. Update this documentation
3. Add verification to `test-data-verification.spec.ts`
4. Test the setup and cleanup processes

### Modifying Existing Data
1. Consider backward compatibility with existing tests
2. Update all references to changed IDs or structures
3. Test migration from old to new data format
4. Update documentation and examples

### Performance Monitoring
- Monitor test data setup time
- Optimize database operations
- Consider caching strategies for large datasets
- Profile cleanup operations for efficiency
