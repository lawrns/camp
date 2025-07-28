import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/ui/design-system';

export function DesignSystemOverview() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-ds-color-text">Campfire Design System</h1>
        <p className="text-lg text-ds-color-text-muted">
          A comprehensive design system for building consistent, accessible, and beautiful user interfaces.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ds-color-text">Getting Started</h2>
          <p className="text-ds-color-text-muted">
            The design system provides a set of reusable components, design tokens, and guidelines to help you build
            consistent UIs faster.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              title="Colors"
              description="Explore our color palette and learn how to use it effectively."
              href="/design-system/colors"
            />
            <Card
              title="Typography"
              description="Learn about our type scale, fonts, and text styles."
              href="/design-system/typography"
            />
            <Card
              title="Spacing"
              description="Understand our spacing system and layout principles."
              href="/design-system/spacing"
            />
            <Card
              title="Components"
              description="Browse our library of reusable UI components."
              href="/design-system/components"
            />
            <Card
              title="Icons"
              description="Find and use icons from our icon set."
              href="/design-system/icons"
            />
          </div>
        </section>

        <section className="space-y-4 pt-8">
          <h2 className="text-2xl font-semibold text-ds-color-text">Design Principles</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <PrincipleCard
              title="Consistency"
              description="Maintain visual and functional consistency across all components and patterns."
              icon={
                <svg
                  className="h-6 w-6 text-ds-color-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <PrincipleCard
              title="Accessibility"
              description="Ensure all components meet WCAG 2.1 AA accessibility standards."
              icon={
                <svg
                  className="h-6 w-6 text-ds-color-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              }
            />
            <PrincipleCard
              title="Efficiency"
              description="Enable rapid development with reusable components and clear guidelines."
              icon={
                <svg
                  className="h-6 w-6 text-ds-color-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <PrincipleCard
              title="Clarity"
              description="Make interfaces intuitive and easy to understand."
              icon={
                <svg
                  className="h-6 w-6 text-ds-color-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-ds-color-surface rounded-lg border border-ds-color-border hover:border-ds-color-primary-500 transition-colors duration-150"
    >
      <h3 className="text-lg font-medium text-ds-color-text">{title}</h3>
      <p className="mt-2 text-sm text-ds-color-text-muted">{description}</p>
    </Link>
  );
}

function PrincipleCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-ds-color-surface rounded-lg border border-ds-color-border">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-md bg-ds-color-primary-50">{icon}</div>
        <h3 className="text-lg font-medium text-ds-color-text">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-ds-color-text-muted">{description}</p>
    </div>
  );
}

export default DesignSystemOverview;
