"use client";

import { useEffect } from "react";
import NextError from "next/error";
import { captureExceptionAndLogIfDevelopment } from "@/lib/shared/sentry";

export function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureExceptionAndLogIfDevelopment(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
    definition requires a `statusCode` prop. However, since the App Router
    does not expose status codes for errors, we simply pass 0 to render a
    generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
