"use client";

import { GoogleChromeLogo as Chrome, GithubLogo as Github } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { Icon } from "@/lib/ui/Icon";

interface OAuthButtonsProps {
  isLoading: boolean;
}

export default function OAuthButtons({ isLoading }: OAuthButtonsProps) {
  const auth = useAuth();
  const signInWithOAuth = (auth as unknown)?.signInWithOAuth;

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    if (signInWithOAuth) {
      await signInWithOAuth(provider);
    } else {
    }
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <button
        className="inline-flex w-full justify-center rounded-ds-md border border-[var(--fl-color-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--fl-color-text-muted)] shadow-sm hover:bg-[var(--fl-color-background-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => handleOAuthSignIn("google")}
        disabled={isLoading}
      >
        <Icon icon={Chrome} size={16} className="text-[var(--fl-color-text-muted)]" />
        <span className="ml-2">Google</span>
      </button>
      <button
        className="inline-flex w-full justify-center rounded-ds-md border border-[var(--fl-color-border-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--fl-color-text-muted)] shadow-sm hover:bg-[var(--fl-color-background-subtle)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => handleOAuthSignIn("github")}
        disabled={isLoading}
      >
        <Icon icon={Github} size={16} className="text-[var(--fl-color-text-muted)]" />
        <span className="ml-2">GitHub</span>
      </button>
    </div>
  );
}
