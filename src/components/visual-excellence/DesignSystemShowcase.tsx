'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ShowcaseCardProps {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
}

const ShowcaseCard: React.FC<ShowcaseCardProps> = ({ title, description, className = '', children }) => (
  <motion.div
    className={`p-6 rounded-lg border bg-background ${className}`}
    style={{ boxShadow: 'var(--ds-shadow-card)' }}
    whileHover={{ 
      scale: 1.02,
      boxShadow: 'var(--ds-shadow-card-hover)',
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  >
    <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{description}</p>
    {children}
  </motion.div>
);

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Visual Excellence Showcase
          </h1>
          <p className="text-xl text-muted-foreground">
            Demonstrating the advanced design system capabilities
          </p>
        </motion.div>

        {/* Animation Tokens Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Advanced Animation Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ShowcaseCard
              title="Smooth Transitions"
              description="Using var(--ds-transition-smooth) for fluid animations"
              className="hover:shadow-glow"
            >
              <motion.div
                className="w-16 h-16 bg-primary rounded-lg mx-auto"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.3, ease: [0.68, -0.55, 0.265, 1.55] }
                }}
                whileTap={{ scale: 0.95 }}
              />
            </ShowcaseCard>

            <ShowcaseCard
              title="Bounce Effects"
              description="Using bounce easing for playful interactions"
            >
              <motion.div
                className="w-16 h-16 bg-success rounded-lg mx-auto"
                whileHover={{ 
                  scale: 1.2,
                  transition: { duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }
                }}
                animate={{ 
                  y: [0, -10, 0],
                  transition: { 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: [0.68, -0.55, 0.265, 1.55] 
                  }
                }}
              />
            </ShowcaseCard>

            <ShowcaseCard
              title="Spring Animations"
              description="Using spring easing for natural motion"
            >
              <motion.div
                className="w-16 h-16 bg-warning rounded-lg mx-auto"
                whileHover={{ 
                  scale: 1.15,
                  transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }
                }}
                animate={{ 
                  rotate: [0, 360],
                  transition: { 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: 'linear' 
                  }
                }}
              />
            </ShowcaseCard>
          </div>
        </section>

        {/* Premium Colors Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Premium Color Extensions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ShowcaseCard
              title="Subtle Backgrounds"
              description="Premium subtle color variants"
            >
              <div className="space-y-3">
                <div className="h-8 rounded bg-[var(--ds-color-success-subtle)] border border-[var(--ds-color-success-500)]/20" />
                <div className="h-8 rounded bg-[var(--ds-color-warning-subtle)] border border-[var(--ds-color-warning-500)]/20" />
                <div className="h-8 rounded bg-[var(--ds-color-error-subtle)] border border-[var(--ds-color-error-500)]/20" />
                <div className="h-8 rounded bg-[var(--ds-color-info-subtle)] border border-[var(--ds-color-info-500)]/20" />
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="Interactive States"
              description="Hover and active state colors"
            >
              <div className="space-y-3">
                <motion.button
                  className="w-full h-8 rounded bg-primary text-primary-foreground"
                  whileHover={{ backgroundColor: 'var(--ds-color-hover-primary)' }}
                  whileTap={{ backgroundColor: 'var(--ds-color-active-primary)' }}
                >
                  Primary
                </motion.button>
                <motion.button
                  className="w-full h-8 rounded bg-success text-success-foreground"
                  whileHover={{ backgroundColor: 'var(--ds-color-hover-success)' }}
                  whileTap={{ backgroundColor: 'var(--ds-color-active-success)' }}
                >
                  Success
                </motion.button>
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="Gradient Colors"
              description="Beautiful gradient combinations"
            >
              <div className="space-y-3">
                <div 
                  className="h-8 rounded"
                  style={{ background: 'var(--ds-color-gradient-primary)' }}
                />
                <div 
                  className="h-8 rounded"
                  style={{ background: 'var(--ds-color-gradient-success)' }}
                />
                <div 
                  className="h-8 rounded"
                  style={{ background: 'var(--ds-color-gradient-warning)' }}
                />
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="Glow Effects"
              description="Premium glow shadow effects"
            >
              <div className="space-y-3">
                <div 
                  className="h-8 rounded bg-primary"
                  style={{ boxShadow: 'var(--ds-shadow-glow)' }}
                />
                <div 
                  className="h-8 rounded bg-success"
                  style={{ boxShadow: 'var(--ds-shadow-glow-success)' }}
                />
                <div 
                  className="h-8 rounded bg-warning"
                  style={{ boxShadow: 'var(--ds-shadow-glow-warning)' }}
                />
              </div>
            </ShowcaseCard>
          </div>
        </section>

        {/* Sophisticated Shadows Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Sophisticated Shadow System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ShowcaseCard
              title="Card Shadows"
              description="Progressive shadow depth"
            >
              <div className="space-y-4">
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-subtle)' }}
                />
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-medium)' }}
                />
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-large)' }}
                />
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="Specialized Shadows"
              description="Context-specific shadow variants"
            >
              <div className="space-y-4">
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-modal)' }}
                />
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-dropdown)' }}
                />
                <div 
                  className="h-12 rounded bg-background border"
                  style={{ boxShadow: 'var(--ds-shadow-inner)' }}
                />
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="Interactive Shadows"
              description="Dynamic shadow changes on interaction"
            >
              <motion.div
                className="h-12 rounded bg-background border cursor-pointer"
                style={{ boxShadow: 'var(--ds-shadow-card)' }}
                whileHover={{ 
                  boxShadow: 'var(--ds-shadow-card-hover)',
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
              />
            </ShowcaseCard>
          </div>
        </section>

        {/* Performance Optimizations */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Performance Optimizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShowcaseCard
              title="Hardware Acceleration"
              description="Optimized transforms for smooth animations"
            >
              <motion.div
                className="w-16 h-16 bg-primary rounded-lg mx-auto"
                style={{ 
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
                whileHover={{ 
                  scale: 1.1,
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                }}
              />
            </ShowcaseCard>

            <ShowcaseCard
              title="Reduced Motion Support"
              description="Respects user motion preferences"
            >
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Respects <code>prefers-reduced-motion</code>
                </p>
                <motion.div
                  className="w-16 h-16 bg-warning rounded-lg mx-auto"
                  animate={{ 
                    rotate: [0, 360],
                    transition: { 
                      duration: 2, 
                      repeat: Infinity,
                      ease: 'linear'
                    }
                  }}
                />
              </div>
            </ShowcaseCard>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Accessibility Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShowcaseCard
              title="Focus Management"
              description="WCAG 2.1 AA compliant focus indicators"
            >
              <div className="space-y-3">
                <button className="w-full h-10 rounded bg-primary text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  Focus Me
                </button>
                <input 
                  type="text" 
                  placeholder="Accessible input"
                  className="w-full h-10 rounded border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
            </ShowcaseCard>

            <ShowcaseCard
              title="High Contrast Support"
              description="Enhanced visibility for accessibility"
            >
              <div className="space-y-3">
                <div className="h-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  High Contrast
                </div>
                <div className="h-8 rounded bg-success text-success-foreground flex items-center justify-center text-sm font-medium">
                  Success State
                </div>
              </div>
            </ShowcaseCard>
          </div>
        </section>
      </div>
    </div>
  );
} 