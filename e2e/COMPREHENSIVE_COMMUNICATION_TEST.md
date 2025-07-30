# Comprehensive Widget-Dashboard Communication Test

This document describes the comprehensive end-to-end test that validates the complete widget-dashboard communication flow and AI handover functionality in Campfire v2.

## Overview

The comprehensive communication test is a Puppeteer-based E2E test that simulates real-world usage scenarios by opening two browser contexts:
- **Widget Context**: Simulates a customer using the widget
- **Dashboard Context**: Simulates an agent using the dashboard

The test validates bidirectional communication, real-time features, AI handover, and error handling scenarios.

## Test Architecture

### Test Configuration
```typescript
const TEST_CONFIG = {
  AGENT_EMAIL: 'jam@jam.com',
  AGENT_PASSWORD: 'password123',
  TEST_ORG_ID: 'b5e80170-004c-4e82-a88c-3e2166b169dd',
  TEST_CONVERSATION_ID: '48eedfba-2568-4231-bb38-2ce20420900d',
  WIDGET_DEMO_URL: '/widget-demo',
  DASHBOARD_URL: '/dashboard',
  TIMEOUTS: {
    MESSAGE_DELIVERY: 15000,
    TYPING_INDICATOR: 5000,
    READ_RECEIPT: 10000,
    AI_RESPONSE: 20000,
    REAL_TIME_UPDATE: 8000
  }
};
```

### Test Components

#### 1. CommunicationTestRunner Class
Main test orchestrator that manages:
- Browser context initialization
- Test execution coordination
- Diagnostics collection
- Report generation

#### 2. Diagnostics System
Comprehensive monitoring that tracks:
- API response times and status codes
- WebSocket connection status
- Message delivery timing
- Error occurrences
- Performance metrics

## Test Scenarios

### 1. Core Communication Testing

#### Bidirectional Message Flow
- **Widget → Dashboard**: Send message from widget, verify real-time delivery to dashboard
- **Dashboard → Widget**: Send reply from dashboard, verify real-time delivery to widget
- **Message Validation**: Verify timestamps, sender identification, and proper formatting
- **Delivery Confirmation**: Track message delivery status and timing

#### Message Composer Functionality
- **Input Validation**: Test empty message prevention
- **Character Limits**: Test handling of very long messages
- **Special Characters**: Test XSS prevention and proper escaping
- **Keyboard Shortcuts**: Test Enter to send, Shift+Enter for new line
- **Multiline Support**: Verify multiline message handling

### 2. Real-time Features Testing

#### Typing Indicators
- **Widget Typing**: Verify typing indicator appears in dashboard when customer types
- **Dashboard Typing**: Verify typing indicator appears in widget when agent types
- **Auto-clear**: Verify typing indicators disappear after inactivity
- **Bidirectional Sync**: Test simultaneous typing from both sides

#### Read Receipts
- **Message Read Tracking**: Verify messages are marked as read when viewed
- **Visual Indicators**: Check for proper read receipt icons and status
- **Real-time Updates**: Verify read receipts update in real-time across contexts
- **Auto-mark Functionality**: Test automatic read receipt when messages come into view

#### Presence Indicators
- **Agent Status**: Verify agent online/offline status is displayed correctly
- **Status Updates**: Test real-time presence updates
- **Multiple Agents**: Test presence with multiple agents (if applicable)

### 3. AI Handover Testing

#### Automatic AI Response
- **Trigger Messages**: Send common support queries to trigger AI responses
- **Response Detection**: Verify AI responses are generated and displayed
- **Response Quality**: Check for relevant and helpful AI responses
- **Confidence Scoring**: Verify AI confidence scores are displayed

#### Manual Handover
- **AI to Human**: Test manual handover from AI to human agent
- **Handover Controls**: Verify handover buttons and controls work
- **Status Updates**: Check handover status is properly communicated
- **Seamless Transition**: Verify smooth transition from AI to human responses

#### AI Confidence Scoring
- **Score Display**: Verify confidence scores are shown with AI responses
- **Score Accuracy**: Test with queries of varying complexity
- **Low Confidence Handling**: Test behavior with low-confidence responses

### 4. Error Handling & Edge Cases

#### Input Validation
- **Empty Messages**: Verify empty messages are prevented
- **Long Messages**: Test handling of extremely long messages
- **XSS Prevention**: Test protection against malicious input
- **Special Characters**: Verify proper handling of Unicode and special characters

#### Network Scenarios
- **Network Interruption**: Simulate network disconnection and reconnection
- **Offline Queuing**: Test message queuing when offline
- **Reconnection Handling**: Verify proper reconnection behavior
- **Timeout Handling**: Test behavior when requests timeout

