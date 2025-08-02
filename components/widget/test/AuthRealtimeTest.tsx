/**
 * Authentication and Real-time Connection Test Component
 * 
 * Comprehensive test component to verify all authentication and real-time fixes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWidgetSupabaseAuth } from '@/hooks/useWidgetSupabaseAuth';
import { useWidgetRealtime } from '../enhanced/useWidgetRealtime';
import { widgetDebugger } from '@/lib/utils/widget-debug';

interface AuthRealtimeTestProps {
  organizationId: string;
  onTestComplete?: (results: TestResults) => void;
}

interface TestResults {
  authTest: boolean;
  jwtValidationTest: boolean;
  realtimeConnectionTest: boolean;
  messageFlowTest: boolean;
  errors: string[];
}

export function AuthRealtimeTest({ organizationId, onTestComplete }: AuthRealtimeTestProps) {
  const [testResults, setTestResults] = useState<TestResults>({
    authTest: false,
    jwtValidationTest: false,
    realtimeConnectionTest: false,
    messageFlowTest: false,
    errors: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [testMessages, setTestMessages] = useState<string[]>([]);

  const auth = useWidgetSupabaseAuth(organizationId);
  const [conversationId, setConversationId] = useState<string>('');

  const realtime = useWidgetRealtime({
    organizationId,
    conversationId,
    onMessage: (message) => {
      console.log('Test: Message received', message);
      addTestMessage(`✅ Message received: ${message.content}`);
      updateTestResult('messageFlowTest', true);
    },
    onConnectionChange: (connected) => {
      console.log('Test: Connection changed', connected);
      addTestMessage(`🔌 Connection: ${connected ? 'Connected' : 'Disconnected'}`);
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

  const addTestMessage = (message: string) => {
    setTestMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateTestResult = (test: keyof Omit<TestResults, 'errors'>, result: boolean) => {
    setTestResults(prev => ({
      ...prev,
      [test]: result,
    }));
  };

  const addError = (error: string) => {
    setTestResults(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
    addTestMessage(`❌ Error: ${error}`);
  };

  // Test 1: Authentication
  useEffect(() => {
    if (auth.isAuthenticated && auth.session?.access_token) {
      addTestMessage('✅ Authentication successful');
      updateTestResult('authTest', true);

      // Test 2: JWT Validation
      try {
        const tokenParts = auth.session.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp > now) {
            addTestMessage('✅ JWT token is valid and not expired');
            updateTestResult('jwtValidationTest', true);
          } else {
            addError('JWT token is expired');
          }
          
          // Extract conversation ID from metadata if available
          if (auth.user?.conversationId) {
            setConversationId(auth.user.conversationId);
            addTestMessage(`📝 Conversation ID: ${auth.user.conversationId}`);
          }
        } else {
          addError('Invalid JWT token format');
        }
      } catch (e) {
        addError('Failed to decode JWT token');
      }
    } else if (auth.error) {
      addError(`Authentication failed: ${auth.error}`);
    }
  }, [auth.isAuthenticated, auth.session, auth.error, auth.user]);

  // Test 3: Real-time Connection
  useEffect(() => {
    if (realtime.connectionStatus === 'connected') {
      addTestMessage('✅ Real-time connection established');
      updateTestResult('realtimeConnectionTest', true);
    } else if (realtime.connectionError) {
      addError(`Real-time connection failed: ${realtime.connectionError}`);
    }
  }, [realtime.connectionStatus, realtime.connectionError]);

  // Test 4: Message Flow
  const testMessageFlow = async () => {
    if (!conversationId) {
      addError('No conversation ID available for message test');
      return;
    }

    try {
      setCurrentTest('Testing message flow...');
      const testMessage = `Test message - ${Date.now()}`;
      addTestMessage(`📤 Sending test message: ${testMessage}`);
      
      await realtime.sendMessage(testMessage);
      addTestMessage('✅ Message sent successfully');
      
      // Wait a moment for real-time delivery
      setTimeout(() => {
        if (!testResults.messageFlowTest) {
          addError('Message was sent but not received via real-time');
        }
      }, 3000);
    } catch (error) {
      addError(`Message sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults({
      authTest: false,
      jwtValidationTest: false,
      realtimeConnectionTest: false,
      messageFlowTest: false,
      errors: [],
    });
    setTestMessages([]);
    
    addTestMessage('🚀 Starting comprehensive authentication and real-time test...');
    
    // Wait for authentication
    if (!auth.isAuthenticated) {
      setCurrentTest('Waiting for authentication...');
      addTestMessage('⏳ Waiting for authentication...');
    }
    
    // Wait for real-time connection
    if (realtime.connectionStatus !== 'connected') {
      setCurrentTest('Waiting for real-time connection...');
      addTestMessage('⏳ Waiting for real-time connection...');
    }
    
    // Test message flow after a delay
    setTimeout(() => {
      if (auth.isAuthenticated && realtime.connectionStatus === 'connected') {
        testMessageFlow();
      }
    }, 2000);
    
    // Complete test after 10 seconds
    setTimeout(() => {
      setIsRunning(false);
      setCurrentTest('');
      const finalResults = testResults;
      onTestComplete?.(finalResults);
      
      const passedTests = Object.values(finalResults).filter(v => typeof v === 'boolean' && v).length;
      const totalTests = 4;
      addTestMessage(`🏁 Test completed: ${passedTests}/${totalTests} tests passed`);
    }, 10000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'retrying': return 'text-orange-600';
      default: return 'text-red-600';
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Authentication & Real-time Test</h3>
      
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {auth.isAuthenticated ? '✅' : '❌'}
            </span>
            <span>Authentication: {auth.isAuthenticated ? 'Success' : 'Failed'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={realtime.connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {realtime.connectionStatus === 'connected' ? '✅' : '❌'}
            </span>
            <span className={getStatusColor(realtime.connectionStatus)}>
              Real-time: {realtime.connectionStatus}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            Org ID: {organizationId}
          </div>
          <div className="text-sm text-gray-600">
            Conv ID: {conversationId || 'Not set'}
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test Results:</h4>
        <div className="space-y-1 text-sm">
          <div className={testResults.authTest ? 'text-green-600' : 'text-gray-400'}>
            {testResults.authTest ? '✅' : '⏳'} Authentication Test
          </div>
          <div className={testResults.jwtValidationTest ? 'text-green-600' : 'text-gray-400'}>
            {testResults.jwtValidationTest ? '✅' : '⏳'} JWT Validation Test
          </div>
          <div className={testResults.realtimeConnectionTest ? 'text-green-600' : 'text-gray-400'}>
            {testResults.realtimeConnectionTest ? '✅' : '⏳'} Real-time Connection Test
          </div>
          <div className={testResults.messageFlowTest ? 'text-green-600' : 'text-gray-400'}>
            {testResults.messageFlowTest ? '✅' : '⏳'} Message Flow Test
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4">
        <button
          onClick={runComprehensiveTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run Comprehensive Test'}
        </button>
        {currentTest && (
          <div className="mt-2 text-sm text-blue-600">{currentTest}</div>
        )}
      </div>

      {/* Test Messages */}
      <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
        <h4 className="font-medium mb-2">Test Log:</h4>
        {testMessages.length === 0 ? (
          <div className="text-gray-500 text-sm">No test messages yet...</div>
        ) : (
          <div className="space-y-1">
            {testMessages.map((message, index) => (
              <div key={index} className="text-xs font-mono text-gray-700">
                {message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors */}
      {testResults.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
          <div className="space-y-1">
            {testResults.errors.map((error, index) => (
              <div key={index} className="text-sm text-red-700">{error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
