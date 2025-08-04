// 🚀 ULTRA-LIGHTWEIGHT SUPABASE CLIENT FOR WIDGET
// Zero heavy imports - just the bare minimum for widget operations

import { supabase } from "../supabase";

// Create a singleton lightweight client
let widgetClient: unknown = null;

export function createWidgetClient() {
  if (!widgetClient) {
    // Use the centralized admin client for widget operations
    widgetClient = supabase.admin();
  }
  return widgetClient;
}
