'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleUserRound, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { HeaderActionsSkeleton } from '@/components/shared/site/loading-skeletons';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const dashboardHref = authUser?.role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((payload) => {
        setAuthUser(payload.user || null);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthUser(null);
        setAuthChecked(true);
      });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMenuOpen(false);
    setAuthUser(null);
    window.location.href = '/';
  }

  return (
    <header className="site-header">
      <div className="site-shell">
        <div className="site-header__bar">
          <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand__mark">R</span>
            <span className="brand__text">
              <span className="brand__name">Result Portal</span>
              <span className="brand__sub">Campus Result Hub</span>
            </span>
          </Link>

          <nav className={`site-nav${menuOpen ? ' open' : ''}`}>
            <div className="site-nav__links">
              <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/results" onClick={() => setMenuOpen(false)}>Results</Link>
              <Link href="/wall-of-toppers" onClick={() => setMenuOpen(false)}>Toppers</Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            </div>

            <div className="nav-action-group">
              <ThemeToggle className="theme-toggle--desktop" />
              {authUser ? (
                <>
                  <Link href={dashboardHref} className="ghost-button" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className="profile-link" onClick={() => setMenuOpen(false)}>
                    <span className="profile-link__icon"><CircleUserRound size={18} /></span>
                    <span>{authUser.name || 'Profile'}</span>
                  </Link>
                  <button className="ghost-button" type="button" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : !authChecked ? (
                <HeaderActionsSkeleton />
              ) : authChecked ? (
                <Link href="/sign-in" className="primary-button" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
              ) : null}
            </div>
          </nav>

          <div className="site-header__mobile-controls">
            <ThemeToggle className="theme-toggle--mobile" />
            <button
              className="mobile-toggle"
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}