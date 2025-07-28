export function StatsSection() {
  const stats = [
    { value: "2M+", label: "Messages Handled", subtext: "Every month" },
    { value: "500K+", label: "Happy Customers", subtext: "Across 120 countries" },
    { value: "98%", label: "Resolution Rate", subtext: "First contact" },
    { value: "<2min", label: "Response Time", subtext: "Average" },
  ];

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-24">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Trusted by teams worldwide</h2>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Join thousands of companies delivering exceptional customer experiences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2 text-5xl font-bold text-white">{stat.value}</div>
              <div className="mb-1 text-base font-medium text-white/90">{stat.label}</div>
              <div className="text-sm text-white/70">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
