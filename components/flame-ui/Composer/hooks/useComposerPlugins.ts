"use client";

import { useCallback, useState } from "react";
import type { ComposerPlugin, UseComposerPluginsReturn } from "../types";

export function useComposerPlugins(enabledPluginIds: string[]): UseComposerPluginsReturn {
  const [plugins, setPlugins] = useState<Map<string, ComposerPlugin>>(new Map());

  const registerPlugin = useCallback(
    (plugin: ComposerPlugin) => {
      if (enabledPluginIds.includes(plugin.id)) {
        setPlugins((prev) => new Map(prev.set(plugin.id, plugin)));
      }
    },
    [enabledPluginIds]
  );

  const unregisterPlugin = useCallback((pluginId: string) => {
    setPlugins((prev) => {
      const newPlugins = new Map(prev);
      newPlugins.delete(pluginId);
      return newPlugins;
    });
  }, []);

  const executePlugin = useCallback(
    (pluginId: string, action: string, data?: any) => {
      const plugin = plugins.get(pluginId);
      if (plugin) {
        // Plugin execution logic - this can be extended based on plugin needs
      }
    },
    [plugins]
  );

  const getPlugin = useCallback(
    (pluginId: string) => {
      return plugins.get(pluginId);
    },
    [plugins]
  );

  const enabledPlugins = Array.from(plugins.values()).filter((plugin: any) => plugin.enabled);

  return {
    enabledPlugins,
    registerPlugin,
    unregisterPlugin,
    executePlugin,
    getPlugin,
  };
}
