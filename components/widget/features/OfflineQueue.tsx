"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { logWidgetEvent } from '@/lib/monitoring/widget-logger';

interface QueuedMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'visitor';
  attachments?: File[];
  metadata?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineQueueConfig {
  organizationId: string;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  maxQueueSize?: number;
  storageKey?: string;
  onMessageSent?: (messageId: string) => void;
  onMessageFailed?: (messageId: string, error: string) => void;
  onQueueStatusChange?: (hasQueuedMessages: boolean) => void;
}

export class OfflineQueue {
  private config: {
    organizationId: string;
    maxRetries: number;
    retryDelay: number;
    maxQueueSize: number;
    storageKey: string;
    onMessageSent?: (messageId: string) => void;
    onMessageFailed?: (messageId: string, error: string) => void;
    onQueueStatusChange?: (hasQueuedMessages: boolean) => void;
  };
  private queue: QueuedMessage[] = [];
  private isOnline: boolean = navigator.onLine;
  private isProcessing: boolean = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(config: OfflineQueueConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 5000,
      maxQueueSize: 50,
      storageKey: 'widget_offline_queue',
      ...config
    };

    this.loadQueue();
    this.setupNetworkListeners();
  }

  // Add message to queue
  async addMessage(message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    // Add to queue
    this.queue.push(queuedMessage);
    
    // Enforce max queue size
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift(); // Remove oldest message
    }

    this.saveQueue();
    this.config.onQueueStatusChange?.(this.queue.length > 0);

    logWidgetEvent('widget_offline_message_queued', {
      messageId: queuedMessage.id,
      queueSize: this.queue.length,
      organizationId: this.config.organizationId
    });

    // Try to process queue if online
    if (this.isOnline) {
      this.processQueue();
    }

    return queuedMessage.id;
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.isProcessing = true;

    try {
      for (const message of [...this.queue]) {
        await this.processMessage(message);
      }
    } catch (error) {
      console.error('[OfflineQueue] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a single message
  private async processMessage(message: QueuedMessage): Promise<void> {
    try {
      // Check if message has exceeded max retries
      if (message.retryCount >= message.maxRetries) {
        this.removeMessage(message.id);
        this.config.onMessageFailed?.(message.id, 'Max retries exceeded');
        return;
      }

      // Prepare form data for file uploads
      const formData = new FormData();
      formData.append('conversationId', message.conversationId);
      formData.append('content', message.content);
      formData.append('senderType', message.senderType);
      
      if (message.attachments) {
        message.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      // Send message
      const response = await fetch('/api/widget/messages', {
        method: 'POST',
        headers: {
          'X-Organization-ID': this.config.organizationId,
        },
        body: formData
      });

      if (response.ok) {
        // Message sent successfully
        this.removeMessage(message.id);
        this.config.onMessageSent?.(message.id);

        logWidgetEvent('widget_offline_message_sent', {
          messageId: message.id,
          queueSize: this.queue.length,
          organizationId: this.config.organizationId
        });
      } else {
        // Increment retry count
        message.retryCount++;
        this.saveQueue();

        // Schedule retry
        setTimeout(() => {
          this.processQueue();
        }, this.config.retryDelay * message.retryCount); // Exponential backoff
      }
    } catch (error) {
      console.error('[OfflineQueue] Error sending message:', error);
      
      // Increment retry count
      message.retryCount++;
      this.saveQueue();

      // Schedule retry
      setTimeout(() => {
        this.processQueue();
      }, this.config.retryDelay * message.retryCount);
    }
  }

  // Remove message from queue
  private removeMessage(messageId: string): void {
    this.queue = this.queue.filter(msg => msg.id !== messageId);
    this.saveQueue();
    this.config.onQueueStatusChange?.(this.queue.length > 0);
  }

  // Save queue to localStorage
  private saveQueue(): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Error saving queue:', error);
    }
  }

  // Load queue from localStorage
  private loadQueue(): void {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        this.queue = JSON.parse(saved);
        this.config.onQueueStatusChange?.(this.queue.length > 0);
      }
    } catch (error) {
      console.error('[OfflineQueue] Error loading queue:', error);
    }
  }

  // Setup network listeners
  private setupNetworkListeners(): void {
    const handleOnline = () => {
      this.isOnline = true;
      logWidgetEvent('widget_network_online', {
        queueSize: this.queue.length,
        organizationId: this.config.organizationId
      });
      this.processQueue();
    };

    const handleOffline = () => {
      this.isOnline = false;
      logWidgetEvent('widget_network_offline', {
        queueSize: this.queue.length,
        organizationId: this.config.organizationId
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  // Public methods
  getQueueSize(): number {
    return this.queue.length;
  }

  hasQueuedMessages(): boolean {
    return this.queue.length > 0;
  }

  getQueuedMessages(): QueuedMessage[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.config.onQueueStatusChange?.(false);
  }

  // Force process queue (for manual retry)
  async forceProcess(): Promise<void> {
    await this.processQueue();
  }
}

// React hook for offline queue
export function useOfflineQueue(config: OfflineQueueConfig) {
  const queueRef = useRef<OfflineQueue | null>(null);
  const [hasQueuedMessages, setHasQueuedMessages] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new OfflineQueue({
        ...config,
        onQueueStatusChange: (hasQueued) => {
          setHasQueuedMessages(hasQueued);
          config.onQueueStatusChange?.(hasQueued);
        }
      });
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [config]);

  const addMessage = useCallback(async (message: Omit<QueuedMessage, 'id' | 'timestamp' | 'retryCount'>) => {
    if (!queueRef.current) return '';
    return await queueRef.current.addMessage(message);
  }, []);

  const getQueueSize = useCallback(() => {
    return queueRef.current?.getQueueSize() || 0;
  }, []);

  const getQueuedMessages = useCallback(() => {
    return queueRef.current?.getQueuedMessages() || [];
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current?.clearQueue();
  }, []);

  const forceProcess = useCallback(async () => {
    await queueRef.current?.forceProcess();
  }, []);

  return {
    addMessage,
    getQueueSize,
    getQueuedMessages,
    clearQueue,
    forceProcess,
    hasQueuedMessages,
    isOnline
  };
} 