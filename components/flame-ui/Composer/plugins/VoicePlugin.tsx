"use client";

import React, { useState } from "react";
import { Mic as Mic, Square } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { ComposerPluginProps } from "../types";

export function VoicePlugin({ pluginId, content, onContentChange, onAction, disabled }: ComposerPluginProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      onAction(pluginId, "recording-stopped");
    } else {
      setIsRecording(true);
      onAction(pluginId, "recording-started");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-ds-md",
        "transition-colors duration-200 hover:bg-[--bg-subtle]",
        "text-[--text-muted] hover:text-[--text-primary]",
        isRecording && "bg-[--status-late]/10 text-[--status-late]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      title={isRecording ? "Stop recording" : "Start voice recording"}
    >
      {isRecording ? <Icon icon={Square} className="h-4 w-4" /> : <Icon icon={Mic} className="h-4 w-4" />}
    </button>
  );
}
