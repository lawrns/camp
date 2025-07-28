import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-neutral-900 py-24">
      <div className="container mx-auto px-6 text-center">
        <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl">Ready to transform your customer support?</h2>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-neutral-300">
          Join thousands of teams delivering exceptional experiences with Campfire. Start your free trial today—no
          credit card required.
        </p>

        <div className="mb-12 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="bg-primary inline-flex transform items-center justify-center rounded-ds-lg px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:bg-blue-700"
          >
            Start Free Trial
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-ds-lg border-2 border-gray-600 bg-transparent px-8 py-4 font-semibold text-white transition-all hover:border-gray-500 hover:bg-neutral-800"
          >
            Schedule Demo
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-400">
          <div className="flex items-center">
            <svg className="text-semantic-success mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            14-day free trial
          </div>
          <div className="flex items-center">
            <svg className="text-semantic-success mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center">
            <svg className="text-semantic-success mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}
