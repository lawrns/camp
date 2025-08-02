/**
 * WIDGET SOUND SERVICE
 * 
 * Handles sound notifications for UltimateWidget
 * Manages audio playback with proper error handling and user interaction
 */

// ============================================================================
// TYPES
// ============================================================================
export interface SoundNotificationOptions {
  volume?: number;
  enabled?: boolean;
  soundUrl?: string;
}

export type NotificationType = 'message' | 'mention' | 'error' | 'system';

// ============================================================================
// WIDGET SOUND SERVICE
// ============================================================================
export class WidgetSoundService {
  private static instance: WidgetSoundService;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.3;
  private userInteracted: boolean = false;
  private defaultSoundUrl: string = '/sound/notification.mp3';

  private constructor() {
    this.initializeUserInteraction();
  }

  static getInstance(): WidgetSoundService {
    if (!WidgetSoundService.instance) {
      WidgetSoundService.instance = new WidgetSoundService();
    }
    return WidgetSoundService.instance;
  }

  // Initialize user interaction tracking
  private initializeUserInteraction(): void {
    if (typeof window === 'undefined') return;

    const interactionEvents = ['click', 'touchstart', 'keydown', 'scroll'];
    
    const handleInteraction = () => {
      this.userInteracted = true;
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    interactionEvents.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
  }

  // Preload audio file
  private async preloadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', () => {
        reject(new Error(`Failed to load audio: ${url}`));
      }, { once: true });

      audio.src = url;
    });
  }

  // Play notification sound
  async playNotification(type: NotificationType = 'message', customUrl?: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return;
    }

    // If user hasn't interacted yet, silently skip
    if (!this.userInteracted) {
      return;
    }

    try {
      // Determine sound URL based on type
      let soundUrl = customUrl || this.defaultSoundUrl;
      
      if (!customUrl) {
        switch (type) {
          case 'mention':
            soundUrl = '/sound/mention.mp3';
            break;
          case 'error':
            soundUrl = '/sound/error.mp3';
            break;
          case 'system':
            soundUrl = '/sound/system.mp3';
            break;
          default:
            soundUrl = this.defaultSoundUrl;
        }
      }

      // Get or create audio element
      let audio = this.audioCache.get(soundUrl);

      if (!audio) {
        audio = await this.preloadAudio(soundUrl);
        this.audioCache.set(soundUrl, audio);
      }

      // Clone the audio to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = this.volume;

      // Handle autoplay policy with better error handling
      const playPromise = audioClone.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Successfully started playing
          })
          .catch((error) => {
            // Handle different types of errors more gracefully
            if (error.name === 'NotAllowedError') {
              // User hasn't interacted yet, this is expected
            } else if (error.name === 'AbortError') {
              // Audio was aborted, this is normal
            } else if (error.name === 'NotSupportedError') {
              // Audio format not supported
              console.warn('Audio format not supported:', soundUrl);
            } else {
              // Other errors
              console.warn('Failed to play audio:', error);
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

      audioClone.addEventListener('ended', cleanup);
      audioClone.addEventListener('error', cleanup);

      // Fallback cleanup after 10 seconds
      setTimeout(cleanup, 10000);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  // Play notification with tab visibility check
  async playIfBackground(type: NotificationType = 'message', customUrl?: string): Promise<void> {
    // Play regardless of tab visibility as per requirement
    await this.playNotification(type, customUrl);
  }

  // Set volume
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable sound
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Get current settings
  getSettings(): { enabled: boolean; volume: number } {
    return {
      enabled: this.enabled,
      volume: this.volume,
    };
  }

  // Clear audio cache
  clearCache(): void {
    this.audioCache.clear();
  }
}

// ============================================================================
// HOOK FOR REACT COMPONENTS
// ============================================================================
export function useWidgetSound() {
  const soundService = WidgetSoundService.getInstance();

  return {
    playNotification: (type?: NotificationType, customUrl?: string) => 
      soundService.playNotification(type, customUrl),
    playIfBackground: (type?: NotificationType, customUrl?: string) => 
      soundService.playIfBackground(type, customUrl),
    setVolume: (volume: number) => soundService.setVolume(volume),
    setEnabled: (enabled: boolean) => soundService.setEnabled(enabled),
    getSettings: () => soundService.getSettings(),
  };
} 