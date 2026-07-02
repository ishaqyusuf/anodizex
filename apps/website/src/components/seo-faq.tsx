export type SeoFaqItem = {
  answer: string;
  question: string;
};

export function SeoFaq({ items }: { items: SeoFaqItem[] }) {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div className="py-6" key={item.question}>
              <h3 className="font-semibold text-foreground">{item.question}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
