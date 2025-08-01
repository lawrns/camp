// Server Component - no "use client" directive
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";
import { ForgotPasswordForm } from "./forgot-password-form";

// Server-rendered forgot password page
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 spacing-4">
      {/* Background pattern - static */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo - server rendered */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 text-5xl text-brand-500">🔥</div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>

        {/* Form Card - contains client island */}
        <Card className="glass border-white/20 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900">Forgot password</h2>
            </div>
          </CardHeader>
          <CardContent>
            {/* Client component for interactive form */}
            <ForgotPasswordForm />

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-brand-500 transition-colors hover:text-brand-600">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
