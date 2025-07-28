/**
 * Audio Notification Service
 * Handles playing notification sounds for incoming messages
 */

export class AudioNotificationService {
  private static instance: AudioNotificationService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.7;
  private userInteracted: boolean = false;

  private constructor() {
    // Initialize with user interaction tracking
    this.setupUserInteractionTracking();
    this.loadPreferences();
  }

  static getInstance(): AudioNotificationService {
    if (!AudioNotificationService.instance) {
      AudioNotificationService.instance = new AudioNotificationService();
    }
    return AudioNotificationService.instance;
  }

  /**
   * Setup tracking for user interaction (required for autoplay)
   */
  private setupUserInteractionTracking() {
    // Only run in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const interactionEvents = ["click", "touchstart", "keydown", "mousedown", "pointerdown"];

    const handleInteraction = () => {
      this.userInteracted = true;
      // Remove listeners after first interaction
      interactionEvents.forEach((event: any) => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    // Check if user has already interacted (page is loaded and active)
    if (document.readyState === "complete" || document.readyState === "interactive") {
      // Give a brief moment for any existing interactions to be detected
      setTimeout(() => {
        if (!this.userInteracted) {
        }
      }, 500);
    }

    interactionEvents.forEach((event: any) => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });
  }

  /**
   * Load user preferences from localStorage
   */
  private loadPreferences() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("campfire-audio-preferences");
      if (saved) {
        try {
          const prefs = JSON.parse(saved);
          this.enabled = prefs.enabled ?? true;
          this.volume = prefs.volume ?? 0.7;
        } catch (e) {}
      }
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private savePreferences() {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "campfire-audio-preferences",
        JSON.stringify({
          enabled: this.enabled,
          volume: this.volume,
        })
      );
    }
  }

  /**
   * Preload an audio file
   */
  async preloadAudio(url: string): Promise<HTMLAudioElement> {
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.volume = this.volume;

      audio.addEventListener(
        "canplaythrough",
        () => {
          this.audioCache.set(url, audio);
          resolve(audio);
        },
        { once: true }
      );

      audio.addEventListener(
        "error",
        (e) => {
          reject(e);
        },
        { once: true }
      );

      audio.src = url;
    });
  }

  /**
   * Play a notification sound
   */
  async playNotification(audioUrl: string = "/notification.mp3"): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    // If user hasn't interacted yet, silently skip
    if (!this.userInteracted) {
      return;
    }

    try {
      // Get or create audio element
      let audio = this.audioCache.get(audioUrl);

      if (!audio) {
        audio = await this.preloadAudio(audioUrl);
      }

      // Clone the audio to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = this.volume;

      // Handle autoplay policy with better error handling
      const playPromise = audioClone.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {})
          .catch((error) => {
            // Handle different types of errors more gracefully
            if (error.name === "NotAllowedError") {
              // Don't retry automatically to avoid console spam
            } else if (error.name === "AbortError") {
            } else if (error.name === "NotSupportedError") {
            } else {
            }
          });
      }

      // Clean up cloned audio after playing or on error
      const cleanup = () => {
        try {
          audioClone.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      };

      audioClone.addEventListener("ended", cleanup);
      audioClone.addEventListener("error", cleanup);

      // Fallback cleanup after 10 seconds
      setTimeout(cleanup, 10000);
    } catch (error) {}
  }

  /**
   * Play notification with tab visibility check
   */
  async playIfBackground(audioUrl?: string): Promise<void> {
    // Play regardless of tab visibility as per requirement
    await this.playNotification(audioUrl);
  }

  /**
   * Enable/disable notifications
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.savePreferences();
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));

    // Update volume for all cached audio elements
    this.audioCache.forEach((audio: any) => {
      audio.volume = this.volume;
    });

    this.savePreferences();
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      userInteracted: this.userInteracted,
    };
  }

  /**
   * Test notification sound
   */
  async testSound(audioUrl: string = "/notification.mp3"): Promise<void> {
    const originalEnabled = this.enabled;
    this.enabled = true;
    await this.playNotification(audioUrl);
    this.enabled = originalEnabled;
  }

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
  }
}

// Export singleton instance
export const audioNotificationService = AudioNotificationService.getInstance();
