'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';

const marketingLinks = [
  { href: '/#product', label: 'Product' },
  { href: '/#workflow', label: 'Workflow' },
  { href: '/#checklist', label: 'SaaS Checklist' },
  { href: '/#faq', label: 'FAQ' },
];

const appLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/personas', label: 'Personas' },
  { href: '/surveys', label: 'Surveys' },
  { href: '/simulations', label: 'Simulations' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
  }, [pathname]);

  const inProduct = pathname.startsWith('/dashboard') || pathname.startsWith('/personas') || pathname.startsWith('/surveys') || pathname.startsWith('/simulations');
  const showAppNav = isAuthenticated && inProduct;
  const activeLinks = showAppNav ? appLinks : marketingLinks;

  const handleLogout = () => {
    auth.clear();
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(250,248,243,0.72)] backdrop-blur-xl">
      <nav className="container flex h-20 items-center justify-between gap-6">
        <Link href={showAppNav ? '/dashboard' : '/'} className="flex items-center gap-3">
          <span className="brand-mark">
            SR
          </span>
          <span className="flex flex-col">
            <span className="font-heading text-lg font-semibold text-[var(--ink-strong)]">Synthetic Responders</span>
            <span className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              {showAppNav ? 'Research Workspace' : 'Synthetic Research Lab'}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {activeLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href || pathname.startsWith(`${link.href}/`) ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {showAppNav ? (
            <>
              <Link href="/" className="button-secondary hidden sm:inline-flex">
                Marketing Site
              </Link>
              <button type="button" onClick={handleLogout} className="button-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="button-secondary">
                Login
              </Link>
              <Link href={isAuthenticated ? '/dashboard' : '/register'} className="button">
                {isAuthenticated ? 'Open Workspace' : 'Start Building'}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
