// This file contains TypeScript types and interfaces for the app

export interface CampfireWidgetTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: string;
}

export interface CampfireWidgetConfig {
  mailboxSlug?: string;
  theme?: CampfireWidgetTheme;
  position?: "left" | "right";
  customStyles?: Record<string, string | number>;
  [key: string]: unknown;
}

export interface WidgetMessage {
  type?: string | undefined;
  action?: string | undefined;
  content?: Record<string, unknown> | string | number | boolean | null | undefined;
  id?: string | undefined;
  sessionId?: string | undefined;
  senderType?: string | undefined;
  timestamp?: Date | undefined;
  metadata?:
    | {
        fileAttachments?: {
          name: string;
          url: string;
          type: string;
          size: number;
        }[];
      }
    | undefined;
}

export type ReadPageToolConfig = {
  toolName: string;
  toolDescription: string;
  pageHTML: string;
  pageContent: string;
};
