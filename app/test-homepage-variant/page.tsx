"use client";

import { useHomepageVariant } from '@/hooks/useHomepageVariant';

export default function TestHomepageVariant() {
  const variant = useHomepageVariant();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Homepage Variant Test</h1>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold">Current Variant:</h2>
          <p className="text-lg">{variant}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="font-semibold">Environment Variable:</h2>
          <p className="text-sm font-mono">
            NEXT_PUBLIC_HOMEPAGE_VARIANT={process.env.NEXT_PUBLIC_HOMEPAGE_VARIANT || 'not set'}
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-semibold">Instructions:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Set NEXT_PUBLIC_HOMEPAGE_VARIANT=legacy for original homepage</li>
            <li>Set NEXT_PUBLIC_HOMEPAGE_VARIANT=commie for new homepage</li>
            <li>Visit / to see the homepage variant in action</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 