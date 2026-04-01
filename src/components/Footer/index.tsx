import Link from "next/link";

const legalLinks = [
  { label: "Poltica de Privacidade", href: "/legal/privacy" },
  { label: "Termos de Uso", href: "/legal/terms" },
  { label: "Poltica de Cookies", href: "/legal/cookies" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
             {new Date().getFullYear()} FitStyle. Todos os direitos reservados.
          </p>
          <nav className="flex flex-wrap justify-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
