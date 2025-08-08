/**
 * PIXEL-PERFECT WIDGET HEADER COMPONENT
 *
 * Standardized header component with consistent branding, status indicators,
 * and action buttons following the design system
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { WidgetIconButton } from './WidgetButton';
import { SPACING, COLORS, RADIUS, LAYOUT, ANIMATIONS, TYPOGRAPHY } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface WidgetHeaderProps {
  organizationName?: string;
  organizationLogo?: string;
  isConnected?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
  showMinimize?: boolean;
  showExpand?: boolean;
  showClose?: boolean;
  isExpanded?: boolean;
  className?: string;
  onMinimize?: () => void;
  onExpand?: () => void;
  onClose?: () => void;
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================
function StatusIndicator({ 
  status = 'connected' 
}: { 
  status?: 'connected' | 'connecting' | 'disconnected' | 'error' 
}) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: '#10b981',
          text: 'Connected',
          animate: false,
        };
      case 'connecting':
        return {
          color: '#f59e0b',
          text: 'Connecting...',
          animate: true,
        };
      case 'disconnected':
        return {
          color: '#6b7280',
          text: 'Disconnected',
          animate: false,
        };
      case 'error':
        return {
          color: '#ef4444',
          text: 'Connection Error',
          animate: true,
        };
      default:
        return {
          color: '#6b7280',
          text: 'Unknown',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <motion.div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
        animate={config.animate ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={config.animate ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
      <span
        style={{
          fontSize: TYPOGRAPHY.timestamp.fontSize,
          lineHeight: TYPOGRAPHY.timestamp.lineHeight,
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {config.text}
      </span>
      {/* E2E presence test hooks */}
      {(status === 'connected' || status === 'connecting') && (
        <span data-testid="agent-status-online" className="ml-2 inline-flex items-center text-[10px] text-white/90">Online</span>
      )}
      {status === 'disconnected' && (
        <span data-testid="agent-status-offline" className="ml-2 inline-flex items-center text-[10px] text-white/90">Offline</span>
      )}
    </div>
  );
}

// ============================================================================
// ORGANIZATION LOGO
// ============================================================================
function OrganizationLogo({ 
  logo, 
  name 
}: { 
  logo?: string; 
  name: string; 
}) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={`${name} logo`}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }

  // Default fire emoji logo
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
      }}
    >
      🔥
    </div>
  );
}

// ============================================================================
// PIXEL-PERFECT WIDGET HEADER
// ============================================================================
export function WidgetHeader({
  organizationName = "Campfire",
  organizationLogo,
  isConnected = true,
  connectionStatus,
  showMinimize = true,
  showExpand = true,
  showClose = true,
  isExpanded = false,
  className,
  onMinimize,
  onExpand,
  onClose,
}: WidgetHeaderProps) {
  
  // Determine connection status
  const status = connectionStatus || (isConnected ? 'connected' : 'connecting');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: parseFloat(ANIMATIONS.normal) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex items-center justify-between text-white',
        className
      )}
      style={{
        height: LAYOUT.header.height,
        padding: LAYOUT.header.padding,
        background: `linear-gradient(135deg, ${COLORS.primary[600]} 0%, ${COLORS.primary[700]} 100%)`,
        borderTopLeftRadius: RADIUS.widget,
        borderTopRightRadius: RADIUS.widget,
      }}
    >
      {/* Left side - Organization info */}
      <div className="flex items-center" style={{ gap: SPACING.md }}>
        <OrganizationLogo logo={organizationLogo} name={organizationName} />
        
        <div>
          <div
            style={{
              fontSize: TYPOGRAPHY.header.fontSize,
              lineHeight: TYPOGRAPHY.header.lineHeight,
              fontWeight: TYPOGRAPHY.header.fontWeight,
              color: 'white',
            }}
          >
            {organizationName}
          </div>
          <StatusIndicator status={status} />
        </div>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center" style={{ gap: SPACING.xs }}>
        {showMinimize && onMinimize && (
          <WidgetIconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 12h12" />
              </svg>
            }
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            aria-label="Minimize widget"
            style={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        )}

        {showExpand && onExpand && (
          <WidgetIconButton
            icon={
              isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )
            }
            variant="ghost"
            size="sm"
            onClick={onExpand}
            aria-label={isExpanded ? "Restore widget" : "Expand widget"}
            style={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        )}

        {showClose && onClose && (
          <WidgetIconButton
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            }
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close widget"
            style={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// COMPACT HEADER VARIANT
// ============================================================================
export interface CompactWidgetHeaderProps extends Omit<WidgetHeaderProps, 'showMinimize' | 'showExpand'> {
  showRestore?: boolean;
  onRestore?: () => void;
}

export function CompactWidgetHeader({
  organizationName = "Campfire",
  organizationLogo,
  isConnected = true,
  connectionStatus,
  showRestore = true,
  showClose = true,
  className,
  onRestore,
  onClose,
}: CompactWidgetHeaderProps) {
  const status = connectionStatus || (isConnected ? 'connected' : 'connecting');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: parseFloat(ANIMATIONS.fast) / 1000,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      className={cn(
        'flex items-center justify-between text-white',
        className
      )}
      style={{
        height: '48px',
        padding: '8px 12px',
        background: `linear-gradient(135deg, ${COLORS.primary[600]} 0%, ${COLORS.primary[700]} 100%)`,
        borderRadius: RADIUS.widget,
      }}
    >
      {/* Left side - Compact organization info */}
      <div className="flex items-center" style={{ gap: SPACING.sm }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          }}
        >
          🔥
        </div>
        
        <div>
          <div
            style={{
              fontSize: '13px',
              lineHeight: '16px',
              fontWeight: '600',
              color: 'white',
            }}
          >
            {organizationName}
          </div>
          {/* E2E presence test hooks (compact) */}
          {(status === 'connected' || status === 'connecting') && (
            <span data-testid="agent-status-online" className="ml-2 inline-flex items-center text-[10px] text-white/90">Online</span>
          )}
          {status === 'disconnected' && (
            <span data-testid="agent-status-offline" className="ml-2 inline-flex items-center text-[10px] text-white/90">Offline</span>
          )}
        </div>
      </div>

      {/* Right side - Compact actions */}
      <div className="flex items-center" style={{ gap: SPACING.xs }}>
        {showRestore && onRestore && (
          <WidgetIconButton
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            }
            variant="ghost"
            size="xs"
            onClick={onRestore}
            aria-label="Restore widget"
            style={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        )}

        {showClose && onClose && (
          <WidgetIconButton
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            }
            variant="ghost"
            size="xs"
            onClick={onClose}
            aria-label="Close widget"
            style={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
