import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-6 py-24 text-center text-white">
        <div className="mb-8 flex justify-center">
          <div className="bg-background/10 radius-2xl p-spacing-md backdrop-blur-sm">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
        </div>

        <h1 className="page-header-h1">Welcome to Campfire</h1>

        <p className="mx-auto mb-12 max-w-3xl text-lg text-white/90 md:text-3xl">
          The AI-powered customer support platform that brings teams together and delivers exceptional experiences at
          scale
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="bg-background hover:bg-background inline-flex transform items-center justify-center rounded-ds-lg px-8 py-4 font-semibold text-purple-700 shadow-xl transition-all hover:scale-105"
          >
            Get Started Free
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <Link
            href="/demo"
            className="hover:bg-background inline-flex items-center justify-center rounded-ds-lg border-2 border-white bg-transparent px-8 py-4 font-semibold text-white transition-all hover:text-purple-800"
          >
            Book a Demo
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">50k+</div>
            <div className="text-white/80">Active Users</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">99.9%</div>
            <div className="text-white/80">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold">4.9/5</div>
            <div className="text-white/80">Customer Rating</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
        <svg className="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
