"use client";

import { useCallback, useEffect, useState } from "react";

interface WidgetConfig {
  appearance?: {
    position?: string;
    colors?: {
      primary?: string;
      background?: string;
    };
    size?: string;
    borderRadius?: number;
  };
  behavior?: {
    welcomeMessage?: string;
    autoOpen?: boolean;
    autoOpenDelay?: number;
    showOnMobile?: boolean;
    collectEmail?: boolean;
  };
  businessHours?: {
    enabled?: boolean;
    timezone?: string;
    schedule?: Record<string, { start: string; end: string; enabled: boolean }>;
  };
  security?: {
    allowedDomains?: string[];
    rateLimiting?: {
      enabled?: boolean;
      maxMessages?: number;
      windowMinutes?: number;
    };
  };
  ai?: {
    enabled?: boolean;
    model?: string;
    systemPrompt?: string;
    autoHandoff?: boolean;
    confidenceThreshold?: number;
  };
}

const defaultConfig: WidgetConfig = {
  appearance: {
    position: "bottom-right",
    colors: {
      primary: "#246BFF",
      background: "#FFFFFF",
    },
    size: "medium",
    borderRadius: 12,
  },
  behavior: {
    welcomeMessage: "Hi! How can we help you today?",
    autoOpen: false,
    autoOpenDelay: 3,
    showOnMobile: true,
    collectEmail: false,
  },
  businessHours: {
    enabled: false,
    timezone: "America/New_York",
    schedule: {
      monday: { start: "09:00", end: "17:00", enabled: true },
      tuesday: { start: "09:00", end: "17:00", enabled: true },
      wednesday: { start: "09:00", end: "17:00", enabled: true },
      thursday: { start: "09:00", end: "17:00", enabled: true },
      friday: { start: "09:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "17:00", enabled: false },
      sunday: { start: "09:00", end: "17:00", enabled: false },
    },
  },
  security: {
    allowedDomains: [],
    rateLimiting: {
      enabled: false,
      maxMessages: 50,
      windowMinutes: 60,
    },
  },
  ai: {
    enabled: false,
    model: "gpt-3.5-turbo",
    systemPrompt: "You are a helpful customer support assistant.",
    autoHandoff: true,
    confidenceThreshold: 0.7,
  },
};

export function useWidgetConfiguration(organizationId?: string) {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  // Load configuration
  const loadConfiguration = useCallback(async () => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/organizations/${organizationId}/widget-config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || defaultConfig);
      }
    } catch (error) {}
  }, [organizationId]);

  // Save configuration
  const saveConfiguration = useCallback(async () => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/widget-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      // TODO: Show success toast
    } catch (error) {
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [organizationId, config]);

  // Generate embed code
  const generateEmbedCode = useCallback(() => {
    const code = `<!-- Campfire Widget -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  '${window.location.origin}/api/widget/script?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','campfireWidget','${organizationId}');
</script>
<script>
  window.campfireWidget = window.campfireWidget || [];
  window.campfireWidget.push({
    config: ${JSON.stringify(config, null, 2)}
  });
</script>
<!-- End Campfire Widget -->`;

    setEmbedCode(code);
    return code;
  }, [organizationId, config]);

  // Update config
  const updateConfig = useCallback((field: string, value: any) => {
    if (field === "config") {
      setConfig(value);
    } else {
      setConfig((prev) => ({ ...prev, [field]: value }));
    }
  }, []);

  // Apply template
  const applyTemplate = useCallback((template: any) => {
    setConfig({
      ...defaultConfig,
      ...template.config,
    });
  }, []);

  // Export config
  const exportConfig = useCallback(() => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `widget-config-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [config]);

  // Import config
  const importConfig = useCallback((importedConfig: WidgetConfig) => {
    setConfig({
      ...defaultConfig,
      ...importedConfig,
    });
  }, []);

  // Update preview
  const updatePreview = useCallback(() => {
    // This would typically update an iframe or preview component
    // For now, we'll just regenerate the embed code
    generateEmbedCode();
  }, [generateEmbedCode]);

  // Load config on mount
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  // Generate embed code when config changes
  useEffect(() => {
    generateEmbedCode();
  }, [config, generateEmbedCode]);

  return {
    config,
    updateConfig,
    saveConfiguration,
    loadConfiguration,
    isSaving,
    embedCode,
    generateEmbedCode,
    applyTemplate,
    exportConfig,
    importConfig,
    isWidgetOpen,
    setIsWidgetOpen,
    previewDevice,
    setPreviewDevice,
    previewFullscreen,
    setPreviewFullscreen,
    updatePreview,
  };
}
