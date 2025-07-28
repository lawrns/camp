export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <div className="container relative mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-ds-lg bg-blue-600 shadow-lg shadow-blue-600/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white" />
                <path d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z" fill="white" />
                <path d="M5 6L5.5 8.5L8 9L5.5 9.5L5 12L4.5 9.5L2 9L4.5 8.5L5 6Z" fill="white" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Campfire</span>
          </div>
          <p className="text-gray-600">Your professional customer support platform</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
