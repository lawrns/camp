import React, { createContext, ReactNode, useContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "agent" | "user";
  organizationId: string;
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  organizationId?: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export useAuth as an alias for useAuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const signIn = async (email: string, password: string) => {
    // Implementation placeholder
  };

  const signOut = async () => {
    // Implementation placeholder
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Implementation placeholder
  };

  const refreshSession = async () => {
    // Implementation placeholder
  };

  const value: AuthContextType = {
    session: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn,
    signOut,
    signUp,
    refreshSession,
    organizationId: undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
