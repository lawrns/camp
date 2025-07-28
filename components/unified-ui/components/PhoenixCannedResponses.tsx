import React from "react";
import { Button } from "./Button";

interface CannedResponse {
  id: string;
  text: string;
  shortcut: number;
}

interface CannedResponsesProps {
  responses: CannedResponse[];
  onSelect: (text: string) => void;
  visible?: boolean;
}

export function CannedResponses({ responses, onSelect, visible = true }: CannedResponsesProps) {
  if (!visible || responses.length === 0) return null;

  // Only show first 5 responses
  const displayResponses = responses.slice(0, 5);

  const handleSelect = (response: CannedResponse) => {
    onSelect(response.text);
    // Track usage for metrics
    if ((window as any).analytics) {
      (window as any).analytics.track("canned_response:button", {
        responseId: response.id,
        shortcut: response.shortcut,
      });
    }
  };

  return (
    <div className="phoenix-canned-responses">
      <div className="phoenix-canned-header">Quick Replies (press 1-5):</div>
      <div className="phoenix-canned-list">
        {displayResponses.map((response, index) => (
          <Button
            key={response.id}
            onClick={() => handleSelect(response)}
            variant="secondary"
            className="phoenix-canned-button"
            title={`Press ${index + 1} to send "${response.text}"`}
          >
            <span className="phoenix-canned-shortcut">{index + 1}</span>
            <span className="phoenix-canned-text">{response.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
