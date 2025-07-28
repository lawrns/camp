// Server Component - no "use client" directive
import Link from "next/link";
import { RegisterForm } from "./register-form";

// Server-rendered registration page layout
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)] spacing-4">
      {/* Background Pattern - static, no client JS needed */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header - server rendered */}
        <div className="mb-8 text-center">
          <Link href="/" className="group mb-6 inline-flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-blue-600 transition-transform group-hover:scale-110"
            >
              <path d="M12 2L2 7v10c0 .55.45 1 1 1h5v-4a1 1 0 011-1h6a1 1 0 011 1v4h5c.55 0 1-.45 1-1V7L12 2z" />
            </svg>
            <span className="text-2xl font-semibold text-gray-900">Campfire</span>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Join Campfire</h1>
          <p className="text-gray-600">Create your account to get started with professional customer support</p>
        </div>

        {/* Form Card - client island for interactivity */}
        <div className="rounded-ds-lg border border-[var(--fl-color-border)] bg-white spacing-8 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Create account</h2>
          </div>

          {/* Improved register form with proper auth integration */}
          <RegisterForm />
        </div>

        {/* Security Badge - server rendered */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[var(--fl-color-text-muted)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            <span>SOC 2 compliant • 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}