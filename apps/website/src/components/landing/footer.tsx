import { BrandLogo } from "@afterservice/ui";
import { appMetadata } from "@afterservice/utils";
import { featurePages, guidePages, solutionPages } from "../../lib/seo-content";

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background pb-[calc(8rem+env(safe-area-inset-bottom))] pt-16 transition-colors duration-300 md:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo name={appMetadata.name} />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              One follow-up board for local service operators after the job is
              done.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} afterservice. All rights reserved.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Solutions</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              {solutionPages.map((page) => (
                <a
                  href={page.path}
                  className="transition-colors hover:text-[#18211c] dark:hover:text-white"
                  key={page.path}
                >
                  {page.audience}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Product</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <a
                href="/features"
                className="transition-colors hover:text-[#18211c] dark:hover:text-white"
              >
                Features
              </a>
              {featurePages.map((page) => (
                <a
                  href={page.path}
                  className="transition-colors hover:text-[#18211c] dark:hover:text-white"
                  key={page.path}
                >
                  {page.title.replace(" | afterservice", "")}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Guides</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              {guidePages.map((page) => (
                <a
                  href={page.path}
                  className="transition-colors hover:text-[#18211c] dark:hover:text-white"
                  key={page.path}
                >
                  {page.title.replace(" | afterservice", "")}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Company</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <a
                href="/pricing"
                className="transition-colors hover:text-[#18211c] dark:hover:text-white"
              >
                Pricing
              </a>
              <a
                href="/privacy"
                className="transition-colors hover:text-[#18211c] dark:hover:text-white"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="transition-colors hover:text-[#18211c] dark:hover:text-white"
              >
                Terms of Service
              </a>
              <a
                href="mailto:hello@afterservice.app"
                className="transition-colors hover:text-[#18211c] dark:hover:text-white"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
