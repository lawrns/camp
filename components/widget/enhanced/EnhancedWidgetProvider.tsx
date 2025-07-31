"use client";

import React from 'react';
import { EnhancedWidget } from './EnhancedWidget';

// Widget configuration interface
export interface WidgetConfig {
  organizationName: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  showWelcomeMessage?: boolean;
  enableFAQ?: boolean;
  enableHelp?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    businessHours?: any;
  };
}

interface EnhancedWidgetProviderProps {
  organizationId: string;
  debug?: boolean;
  config: WidgetConfig;
  children?: React.ReactNode;
}

const defaultConfig: WidgetConfig = {
  organizationName: "Support",
  primaryColor: "#3b82f6",
  position: "bottom-right",
  welcomeMessage: "Hello! How can we help you today?",
  showWelcomeMessage: true,
  enableFAQ: true,
  enableHelp: true,
  contactInfo: {
    email: "support@example.com",
    phone: "+1 (555) 123-4567",
    businessHours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "Closed"
    }
  }
};

export const EnhancedWidgetProvider: React.FC<EnhancedWidgetProviderProps> = ({
  organizationId,
  debug = false,
  config,
  children
}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <>
      {children}
      <EnhancedWidget
        organizationId={organizationId}
        config={mergedConfig}
        debug={debug}
      />
    </>
  );
};