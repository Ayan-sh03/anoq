import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import Features from "@/components/Features";
import Navbar, { Brand } from "@/components/Navbar";
import SampleBox from "@/components/SampleBox";
import { Button } from "@/components/ui/button";
import { workspaceUser } from "@/lib/auth/workspace";
import SignOut from "@/components/SignOut";

export default async function Home() {
  const authenticated = await workspaceUser();
  return (
    <>
      <Navbar>
        <a href="#how-it-works" className="nav-link how-link">How it works</a>
        {authenticated
          ? <SignOut />
          : <Link href="/login" className="nav-link">Sign in</Link>}
        <Button variant="ink" size="sm" asChild><Link href="/dashboard">Dashboard <ArrowUpRight /></Link></Button>
      </Navbar>
      <main>
        <section className="wrap hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="kicker"><span className="ink-line" /> Anonymous feedback forms</p>
            <h1 id="hero-heading">Small box.<br /><span>Big opinions.</span></h1>
            <p className="hero-description">Give people a place to say what they really think. Create a feedback form, share a link, and let the honest answers roll in.</p>
            <div className="action-row">
              <Button asChild size="lg"><Link href="/create">Create a form <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/create/ai"><Sparkles /> Build with AI</Link></Button>
            </div>
          </div>
          <SampleBox />
        </section>
        <Features />
      </main>
      <footer className="wrap foot"><Brand /><a href="#hero-heading" className="text-link">Back to top ↑</a></footer>
    </>
  );
}
