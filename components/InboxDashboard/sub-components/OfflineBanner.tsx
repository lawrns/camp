import React from "react";
import { WifiOff, CheckCircle } from "lucide-react";

interface OfflineBannerProps {
  isOffline: boolean;
  isReconnecting?: boolean;
  onRetry?: () => void;
}

/**
 * Offline banner component that shows when connection is lost
 * Auto-dismisses when connection is restored
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  isReconnecting = false,
  onRetry,
}) => {
  if (!isOffline && !isReconnecting) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isReconnecting ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Reconnecting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-700">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Connection lost</span>
            </div>
          )}
          <span className="text-sm text-gray-600">
            {isReconnecting 
              ? "Attempting to restore connection"
              : "Some features may not work properly"
            }
          </span>
        </div>
        
        {!isReconnecting && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Success banner for when connection is restored
 */
export const ReconnectedBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="bg-green-50 border-b border-green-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">Connection restored</span>
        <span className="text-sm text-green-600">You're back online</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
