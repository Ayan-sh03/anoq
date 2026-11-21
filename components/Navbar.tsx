import Link from "next/link";
import type { ReactNode } from "react";

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Anoq home">
      <svg aria-hidden="true" viewBox="0 0 36 36" width="34" height="34" fill="none">
        <path d="m7 14 7-10 12 4-5 7" fill="currentColor" />
        <path d="m4 16 5-5 2 1-3 4h19l-3-4 2-2 6 6v14H4V16Z" fill="currentColor" />
        <path d="M13 23h10" stroke="var(--sheet)" strokeWidth="2.4" />
      </svg>
      <span>anoq</span>
    </Link>
  );
}

export default function Navbar({ children, section }: { children?: ReactNode; section?: string }) {
  return (
    <header className="masthead">
      <nav className="wrap nav-inner" aria-label="Main navigation">
        <Brand />
        {section && <span className="nav-section">{section}</span>}
        <div className="nav-actions">{children}</div>
      </nav>
    </header>
  );
}
