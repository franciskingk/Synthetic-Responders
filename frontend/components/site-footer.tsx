import Link from 'next/link';

const footerLinks = {
  Product: [
    { href: '/#product', label: 'Product Overview' },
    { href: '/#workflow', label: 'Workflow' },
    { href: '/#checklist', label: 'MVP Checklist' },
  ],
  Platform: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/personas', label: 'Personas' },
    { href: '/simulations', label: 'Simulations' },
  ],
  Resources: [
    { href: '/login', label: 'Login' },
    { href: '/register', label: 'Create Account' },
    { href: 'http://127.0.0.1:8000/docs', label: 'API Docs' },
  ],
};

export default function SiteFooter() {
  return (
    <footer className="relative z-10 mt-24 border-t border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] backdrop-blur-sm">
      <div className="container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <p className="eyebrow">Built For Research Teams</p>
            <h2 className="mt-3 font-heading text-2xl font-semibold text-[var(--ink-strong)]">
              A sharper MVP for persona-led survey simulation.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
              Synthetic Responders gives product, UX, and insight teams a single place to define audiences,
              test questionnaires, and review response patterns before live fieldwork begins.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                {title}
              </h3>
              <div className="mt-4 space-y-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-sm text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-strong)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--line-soft)] pt-6 text-sm text-[var(--ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 Synthetic Responders. MVP release for guided research simulation.</p>
          <p>No pricing page yet. Focus is on clarity, trust, and product proof.</p>
        </div>
      </div>
    </footer>
  );
}
