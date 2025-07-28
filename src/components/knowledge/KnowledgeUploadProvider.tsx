import React, { createContext, ReactNode, useContext } from "react";

interface KnowledgeUploadContextType {
  isUploading: boolean;
  progress: number;
  uploadFile: (file: File) => Promise<void>;
  uploadText: (text: string, title: string) => Promise<void>;
  categories: string[];
  uploadProgress: number;
  uploadFromUrl: (url: string) => Promise<void>;
  uploadMarkdown: (markdown: string, title: string) => Promise<void>;
  bulkUpload: (files: File[]) => Promise<void>;
  loading: boolean;
}

const KnowledgeUploadContext = createContext<KnowledgeUploadContextType | undefined>(undefined);

export const useKnowledgeUpload = () => {
  const context = useContext(KnowledgeUploadContext);
  if (!context) {
    throw new Error("useKnowledgeUpload must be used within a KnowledgeUploadProvider");
  }
  return context;
};

interface KnowledgeUploadProviderProps {
  children: ReactNode;
}

export const KnowledgeUploadProvider: React.FC<KnowledgeUploadProviderProps> = ({ children }) => {
  const uploadFile = async (file: File) => {
    // Implementation placeholder
  };

  const uploadText = async (text: string, title: string) => {
    // Implementation placeholder
  };

  const uploadFromUrl = async (url: string) => {
    // Implementation placeholder
  };

  const uploadMarkdown = async (markdown: string, title: string) => {
    // Implementation placeholder
  };

  const bulkUpload = async (files: File[]) => {
    // Implementation placeholder
  };

  const value: KnowledgeUploadContextType = {
    isUploading: false,
    progress: 0,
    uploadFile,
    uploadText,
    categories: ["General", "Technical", "Billing", "Support"],
    uploadProgress: 0,
    uploadFromUrl,
    uploadMarkdown,
    bulkUpload,
    loading: false,
  };

  return <KnowledgeUploadContext.Provider value={value}>{children}</KnowledgeUploadContext.Provider>;
};
