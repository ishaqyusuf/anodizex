export function LandingMetrics() {
  return (
    <section className="relative z-10 border-y border-border bg-muted py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
            Free
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            During Early Access
          </p>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">
            1-10
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Staff Beachhead
          </p>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
            100
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Customer Limit
          </p>
        </div>
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">
            200
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Follow-Up Limit
          </p>
        </div>
      </div>
    </section>
  );
}
