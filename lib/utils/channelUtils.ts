/**
 * Channel naming and cleanup utilities for standardized realtime communication
 * @deprecated Use UNIFIED_CHANNELS from @/lib/realtime/unified-channel-standards instead
 */

import { UNIFIED_CHANNELS } from '@/lib/realtime/unified-channel-standards';

export interface ChannelConfig {
    orgId: string;
    convId?: string;
    type?: 'conversations' | 'messages' | 'typing' | 'notifications';
    userId?: string;
}

/**
 * Generate standardized channel names for realtime subscriptions
 * @deprecated Use UNIFIED_CHANNELS directly instead
 */
export function getChannelName(config: ChannelConfig): string {
    const { orgId, convId, type = 'messages', userId } = config;

    if (type === 'conversations') {
        return UNIFIED_CHANNELS.conversations(orgId);
    }

    if (type === 'notifications') {
        return userId ? UNIFIED_CHANNELS.userNotifications(orgId, userId) : UNIFIED_CHANNELS.notifications(orgId);
    }

    if (!convId) {
        throw new Error(`Conversation ID required for channel type: ${type}`);
    }

    if (type === 'typing') {
        return UNIFIED_CHANNELS.conversationTyping(orgId, convId);
    }

    return UNIFIED_CHANNELS.conversation(orgId, convId);
}

/**
 * Safe channel cleanup function that handles both off() and unsubscribe() methods
 */
export function safeChannelCleanup(channel: unknown): void {
    if (!channel) return;

    try {
        if (typeof channel.unsubscribe === 'function') {
            channel.unsubscribe();
        } else if (typeof channel.off === 'function') {
            channel.off();
        } else if (typeof channel.removeAllListeners === 'function') {
            channel.removeAllListeners();
        }
    } catch (error) {
        console.warn('Channel cleanup error:', error);
    }
}

/**
 * Validate channel name format
 */
export function validateChannelName(channelName: string): boolean {
    const pattern = /^org:[^:]+:(conversations|conversation:[^:]+:(messages|typing)|notifications(?::[^:]+)?)$/;
    return pattern.test(channelName);
}

/**
 * Extract organization ID from channel name
 */
export function extractOrgIdFromChannel(channelName: string): string | null {
    const match = channelName.match(/^org:([^:]+):/);
    return match ? match[1] : null;
}

/**
 * Extract conversation ID from channel name
 */
export function extractConvIdFromChannel(channelName: string): string | null {
    const match = channelName.match(/conversation:([^:]+):/);
    return match ? match[1] : null;
} 