import React, { createContext, useContext, ReactNode } from 'react';

export interface WidgetContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  organizationId?: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

export const WidgetContext = createContext<WidgetContextType | null>(null);

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within WidgetProvider");
  }
  return context;
};

interface WidgetProviderProps {
  children: ReactNode;
  organizationId?: string;
  conversationId?: string;
  userId?: string;
  debug?: boolean;
}

export const WidgetProvider: React.FC<WidgetProviderProps> = ({
  children,
  organizationId,
  conversationId,
  userId,
  debug = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const contextValue: WidgetContextType = {
    isOpen,
    setIsOpen,
    organizationId,
    conversationId,
    userId,
    debug,
  };

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  );
};