#### Authentication Edge Cases
- **Session Expiration**: Test handling of expired authentication sessions
- **Invalid Credentials**: Test behavior with invalid login attempts
- **Permission Changes**: Test handling of permission changes during session

## Test Execution

### Prerequisites
1. **Development Server**: Must be running on `localhost:3005`
2. **Test Data**: Standardized test data must be set up
3. **Environment Variables**: Supabase configuration must be available
4. **Browser Dependencies**: Playwright browsers must be installed

### Running the Test

#### Quick Verification
```bash
# Verify setup before running test
npm run test:verify-setup
```

#### Run Comprehensive Test
```bash
# Run with detailed reporting
npm run test:comprehensive

# Run test only (without wrapper)
npm run test:communication

# Run with Playwright UI
npx playwright test e2e/tests/comprehensive/widget-dashboard-communication.spec.ts --ui
```

### Test Output

#### Console Output
- Real-time progress updates
- Test step completion status
- Error messages and warnings
- Performance metrics
- Final summary report

#### Generated Reports
- **JSON Report**: `e2e/reports/comprehensive-test-report.json`
- **HTML Report**: `e2e/reports/comprehensive-test-report.html`
- **Diagnostics Report**: `e2e/reports/diagnostics-report.txt`
- **Playwright Report**: `e2e/reports/test-results/`

## Diagnostics and Monitoring

### Performance Metrics
- **Setup Time**: Time to initialize widget and dashboard contexts
- **Message Delivery Time**: Widget→Dashboard and Dashboard→Widget timing
- **API Response Times**: All API calls are timed and logged
- **Real-time Update Latency**: WebSocket message delivery timing

### Error Tracking
- **Console Errors**: JavaScript errors from both contexts
- **Network Errors**: Failed API requests and network issues
- **Page Errors**: Unhandled exceptions and crashes
- **Test Failures**: Specific test assertion failures

### WebSocket Monitoring
- **Connection Status**: Real-time connection health
- **Message Flow**: Tracking of real-time messages
- **Reconnection Events**: Connection drops and recoveries
- **Channel Subscriptions**: Active channel monitoring

## Troubleshooting

### Common Issues

#### Test Setup Failures
- **Server Not Running**: Ensure development server is on port 3005
- **Missing Test Data**: Run test data setup scripts
- **Authentication Issues**: Verify test credentials are valid
- **Environment Variables**: Check Supabase configuration

#### Communication Failures
- **Message Delivery**: Check WebSocket connections and API endpoints
- **Typing Indicators**: Verify real-time broadcasting is working
- **Read Receipts**: Check read receipt API endpoints
- **Real-time Updates**: Verify Supabase Realtime configuration

#### AI Handover Issues
- **No AI Responses**: Check AI service configuration and triggers
- **Handover Controls**: Verify handover UI components exist
- **Confidence Scores**: Check AI confidence scoring implementation

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
DEBUG=1 npm run test:comprehensive
PLAYWRIGHT_DEBUG=1 npm run test:communication
```

### Manual Testing
For manual verification:
1. Open `http://localhost:3005/widget-demo` in one browser tab
2. Open `http://localhost:3005/dashboard` in another tab
3. Login as agent (jam@jam.com / password123)
4. Navigate to test conversation
5. Test bidirectional communication manually

## Test Maintenance

### Updating Test Data
- Modify `e2e/test-data-setup.ts` for new test scenarios
- Update `TEST_CONFIG` constants for new IDs or URLs
- Regenerate test data with `npm run test:data:setup`

### Adding New Test Scenarios
1. Add new test methods to `CommunicationTestRunner` class
2. Update the main test execution flow
3. Add corresponding verification in setup script
4. Update documentation

### Performance Optimization
- Adjust timeout values in `TEST_CONFIG.TIMEOUTS`
- Optimize test selectors for faster element location
- Reduce unnecessary wait times
- Parallelize independent test scenarios

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Comprehensive Communication Test
  run: |
    npm run test:verify-setup
    npm run test:comprehensive
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Test Artifacts
- Upload test reports as CI artifacts
- Store screenshots and videos of failures
- Archive performance metrics for trend analysis

## Success Criteria

The test is considered successful when:
- ✅ All message delivery scenarios pass
- ✅ Real-time features work bidirectionally
- ✅ AI handover functionality operates correctly
- ✅ Error scenarios are handled gracefully
- ✅ Performance metrics are within acceptable ranges
- ✅ No critical errors are encountered
- ✅ WebSocket connections remain stable

## Future Enhancements

### Planned Improvements
- **Load Testing**: Multiple concurrent users
- **Mobile Testing**: Mobile browser contexts
- **Accessibility Testing**: Screen reader and keyboard navigation
- **Performance Benchmarking**: Automated performance regression detection
- **Visual Testing**: Screenshot comparison for UI consistency
- **API Contract Testing**: Schema validation for API responses
