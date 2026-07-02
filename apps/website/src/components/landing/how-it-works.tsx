export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 bg-muted border-y border-border py-24 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Three Steps to a Cleaner Follow-Up Habit
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start with the manual workflow that proves value before turning on
            deeper automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary mb-6">
              1
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Log Completed Work
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Add the customer, service date, job notes, and the next touch you
              promised after the work is done.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary mb-6">
              2
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Work the Board
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Use due dates, statuses, templates, and ownership so no check-in
              depends on memory.
            </p>
          </div>

          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary mb-6">
              3
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Close the Loop
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Log sends and replies, recover issues, request honest feedback,
              and schedule future service reminders.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
