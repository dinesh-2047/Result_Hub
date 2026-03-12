import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="site-shell footer__inner">
        <span>&copy; {new Date().getFullYear()} Campus Result Hub</span>
        <nav className="footer__links">
          <Link href="/">Home</Link>
          <Link href="/results">Results</Link>
          <Link href="/wall-of-toppers">Toppers</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </footer>
  );
}