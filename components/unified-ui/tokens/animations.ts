/**
 * Premium Animation System
 *
 * Spring-based motion values for natural, delightful interactions.
 * Includes duration scales, easing curves, and pre-defined animations.
 */

// Duration scale (50ms - 1000ms)
export const durations = {
  instant: "50ms",
  fast: "150ms",
  normal: "250ms",
  slow: "350ms",
  slower: "450ms",
  slowest: "600ms",
  lazy: "800ms",
  glacial: "1000ms",
} as const;

// Easing curves - Spring-based for natural motion
export const easings = {
  // Basic easings
  linear: "linear",
  ease: "ease",

  // Cubic bezier easings
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",

  // Spring easings for delightful interactions
  spring: {
    default: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    gentle: "cubic-bezier(0.4, 0.8, 0.4, 1)",
    wobbly: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    stiff: "cubic-bezier(0.2, 0.9, 0.3, 1)",
    bouncy: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  },

  // Specialized easings
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)",

  // Back easings for playful motion
  backIn: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
  backOut: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  backInOut: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

// Pre-defined transitions
export const transitions = {
  // Base transitions
  base: `all ${durations.normal} ${easings.easeInOut}`,
  fast: `all ${durations.fast} ${easings.easeOut}`,
  slow: `all ${durations.slow} ${easings.easeInOut}`,

  // Property-specific transitions
  opacity: `opacity ${durations.fast} ${easings.easeInOut}`,
  transform: `transform ${durations.normal} ${easings.spring.default}`,
  colors: `background-color ${durations.fast} ${easings.easeInOut}, border-color ${durations.fast} ${easings.easeInOut}, color ${durations.fast} ${easings.easeInOut}`,
  shadow: `box-shadow ${durations.normal} ${easings.easeInOut}`,

  // Interactive transitions
  hover: {
    opacity: `opacity ${durations.instant} ${easings.easeOut}`,
    transform: `transform ${durations.fast} ${easings.spring.gentle}`,
    colors: `background-color ${durations.instant} ${easings.easeOut}, border-color ${durations.instant} ${easings.easeOut}`,
  },

  // Layout transitions
  layout: `all ${durations.slow} ${easings.spring.default}`,
  collapse: `height ${durations.normal} ${easings.easeInOut}, opacity ${durations.fast} ${easings.easeInOut}`,

  // None (for disabling transitions)
  none: "none",
} as const;

// Keyframe animations
export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Scale animations
  scaleIn: {
    from: { transform: "scale(0.9)", opacity: 0 },
    to: { transform: "scale(1)", opacity: 1 },
  },
  scaleOut: {
    from: { transform: "scale(1)", opacity: 1 },
    to: { transform: "scale(0.9)", opacity: 0 },
  },

  // Slide animations
  slideInUp: {
    from: { transform: "translateY(100%)", opacity: 0 },
    to: { transform: "translateY(0)", opacity: 1 },
  },
  slideInDown: {
    from: { transform: "translateY(-100%)", opacity: 0 },
    to: { transform: "translateY(0)", opacity: 1 },
  },
  slideInLeft: {
    from: { transform: "translateX(-100%)", opacity: 0 },
    to: { transform: "translateX(0)", opacity: 1 },
  },
  slideInRight: {
    from: { transform: "translateX(100%)", opacity: 0 },
    to: { transform: "translateX(0)", opacity: 1 },
  },

  // Bounce animation
  bounce: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-25%)" },
  },

  // Pulse animation
  pulse: {
    "0%, 100%": { opacity: 1 },
    "50%": { opacity: 0.5 },
  },

  // Spin animation
  spin: {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
  },

  // Shake animation
  shake: {
    "0%, 100%": { transform: "translateX(0)" },
    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
    "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
  },

  // Loading animations
  shimmer: {
    from: { backgroundPosition: "-1000px 0" },
    to: { backgroundPosition: "1000px 0" },
  },

  // Progress animation
  progress: {
    from: { transform: "scaleX(0)" },
    to: { transform: "scaleX(1)" },
  },
} as const;

// Animation utilities
export const animationUtilities = {
  // Animation delays for staggered effects
  stagger: {
    fast: "50ms",
    normal: "100ms",
    slow: "150ms",
  },

  // Animation fill modes
  fillMode: {
    none: "none",
    forwards: "forwards",
    backwards: "backwards",
    both: "both",
  },

  // Animation play states
  playState: {
    running: "running",
    paused: "paused",
  },

  // Animation iteration counts
  iterationCount: {
    once: "1",
    twice: "2",
    infinite: "infinite",
  },
} as const;

// Pre-composed animations
export const animations = {
  // Entrance animations
  fadeIn: `fadeIn ${durations.normal} ${easings.easeOut}`,
  scaleIn: `scaleIn ${durations.normal} ${easings.spring.default}`,
  slideInUp: `slideInUp ${durations.normal} ${easings.spring.gentle}`,
  slideInDown: `slideInDown ${durations.normal} ${easings.spring.gentle}`,

  // Exit animations
  fadeOut: `fadeOut ${durations.fast} ${easings.easeIn}`,
  scaleOut: `scaleOut ${durations.fast} ${easings.easeIn}`,

  // Continuous animations
  spin: `spin ${durations.glacial} ${easings.linear} infinite`,
  pulse: `pulse ${durations.slowest} ${easings.easeInOut} infinite`,
  bounce: `bounce ${durations.glacial} ${easings.easeInOut} infinite`,

  // Feedback animations
  shake: `shake ${durations.normal} ${easings.easeInOut}`,

  // Loading animations
  shimmer: `shimmer 2s ${easings.linear} infinite`,
  progress: `progress ${durations.slow} ${easings.easeOut}`,
} as const;

export type Durations = typeof durations;
export type Easings = typeof easings;
export type Transitions = typeof transitions;
export type Keyframes = typeof keyframes;
export type Animations = typeof animations;
