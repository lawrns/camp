export function FeatureCards() {
  const features = [
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
        </svg>
      ),
      title: "AI-Powered Support",
      description: "Intelligent responses that understand context and learn from every interaction",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      title: "Seamless Integration",
      description: "Connect with your favorite tools and platforms in minutes, not days",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
        </svg>
      ),
      title: "Real-time Analytics",
      description: "Track performance, customer satisfaction, and team productivity in real-time",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      title: "Team Collaboration",
      description: "Work together seamlessly with shared inboxes, notes, and internal chat",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
        </svg>
      ),
      title: "Scalable Growth",
      description: "From startup to enterprise, grow without limits or performance issues",
    },
  ];

  return (
    <section className="bg-[var(--fl-color-background-subtle)] py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">Everything you need for exceptional support</h2>
          <p className="text-foreground mx-auto max-w-2xl text-lg">
            Powerful features that help you deliver personalized support at scale
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              data-testid="feature-card"
              className="bg-background rounded-ds-xl p-spacing-lg shadow-card-base transition-shadow duration-300 hover:shadow-card-deep"
            >
              <div className="mb-4 text-blue-600">{feature.icon}</div>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="leading-relaxed text-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
