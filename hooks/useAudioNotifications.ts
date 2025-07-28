import { useCallback, useEffect, useState } from "react";
import { audioNotificationService } from "@/services/AudioNotificationService";

interface AudioNotificationOptions {
  enabled?: boolean;
  volume?: number;
  soundUrl?: string;
  onError?: (error: Error) => void;
}

export function useAudioNotifications(options: AudioNotificationOptions = {}) {
  const {
    enabled: initialEnabled = true,
    volume: initialVolume = 0.7,
    soundUrl = "/notification.mp3",
    onError,
  } = options;

  const [enabled, setEnabled] = useState(initialEnabled);
  const [volume, setVolume] = useState(initialVolume);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize service settings
  useEffect(() => {
    audioNotificationService.setEnabled(enabled);
    audioNotificationService.setVolume(volume);
  }, [enabled, volume]);

  // Preload notification sound
  useEffect(() => {
    audioNotificationService.preloadAudio(soundUrl).catch((error) => {
      onError?.(error);
    });
  }, [soundUrl, onError]);

  // Play notification sound
  const playNotification = useCallback(async () => {
    try {
      setIsPlaying(true);
      await audioNotificationService.playNotification(soundUrl);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsPlaying(false);
    }
  }, [soundUrl, onError]);

  // Play notification regardless of tab visibility
  const playBackgroundNotification = useCallback(async () => {
    try {
      setIsPlaying(true);
      await audioNotificationService.playIfBackground(soundUrl);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsPlaying(false);
    }
  }, [soundUrl, onError]);

  // Test notification sound
  const testSound = useCallback(async () => {
    try {
      await audioNotificationService.testSound(soundUrl);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [soundUrl, onError]);

  // Update enabled state
  const toggleEnabled = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    audioNotificationService.setEnabled(newEnabled);
  }, [enabled]);

  // Update volume
  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    audioNotificationService.setVolume(newVolume);
  }, []);

  return {
    enabled,
    volume,
    isPlaying,
    playNotification,
    playBackgroundNotification,
    testSound,
    toggleEnabled,
    setEnabled: (value: boolean) => {
      setEnabled(value);
      audioNotificationService.setEnabled(value);
    },
    setVolume: updateVolume,
    settings: audioNotificationService.getSettings(),
  };
}
