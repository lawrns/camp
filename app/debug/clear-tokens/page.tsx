'use client'

import { forceClearAllTokens } from '@/lib/auth/clear-expired-tokens'

export default function ClearTokensPage() {
  const handleClearTokens = () => {
    forceClearAllTokens()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Clear Authentication Tokens</h1>
      <p className="mb-4">
        This page allows you to manually clear all authentication tokens from browser storage.
        This will force a fresh authentication flow.
      </p>
      <button
        onClick={handleClearTokens}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Clear All Tokens & Reload
      </button>
    </div>
  )
}
