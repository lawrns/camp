export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--fl-color-background-subtle)]">
      <div className="animate-pulse">
        <div className="w-full max-w-md space-y-4">
          <div className="h-12 rounded-ds-lg bg-gray-200"></div>
          <div className="h-48 rounded-ds-lg bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
