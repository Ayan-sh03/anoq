"use client"
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
      <Link href="/" className="font-display text-3xl font-bold tracking-tight text-foreground">
        Anoq
      </Link>
    </nav>
  );
}

export default Navbar;
