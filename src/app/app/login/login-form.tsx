"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("jam@jam.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    setIsLoading(true);
    setError(null);

    try {

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {


        // Set session storage flag to prevent redirect loop
        sessionStorage.setItem("campfire-login-success", "true");
        
        // Add debugging to see if router.push works


        // Try both navigation methods for debugging
        try {
          router.push("/dashboard");

          // Also try window.location as fallback after a delay
          setTimeout(() => {

            if (window.location.pathname === "/login") {

              window.location.href = "/dashboard";
            }
          }, 2000);
        } catch (navError) {

          window.location.href = "/dashboard";
        }
      } else {

        setError(data.error || "Login failed");
      }
    } catch (err) {

      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);

    }
  };

  return (
    <div className="relative">
      {/* Professional login card */}
      <div className="relative mx-auto w-full max-w-md radius-2xl border border-[var(--fl-color-border)] bg-white spacing-8 shadow-lg">
        {/* Header with logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center radius-2xl border border-[var(--fl-color-border)] bg-gray-100">
              <div className="text-2xl font-bold text-gray-600">🔥</div>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600">Sign in to your Campfire account</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 rounded-ds-xl border border-[var(--fl-color-danger-muted)] bg-red-50 spacing-4" data-testid="error-message">
            <div className="flex items-center">
              <div className="mr-3 text-red-400">⚠️</div>
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
              <div className="mr-2 h-4 w-4 text-gray-400">📧</div>
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                data-testid="email-input"
                className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-white px-4 py-3 placeholder-gray-400 transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700">
              <div className="mr-2 h-4 w-4 text-gray-400">🔒</div>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                data-testid="password-input"
                className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] bg-white px-4 py-3 pr-12 placeholder-gray-400 transition-colors focus:border-[var(--fl-color-brand)] focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            data-testid="login-button"
            className="w-full rounded-ds-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-5 w-5 animate-spin rounded-ds-full border-2 border-white border-t-transparent"></div>
                Signing in...
              </div>
            ) : (
              "Sign in to Campfire"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Secure login powered by Campfire</p>
        </div>
      </div>
    </div>
  );
}
