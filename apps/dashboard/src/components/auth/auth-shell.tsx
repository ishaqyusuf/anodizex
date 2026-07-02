import { BrandLogo } from "@afterservice/ui";
import { appMetadata } from "@afterservice/utils";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
};

export function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo name={appMetadata.name} />
        </div>
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </header>
        {children}
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </main>
  );
}

export function AuthFooter({ children }: { children: ReactNode }) {
  return (
    <div className="text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
