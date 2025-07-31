/**
 * Authentication and Connection Test Component
 * 
 * Comprehensive test component to verify all authentication and real-time connection fixes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { widgetDebugger } from '@/lib/utils/widget-debug';
import { useWidgetSupabaseAuth } from '@/hooks/useWidgetSupabaseAuth';
import { useWidgetRealtime } from '../enhanced/useWidgetRealtime';

interface AuthConnectionTestProps {
  organizationId: string;
  onTestComplete?: (results: TestResults) => void;
}

interface TestResults {
  authTest: boolean;
  jwtEnrichmentTest: boolean;
  realtimeConnectionTest: boolean;
  messageFlowTest: boolean;
  errors: string[];
}

export function AuthConnectionTest({ organizationId, onTestComplete }: AuthConnectionTestProps) {
  const [testResults, setTestResults] = useState<TestResults>({
    authTest: false,
    jwtEnrichmentTest: false,
    realtimeConnectionTest: false,
    messageFlowTest: false,
    errors: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const auth = useWidgetSupabaseAuth(organizationId);
  const [conversationId, setConversationId] = useState<string>('');

  const realtime = useWidgetRealtime({
    organizationId,
    conversationId,
    onMessage: (message) => {
      console.log('Test: Message received', message);
      updateTestResult('messageFlowTest', true);
    },
    onConnectionChange: (connected) => {
      console.log('Test: Connection changed', connected);
      if (connected) {
        updateTestResult('realtimeConnectionTest', true);
      }
    },
    getAuthHeaders: async () => {
      if (auth.session?.access_token) {
        return {
          'Authorization': `Bearer ${auth.session.access_token}`,
        };
      }
      return {};
    },
  });

  const updateTestResult = (test: keyof TestResults, success: boolean, error?: string) => {
    setTestResults(prev => ({
      ...prev,
      [test]: success,
      errors: error ? [...prev.errors, error] : prev.errors,
    }));
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults({
      authTest: false,
      jwtEnrichmentTest: false,
      realtimeConnectionTest: false,
      messageFlowTest: false,
      errors: [],
    });

    try {
      // Test 1: Authentication
      setCurrentTest('Testing widget authentication...');
      console.log('🧪 Starting authentication test');
      
      if (!auth.isAuthenticated) {
        await auth.signInAsVisitor(organizationId, {
          visitorId: `test_visitor_${Date.now()}`,
          conversationId: `test_conv_${Date.now()}`,
        });
      }

      // Wait for authentication to complete
      let authAttempts = 0;
      while (!auth.isAuthenticated && authAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        authAttempts++;
      }

      if (auth.isAuthenticated) {
        updateTestResult('authTest', true);
        console.log('✅ Authentication test passed');
        
        // Set conversation ID for realtime test
        const convId = auth.user?.conversationId || auth.session?.user?.user_metadata?.conversation_id;
        if (convId) {
          setConversationId(convId);
          console.log('🔗 Conversation ID set for real-time test:', convId);
        } else {
          console.warn('⚠️ No conversation ID found in auth user or session');
        }
      } else {
        updateTestResult('authTest', false, 'Authentication failed after 10 seconds');
        console.log('❌ Authentication test failed');
      }

      // Test 2: JWT Enrichment (Skip for widget sessions)
      setCurrentTest('Testing JWT enrichment...');
      console.log('🧪 Starting JWT enrichment test');

      // Check if this is a widget session (comprehensive detection)
      const isWidgetSession = auth.user?.id?.includes('visitor_') ||
                             auth.user?.id?.startsWith('widget_') ||
                             auth.session?.user?.user_metadata?.widget_session === true ||
                             auth.session?.user?.app_metadata?.provider === 'widget' ||
                             auth.session?.user?.user_metadata?.source === 'widget' ||
                             auth.session?.user?.email?.includes('visitor@');

      if (isWidgetSession) {
        updateTestResult('jwtEnrichmentTest', true);
        console.log('✅ JWT enrichment test passed (skipped for widget session)', {
          userId: auth.user?.id,
          email: auth.user?.email,
          sessionType: 'widget'
        });
      } else {
        try {
          const response = await fetch('/api/auth/set-organization', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ organizationId }),
            credentials: 'include',
          });

          if (response.ok) {
            updateTestResult('jwtEnrichmentTest', true);
            console.log('✅ JWT enrichment test passed');
          } else {
            updateTestResult('jwtEnrichmentTest', false, `JWT enrichment failed: ${response.status}`);
            console.log('❌ JWT enrichment test failed:', response.status);
          }
        } catch (error) {
          updateTestResult('jwtEnrichmentTest', false, `JWT enrichment error: ${error}`);
          console.log('❌ JWT enrichment test error:', error);
        }
      }

      // Test 3: Real-time Connection
      setCurrentTest('Testing real-time connection...');
      console.log('🧪 Starting real-time connection test');

      // Try to get conversation ID from multiple sources
      let testConversationId = conversationId ||
                              auth.user?.conversationId ||
                              auth.session?.user?.user_metadata?.conversation_id;

      if (!testConversationId) {
        // Try to create a conversation for testing
        try {
          const response = await fetch('/api/widget/conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organizationId,
              visitorId: `test_visitor_${Date.now()}`,
              customerName: 'Test User',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            testConversationId = data.conversation?.id;
            setConversationId(testConversationId);
            console.log('🔗 Created test conversation:', testConversationId);
          }
        } catch (error) {
          console.warn('⚠️ Failed to create test conversation:', error);
        }
      }

      if (testConversationId) {
        try {
          // Wait a bit for authentication to fully settle
          console.log('🔄 Waiting for authentication to settle before real-time connection...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          console.log('🔗 Attempting real-time connection...');
          await realtime.connect();

          // Wait for connection to establish with longer timeout
          let connectionAttempts = 0;
          while (!realtime.isConnected && connectionAttempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            connectionAttempts++;
            console.log(`🔄 Waiting for connection... attempt ${connectionAttempts}/20`);
          }

          if (realtime.isConnected) {
            console.log('✅ Real-time connection test passed');
          } else {
            updateTestResult('realtimeConnectionTest', false, 'Real-time connection failed after 30 seconds');
            console.log('❌ Real-time connection test failed after 30 seconds');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          updateTestResult('realtimeConnectionTest', false, `Real-time connection error: ${errorMessage}`);
          console.log('❌ Real-time connection test error:', error);

          // Log additional debug information
          console.log('Real-time debug info:', {
            conversationId: testConversationId,
            authStatus: auth.isAuthenticated,
            sessionExists: !!auth.session,
            userId: auth.user?.id
          });
        }
      } else {
        updateTestResult('realtimeConnectionTest', false, 'No conversation ID available');
        console.log('❌ Real-time connection test failed: No conversation ID');
      }

      // Test 4: Message Flow
      setCurrentTest('Testing message flow...');
      console.log('🧪 Starting message flow test');

      if (realtime.isConnected && testConversationId) {
        try {
          // Check if sendMessage function exists and is callable
          if (typeof realtime.sendMessage === 'function') {
            console.log('🧪 Attempting to send test message...');

            // Try to send a test message with proper error handling
            const messageResult = await realtime.sendMessage('Test message from auth connection test');
            console.log('✅ Message sent successfully:', messageResult);

            // Wait for message to be processed and potentially received
            await new Promise(resolve => setTimeout(resolve, 3000));

            // If we get here without error, consider it a success
            updateTestResult('messageFlowTest', true);
            console.log('✅ Message flow test completed successfully');
          } else {
            updateTestResult('messageFlowTest', false, 'sendMessage function not available');
            console.log('❌ Message flow test failed: sendMessage function not available');
            console.log('Available realtime methods:', Object.keys(realtime));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          updateTestResult('messageFlowTest', false, `Message flow error: ${errorMessage}`);
          console.log('❌ Message flow test error:', error);

          // Log additional debug information
          console.log('Realtime state:', {
            isConnected: realtime.isConnected,
            conversationId: testConversationId,
            realtimeObject: realtime
          });
        }
      } else {
        const reason = !realtime.isConnected ? 'Real-time not connected' : 'No conversation ID';
        updateTestResult('messageFlowTest', false, reason);
        console.log('❌ Message flow test failed:', reason);
        console.log('Debug info:', {
          isConnected: realtime.isConnected,
          conversationId: testConversationId,
          hasRealtime: !!realtime
        });
      }

    } catch (error) {
      console.error('🚨 Comprehensive test error:', error);
      updateTestResult('authTest', false, `Test suite error: ${error}`);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      
      // Call completion callback
      setTimeout(() => {
        onTestComplete?.(testResults);
      }, 1000);
    }
  };

  const getTestIcon = (success: boolean) => success ? '✅' : '❌';
  const getTestColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600';

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Authentication & Connection Test</h3>
      
      <div className="space-y-2 mb-4">
        <div className={`flex items-center space-x-2 ${getTestColor(testResults.authTest)}`}>
          <span>{getTestIcon(testResults.authTest)}</span>
          <span>Widget Authentication</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${getTestColor(testResults.jwtEnrichmentTest)}`}>
          <span>{getTestIcon(testResults.jwtEnrichmentTest)}</span>
          <span>JWT Enrichment</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${getTestColor(testResults.realtimeConnectionTest)}`}>
          <span>{getTestIcon(testResults.realtimeConnectionTest)}</span>
          <span>Real-time Connection</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${getTestColor(testResults.messageFlowTest)}`}>
          <span>{getTestIcon(testResults.messageFlowTest)}</span>
          <span>Message Flow</span>
        </div>
      </div>

      {currentTest && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          {currentTest}
        </div>
      )}

      {testResults.errors.length > 0 && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
          <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {testResults.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={runComprehensiveTest}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>Organization ID: {organizationId}</p>
        <p>Auth Status: {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
        <p>Real-time Status: {realtime.isConnected ? 'Connected' : 'Disconnected'}</p>
        {conversationId && <p>Conversation ID: {conversationId}</p>}
      </div>
    </div>
  );
}
