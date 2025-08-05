"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Buildings as Building, Eye, EyeSlash as EyeOff, Lock, Envelope as Mail, User,  } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";

// Dynamic imports for lazy loading
const OAuthButtons = dynamic(() => import("./oauth-buttons"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="h-10 animate-pulse rounded-ds-md bg-gray-100" />
      <div className="h-10 animate-pulse rounded-ds-md bg-gray-100" />
    </div>
  ),
});

// Dynamic auth provider wrapper
const AuthWrapper = dynamic(() => import("./register-auth-wrapper").then((mod) => mod.RegisterAuthWrapper), {
  ssr: false,
  loading: () => <div className="h-10 animate-pulse rounded-ds-md bg-gray-100" />,
});

function RegisterFormInner() {
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  // Component will be wrapped with auth provider

  // Listen for auth events and mark as auth page
  React.useEffect(() => {
    // Mark this as an authentication page to preserve styling
    document.body.setAttribute("data-page", "register");

    const handleSignupConfirmation = (event: CustomEvent) => {
      setIsLoading(false);
      setRegistrationSuccess(true);
      setLocalError(null);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        password: "",
        confirmPassword: "",
      });
      setAcceptTerms(false);
      setValidationErrors({});
    };

    window.addEventListener("campfire-auth-signup-confirmation", handleSignupConfirmation as EventListener);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("campfire-auth-signup-confirmation", handleSignupConfirmation as EventListener);
      document.body.removeAttribute("data-page");
    };
  }, []);

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.company.trim()) {
      errors.company = "Company name is required";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!acceptTerms) {
      errors.terms = "You must accept the Terms of Service";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      // Call the registration API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLocalError(result.error || "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Registration successful
      setRegistrationSuccess(true);
      setIsLoading(false);
    } catch (error: unknown) {
      setLocalError("Registration failed. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <>
      {/* Success Message */}
      {registrationSuccess && (
        <div className="border-status-success-light mb-6 rounded-ds-lg border bg-[var(--fl-color-success-subtle)] spacing-4" data-testid="registration-success">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="text-semantic-success-dark h-5 w-5" fill="currentColor" viewBox="0 0 20 20" data-testid="success-icon">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-semantic-success-dark text-sm font-medium" data-testid="success-title">Registration successful!</h3>
              <p className="text-green-600-dark mt-1 text-sm" data-testid="success-message">
                Please check your email for a verification link to activate your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auth Error Display */}
      {localError && !registrationSuccess && (
        <div className="border-status-error-light mb-6 rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-4" data-testid="registration-error">
          <p className="text-sm text-red-600" data-testid="error-message">{localError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4" data-testid="name-fields">
          <div className="space-y-2" data-testid="first-name-field">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-900" data-testid="first-name-label">
              First name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon icon={User} size={16} />
              </div>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange("firstName")}
                className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-4 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="John"
                required
                disabled={isLoading}
                data-testid="first-name-input"
              />
            </div>
            {validationErrors.firstName && <p className="text-sm text-red-600" data-testid="first-name-error">{validationErrors.firstName}</p>}
          </div>

          <div className="space-y-2" data-testid="last-name-field">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-900" data-testid="last-name-label">
              Last name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon icon={User} size={16} />
              </div>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange("lastName")}
                className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-4 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Doe"
                required
                disabled={isLoading}
                data-testid="last-name-input"
              />
            </div>
            {validationErrors.lastName && <p className="text-sm text-red-600" data-testid="last-name-error">{validationErrors.lastName}</p>}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2" data-testid="email-field">
          <label htmlFor="email" className="block text-sm font-medium text-gray-900" data-testid="email-label">
            Email address
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon={Mail} size={16} />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange("email")}
              className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-4 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="john@company.com"
              required
              disabled={isLoading}
              data-testid="email-input"
            />
          </div>
          {validationErrors.email && <p className="text-sm text-red-600" data-testid="email-error">{validationErrors.email}</p>}
        </div>

        {/* Company Field */}
        <div className="space-y-2" data-testid="company-field">
          <label htmlFor="company" className="block text-sm font-medium text-gray-900" data-testid="company-label">
            Company
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon={Building} size={16} />
            </div>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={handleInputChange("company")}
              className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-4 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Company"
              required
              disabled={isLoading}
              data-testid="company-input"
            />
          </div>
          {validationErrors.company && <p className="text-sm text-red-600" data-testid="company-error">{validationErrors.company}</p>}
        </div>

        {/* Password Fields */}
        <div className="space-y-2" data-testid="password-field">
          <label htmlFor="password" className="block text-sm font-medium text-gray-900" data-testid="password-label">
            Password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon={Lock} size={16} />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange("password")}
              className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-10 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Create a strong password"
              required
              disabled={isLoading}
              data-testid="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              data-testid="password-toggle"
            >
              {showPassword ? <Icon icon={EyeOff} size={16} /> : <Icon icon={Eye} size={16} />}
            </button>
          </div>
          {validationErrors.password && <p className="text-sm text-red-600" data-testid="password-error">{validationErrors.password}</p>}
        </div>

        <div className="space-y-2" data-testid="confirm-password-field">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900" data-testid="confirm-password-label">
            Confirm password
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon icon={Lock} size={16} />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              className="w-full rounded-ds-lg border border-[var(--fl-color-border-strong)] py-3 pl-10 pr-10 text-gray-900 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm your password"
              required
              disabled={isLoading}
              data-testid="confirm-password-input"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              data-testid="confirm-password-toggle"
            >
              {showConfirmPassword ? <Icon icon={EyeOff} size={16} /> : <Icon icon={Eye} size={16} />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-sm text-red-600" data-testid="confirm-password-error">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-2" data-testid="terms-field">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--fl-color-border-strong)] text-indigo-600 focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
              data-testid="terms-checkbox"
            />
            <label htmlFor="terms" className="leading-relaxed cursor-pointer text-sm text-gray-600" data-testid="terms-label">
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-indigo-600 transition-colors hover:text-indigo-500" data-testid="terms-link">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-indigo-600 transition-colors hover:text-indigo-500" data-testid="privacy-link">
                Privacy Policy
              </Link>
            </label>
          </div>
          {validationErrors.terms && <p className="text-sm text-red-600" data-testid="terms-error">{validationErrors.terms}</p>}
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-ds-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          data-testid="register-button"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Create account</span>
              <Icon icon={ArrowRight} size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 transition-colors hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      {/* Social Login Divider */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--fl-color-border-strong)]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-[var(--fl-color-text-muted)]">Or continue with</span>
          </div>
        </div>

        {/* OAuth buttons lazy loaded */}
        <OAuthButtons isLoading={isLoading} />
      </div>
    </>
  );
}

// Export wrapped version that provides auth context
export function RegisterForm() {
  return (
    <AuthWrapper>
      <RegisterFormInner />
    </AuthWrapper>
  );
}
