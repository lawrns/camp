// Server Component - no client directive
import { LoginForm } from "./login-form";

// Static login page layout - server rendered
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white spacing-4">
      {/* Improved login form with professional design */}
      <LoginForm />
    </div>
  );
}
