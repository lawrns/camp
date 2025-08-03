/**
 * Performance-Optimized Animations - TEAM2-P4-006
 * GPU-accelerated animations with reduced motion support and performance monitoring
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionStyle, useInView, useReducedMotion } from "framer-motion";
import {
  Activity,
  Eye,
  EyeSlash as EyeOff,
  Stack as Layers,
  Pause,
  Play,
  ArrowCounterClockwise as RotateCcw,
  Gear as Settings,
  Sparkle as Sparkles,
  Lightning as Zap,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card as GlassCard } from "@/components/unified-ui/components/Card";
import { Slider } from "@/components/unified-ui/components/slider";
import { Switch } from "@/components/unified-ui/components/switch";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  animationCount: number;
  memoryUsage: number;
  cpuUsage: number;
  frameDrops: number;
}

interface AnimationConfig {
  enableGPU: boolean;
  respectReducedMotion: boolean;
  enablePerformanceMonitoring: boolean;
  maxConcurrentAnimations: number;
  targetFPS: number;
  enableIntersectionObserver: boolean;
  useLazyLoading: boolean;
}

// Performance monitoring hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 16.67,
    animationCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    frameDrops: 0,
  });

  const frameTimeRef = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());
  const animationCountRef = useRef(0);

  const updateMetrics = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;

    frameTimeRef.current.push(deltaTime);
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }

    const avgFrameTime = frameTimeRef.current.reduce((a: number, b: number) => a + b, 0) / frameTimeRef.current.length;
    const fps = Math.round(1000 / avgFrameTime);
    const frameDrops = frameTimeRef.current.filter((time: number) => time > 20).length;

    setMetrics((prev) => ({
      ...prev,
      fps: Math.min(fps, 60),
      renderTime: avgFrameTime,
      animationCount: animationCountRef.current,
      frameDrops,
    }));

    lastFrameTime.current = now;
  }, []);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      updateMetrics();
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [updateMetrics]);

  const incrementAnimationCount = useCallback(() => {
    animationCountRef.current++;
  }, []);

  const decrementAnimationCount = useCallback(() => {
    animationCountRef.current = Math.max(0, animationCountRef.current - 1);
  }, []);

  return { metrics, incrementAnimationCount, decrementAnimationCount };
}

// GPU-optimized motion components with proper exactOptionalPropertyTypes handling
const GPUMotion = {
  div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { style, ...rest } = props;
    const motionStyle = {
      willChange: "transform",
      backfaceVisibility: "hidden",
      perspective: 1000,
      ...(style || {}),
    } as MotionStyle;
    const motionProps = {
      ref,
      style: motionStyle,
      ...rest,
    };
    // Use type assertion to handle exactOptionalPropertyTypes properly
    return <motion.div {...(motionProps as any)} />;
  }),

  span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>((props, ref) => {
    const { style, ...rest } = props;
    const motionStyle = {
      willChange: "transform",
      backfaceVisibility: "hidden",
      ...(style || {}),
    } as MotionStyle;
    const motionProps = {
      ref,
      style: motionStyle,
      ...rest,
    };
    // Use type assertion to handle exactOptionalPropertyTypes properly
    return <motion.span {...(motionProps as any)} />;
  }),

  img: React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>((props, ref) => {
    const { style, ...rest } = props;
    const motionStyle = {
      willChange: "transform",
      backfaceVisibility: "hidden",
      transform: "translateZ(0)",
      ...(style || {}),
    } as MotionStyle;
    const motionProps = {
      ref,
      style: motionStyle,
      ...rest,
    };
    // Use type assertion to handle exactOptionalPropertyTypes properly
    return <motion.img {...(motionProps as any)} />;
  }),
};

// Optimized animation variants
export const optimizedVariants = {
  // GPU-accelerated fade
  fadeIn: {
    initial: { opacity: 0, transform: "translateZ(0)" },
    animate: { opacity: 1, transform: "translateZ(0)" },
    exit: { opacity: 0, transform: "translateZ(0)" },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  // GPU-accelerated slide
  slideUp: {
    initial: { opacity: 0, transform: "translate3d(0, 20px, 0)" },
    animate: { opacity: 1, transform: "translate3d(0, 0, 0)" },
    exit: { opacity: 0, transform: "translate3d(0, -20px, 0)" },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  // GPU-accelerated scale
  scaleIn: {
    initial: { opacity: 0, transform: "scale3d(0.8, 0.8, 1)" },
    animate: { opacity: 1, transform: "scale3d(1, 1, 1)" },
    exit: { opacity: 0, transform: "scale3d(0.8, 0.8, 1)" },
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  },

  // GPU-accelerated rotation
  rotateIn: {
    initial: { opacity: 0, transform: "rotate3d(0, 0, 1, -180deg) scale3d(0.8, 0.8, 1)" },
    animate: { opacity: 1, transform: "rotate3d(0, 0, 1, 0deg) scale3d(1, 1, 1)" },
    exit: { opacity: 0, transform: "rotate3d(0, 0, 1, 180deg) scale3d(0.8, 0.8, 1)" },
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },

  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },

  staggerItem: {
    initial: { opacity: 0, transform: "translate3d(0, 20px, 0)" },
    animate: { opacity: 1, transform: "translate3d(0, 0, 0)" },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Performance-aware animation component
interface OptimizedAnimationProps {
  children: React.ReactNode;
  variant?: keyof typeof optimizedVariants;
  className?: string;
  enableGPU?: boolean;
  respectReducedMotion?: boolean;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  trigger?: boolean;
  delay?: number;
}

export function OptimizedAnimation({
  children,
  variant = "fadeIn",
  className,
  enableGPU = true,
  respectReducedMotion = true,
  onAnimationStart,
  onAnimationComplete,
  trigger = true,
  delay = 0,
}: OptimizedAnimationProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "50px" });
  const { incrementAnimationCount, decrementAnimationCount } = usePerformanceMetrics();

  const shouldAnimate = useMemo(() => {
    if (respectReducedMotion && reducedMotion) return false;
    return trigger && isInView;
  }, [respectReducedMotion, reducedMotion, trigger, isInView]);

  const animationProps = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: false,
        animate: optimizedVariants[variant].animate,
      };
    }

    const variantConfig = optimizedVariants[variant];
    return {
      ...variantConfig,
      transition: {
        ...(variantConfig.transition || {}),
        delay,
      },
    };
  }, [shouldAnimate, variant, delay]);

  const MotionComponent = enableGPU ? GPUMotion.div : motion.div;

  const motionProps = {
    ref,
    className,
    ...animationProps,
    onAnimationStart: () => {
      incrementAnimationCount();
      onAnimationStart?.();
    },
    onAnimationComplete: () => {
      decrementAnimationCount();
      onAnimationComplete?.();
    },
  };

  return (
    // Use type assertion to handle exactOptionalPropertyTypes properly
    <MotionComponent {...(motionProps as any)}>{children}</MotionComponent>
  );
}

// High-performance particle system
interface ParticleSystemProps {
  count?: number;
  enableGPU?: boolean;
  className?: string;
}

export function ParticleSystem({ count = 50, enableGPU = true, className }: ParticleSystemProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(true);

  const particles = useMemo(() => {
    if (reducedMotion) return [];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 2,
    }));
  }, [count, reducedMotion]);

  if (reducedMotion || !isActive) {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <div className="absolute inset-0 rounded-ds-lg bg-gradient-to-br from-blue-100/50 to-purple-100/50" />
      </div>
    );
  }

  const MotionDiv = enableGPU ? GPUMotion.div : motion.div;

  return (
    <div ref={containerRef} className={cn("relative h-full w-full overflow-hidden", className)}>
      <div className="absolute inset-0 rounded-ds-lg bg-gradient-to-br from-blue-100/20 to-purple-100/20" />

      {particles.map((particle) => (
        <MotionDiv
          key={particle.id}
          className="absolute h-1 w-1 rounded-ds-full bg-blue-400 opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsActive(!isActive)}
        className="absolute right-2 top-2 opacity-50 hover:opacity-100"
      >
        {isActive ? <Icon icon={Pause} className="h-4 w-4" /> : <Icon icon={Play} className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Performance metrics display
interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export function PerformanceMonitor({ metrics, className }: PerformanceMonitorProps) {
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return "text-green-600";
    if (fps >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getPerformanceLevel = (fps: number) => {
    if (fps >= 55) return "Excellent";
    if (fps >= 45) return "Good";
    if (fps >= 30) return "Fair";
    return "Poor";
  };

  return (
    <GlassCard className={cn("spacing-4", className)}>
      <div className="mb-4 flex items-center gap-ds-2">
        <Icon icon={Activity} className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">FPS</span>
            <span className={cn("text-lg font-bold", getFPSColor(metrics.fps))}>{metrics.fps}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Frame Time</span>
            <span className="text-sm font-medium">{metrics.renderTime.toFixed(1)}ms</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Animations</span>
            <Badge variant="secondary">{metrics.animationCount}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Performance</span>
            <Badge variant={metrics.fps >= 55 ? "default" : metrics.fps >= 30 ? "secondary" : "error"}>
              {getPerformanceLevel(metrics.fps)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Frame Drops</span>
            <span
              className={cn(
                "text-typography-sm font-medium",
                metrics.frameDrops > 5 ? "text-red-600" : "text-semantic-success-dark"
              )}
            >
              {metrics.frameDrops}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm">Status</span>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "h-2 w-2 rounded-ds-full",
                  metrics.fps >= 55
                    ? "bg-semantic-success"
                    : metrics.fps >= 30
                      ? "bg-orange-200"
                      : "bg-brand-mahogany-500"
                )}
              />
              <span className="text-tiny text-[var(--fl-color-text-muted)]">
                {metrics.fps >= 55 ? "Smooth" : metrics.fps >= 30 ? "Stable" : "Laggy"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FPS Chart */}
      <div className="mt-4 border-t pt-4">
        <div className="bg-background relative h-8 overflow-hidden rounded">
          <motion.div
            className={cn(
              "absolute left-0 top-0 h-full rounded",
              metrics.fps >= 55 ? "bg-semantic-success" : metrics.fps >= 30 ? "bg-orange-200" : "bg-brand-mahogany-500"
            )}
            animate={{ width: `${(metrics.fps / 60) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-foreground text-tiny font-medium">{metrics.fps}/60 FPS</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// Animation configurator
interface AnimationConfiguratorProps {
  config: AnimationConfig;
  onConfigChange: (config: AnimationConfig) => void;
  className?: string;
}

export function AnimationConfigurator({ config, onConfigChange, className }: AnimationConfiguratorProps) {
  const reducedMotion = useReducedMotion();

  const updateConfig = (key: keyof AnimationConfig, value: AnimationConfig[keyof AnimationConfig]) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <GlassCard className={cn("spacing-4", className)}>
      <div className="mb-4 flex items-center gap-ds-2">
        <Icon icon={Settings} className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Animation Configuration</h3>
      </div>

      <div className="space-y-3">
        {/* GPU Acceleration */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-foreground text-sm font-medium">GPU Acceleration</label>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">
              Use transform3d and will-change for hardware acceleration
            </p>
          </div>
          <Switch checked={config.enableGPU} onCheckedChange={(checked) => updateConfig("enableGPU", checked)} />
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-foreground text-sm font-medium">Respect Reduced Motion</label>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">
              Honor user's motion preferences for accessibility
            </p>
            {reducedMotion && (
              <Badge variant="secondary" className="text-tiny">
                System: Reduced Motion Enabled
              </Badge>
            )}
          </div>
          <Switch
            checked={config.respectReducedMotion}
            onCheckedChange={(checked) => updateConfig("respectReducedMotion", checked)}
          />
        </div>

        {/* Performance Monitoring */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-foreground text-sm font-medium">Performance Monitoring</label>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">Track FPS and animation performance</p>
          </div>
          <Switch
            checked={config.enablePerformanceMonitoring}
            onCheckedChange={(checked) => updateConfig("enablePerformanceMonitoring", checked)}
          />
        </div>

        {/* Intersection Observer */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-foreground text-sm font-medium">Intersection Observer</label>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">Only animate elements when they're visible</p>
          </div>
          <Switch
            checked={config.enableIntersectionObserver}
            onCheckedChange={(checked) => updateConfig("enableIntersectionObserver", checked)}
          />
        </div>

        {/* Lazy Loading */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-foreground text-sm font-medium">Lazy Loading</label>
            <p className="text-tiny text-[var(--fl-color-text-muted)]">Load animation bundles only when needed</p>
          </div>
          <Switch
            checked={config.useLazyLoading}
            onCheckedChange={(checked) => updateConfig("useLazyLoading", checked)}
          />
        </div>

        {/* Max Concurrent Animations */}
        <div className="space-y-spacing-sm">
          <label className="text-foreground text-sm font-medium">
            Max Concurrent Animations: {config.maxConcurrentAnimations}
          </label>
          <Slider
            value={[config.maxConcurrentAnimations]}
            onValueChange={([value]) => updateConfig("maxConcurrentAnimations", value || 5)}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          <p className="text-tiny text-[var(--fl-color-text-muted)]">
            Limit simultaneous animations to maintain performance
          </p>
        </div>

        {/* Target FPS */}
        <div className="space-y-spacing-sm">
          <label className="text-foreground text-sm font-medium">Target FPS: {config.targetFPS}</label>
          <Slider
            value={[config.targetFPS]}
            onValueChange={([value]) => updateConfig("targetFPS", value || 30)}
            min={30}
            max={60}
            step={15}
            className="w-full"
          />
          <p className="text-tiny text-[var(--fl-color-text-muted)]">
            Adjust animation frame rate for different devices
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// Optimized animation showcase
interface AnimationShowcaseProps {
  config: AnimationConfig;
  className?: string;
}

export function AnimationShowcase({ config, className }: AnimationShowcaseProps) {
  const [activeDemo, setActiveDemo] = useState<string>("stagger");
  const [isVisible, setIsVisible] = useState(true);

  const demos = [
    { id: "stagger", name: "Stagger Animation", icon: Layers },
    { id: "particles", name: "Particle System", icon: Sparkles },
    { id: "transforms", name: "GPU Transforms", icon: Zap },
    { id: "intersection", name: "Intersection Observer", icon: Eye },
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case "stagger":
        return (
          <motion.div
            variants={optimizedVariants.staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-3 p-spacing-md"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <OptimizedAnimation
                key={i}
                variant="staggerItem"
                enableGPU={config.enableGPU}
                respectReducedMotion={config.respectReducedMotion}
                trigger={isVisible}
                delay={i * 0.1}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-ds-lg bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
                  {i + 1}
                </div>
              </OptimizedAnimation>
            ))}
          </motion.div>
        );

      case "particles":
        return (
          <div className="relative h-64">
            <ParticleSystem count={config.maxConcurrentAnimations} enableGPU={config.enableGPU} />
          </div>
        );

      case "transforms":
        return (
          <div className="flex items-center justify-center space-x-8 p-spacing-lg">
            {["fadeIn", "slideUp", "scaleIn", "rotateIn"].map((variant, i) => (
              <OptimizedAnimation
                key={variant}
                variant={variant as keyof typeof optimizedVariants}
                enableGPU={config.enableGPU}
                respectReducedMotion={config.respectReducedMotion}
                trigger={isVisible}
                delay={i * 0.2}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-ds-lg bg-gradient-to-br from-green-500 to-blue-600 text-sm font-medium text-white">
                  {variant}
                </div>
              </OptimizedAnimation>
            ))}
          </div>
        );

      case "intersection":
        return (
          <div className="max-h-64 space-y-8 overflow-y-auto p-spacing-md">
            {Array.from({ length: 10 }, (_, i) => (
              <OptimizedAnimation
                key={i}
                variant="slideUp"
                enableGPU={config.enableGPU}
                respectReducedMotion={config.respectReducedMotion}
                className="flex h-16 w-full items-center justify-center rounded-ds-lg bg-gradient-to-r from-purple-500 to-pink-600 font-medium text-white"
              >
                Scroll Item {i + 1}
              </OptimizedAnimation>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard className={cn("spacing-6", className)}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-ds-2">
          <Icon icon={Sparkles} className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Animation Showcase</h3>
        </div>

        <div className="flex items-center gap-ds-2">
          <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)} leftIcon={<Icon icon={RotateCcw} className="h-4 w-4" />}>
            Toggle Animation
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? <Icon icon={EyeOff} className="h-4 w-4" /> : <Icon icon={Eye} className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Demo Selector */}
      <div className="mb-6 flex flex-wrap gap-ds-2">
        {demos.map((demo) => (
          <motion.button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            className={cn(
              "text-typography-sm flex items-center gap-2 rounded-ds-lg px-3 py-2 font-medium transition-colors",
              activeDemo === demo.id
                ? "bg-status-info-light border-status-info-light border text-blue-900"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <demo.icon className="h-4 w-4" />
            {demo.name}
          </motion.button>
        ))}
      </div>

      {/* Demo Content */}
      <div className="relative min-h-[300px] overflow-hidden rounded-ds-lg bg-[var(--fl-color-background-subtle)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {renderDemo()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Performance Tips */}
      <div className="mt-4 rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
        <h4 className="mb-2 text-sm font-medium text-blue-900">Performance Tips</h4>
        <ul className="space-y-1 text-tiny text-blue-800">
          <li>• Use transform3d() for GPU acceleration</li>
          <li>• Prefer transform and opacity for animations</li>
          <li>• Use will-change sparingly and remove after animation</li>
          <li>• Implement intersection observer for scroll animations</li>
          <li>• Respect user's reduced motion preferences</li>
        </ul>
      </div>
    </GlassCard>
  );
}
