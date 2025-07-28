import { useState } from "react";

export interface EscalationResult {
  draft: string;
}

interface UseEscalationProps {
  channelId: string;
  onDraft: (draft: string) => void;
}

export const useEscalation = ({ channelId, onDraft }: UseEscalationProps) => {
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
    setError(null);
  };

  const generateDraft = async () => {
    if (!selectedProfile) {
      setError("Please select a profile");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/campfire/rag/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, personaId: selectedProfile }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate draft: ${res.statusText}`);
      }

      const json = await res.json();

      if (json.draft) {
        onDraft(json.draft);

        // Enqueue for operator handoff
        await fetch("/api/campfire/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId,
            personaId: selectedProfile,
            draft: json.draft,
          }),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate draft";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    selectedProfile,
    selectProfile,
    generateDraft,
    isGenerating,
    error,
    canGenerate: !!selectedProfile && !isGenerating,
  };
};
