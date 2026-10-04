import { Link } from "@tanstack/react-router";
import type React from "react";

type Props = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: Props) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <header className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Icon" width={32} height={32} />
            <span className="text-lg font-bold">My Expenses</span>
          </div>
        </header>
        {children}
        <footer className="text-sm text-muted-foreground px-4 text-center mt-6">
          En cliquant sur continuer, vous acceptez nos{" "}
          <Link className="underline font-medium" to="/legal/cgv">
            Conditions d&apos;utilisation
          </Link>{" "}
          et notre{" "}
          <Link className="underline font-medium" to="/legal/privacy">
            Politique de confidentialité
          </Link>
          .
        </footer>
      </div>
    </div>
  );
}
