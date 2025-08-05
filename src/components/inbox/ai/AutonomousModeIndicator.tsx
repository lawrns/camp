/**
 * Autonomous Mode Indicator
 *
 * Shows when AI is operating in autonomous mode
 */

import React from "react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";

export interface AutonomousModeState {
  isActive: boolean;
  confidence: number;
  responseCount: number;
  lastActivity: Date;
}

interface AutonomousModeIndicatorProps {
  state: AutonomousModeState;
  onToggle: () => void;
  className?: string;
}

export const AutonomousModeIndicator: React.FC<AutonomousModeIndicatorProps> = ({ state, onToggle, className }) => {
  const getStatusColor = () => {
    if (!state.isActive) return "bg-gray-500";
    if (state.confidence >= 0.9) return "bg-green-500";
    if (state.confidence >= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (!state.isActive) return "Manual Mode";
    return `Autonomous (${(state.confidence * 100).toFixed(0)}% confidence)`;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Badge className={getStatusColor()}>{getStatusText()}</Badge>

      {state.isActive && (
        <div className="text-foreground text-sm">
          {state.responseCount} responses • Last: {state.lastActivity.toLocaleTimeString()}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={onToggle}>
        {state.isActive ? "Disable" : "Enable"} Autonomous Mode
      </Button>
    </div>
  );
};

export default AutonomousModeIndicator;
