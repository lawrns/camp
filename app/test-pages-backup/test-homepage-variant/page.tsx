"use client";

export default function TestHomepageVariant() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Homepage Status</h1>
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="font-semibold">Current Status:</h2>
          <p className="text-lg">✅ Commie homepage is now the default</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold">What Changed:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Homepage variant system has been removed</li>
            <li>Commie homepage content is now directly integrated</li>
            <li>Feature flag system is no longer needed</li>
            <li>Visit / to see the enhanced homepage</li>
          </ul>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="font-semibold">Files Removed:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>app/CommieHome.tsx</li>
            <li>hooks/useHomepageVariant.ts</li>
            <li>Feature flag system</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 