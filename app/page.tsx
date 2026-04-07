import FeaturesPage from "@/components/Features";
import { Button } from "@/components/ui/button";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Shield, Zap, BarChart2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();

  return (
    <>
      <div className="min-h-screen overflow-hidden relative">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/20 blur-[120px]" />
          <div className="absolute bottom-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-900/30 to-slate-900/20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-slate-800/20 to-transparent blur-[150px]" />
        </div>

        <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
          <Link href="/" className="font-display text-3xl font-bold tracking-tight">
            <span className="text-foreground">
              Anoq
            </span>
          </Link>
          
          <div className="ml-auto flex items-center gap-2">
            {authenticated ? (
              <LogoutLink postLogoutRedirectURL="/">
                <Button variant="ghost" className="text-foreground/70 hover:text-foreground hover:bg-secondary">
                  Sign Out
                </Button>
              </LogoutLink>
            ) : (
              <LoginLink postLoginRedirectURL="/">
                <Button variant="ghost" className="text-foreground/70 hover:text-foreground hover:bg-secondary">
                  Sign In
                </Button>
              </LoginLink>
            )}
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group">
                Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </nav>

        <main className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center pt-20 pb-32">
            <div className="mb-8 opacity-0 animate-slide-up">
              <span className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-secondary text-foreground border border-border">
                <Zap className="w-4 h-4 text-primary" />
                Zero Fear, 100% Anonymous
              </span>
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 opacity-0 animate-slide-up stagger-1">
              <span className="text-foreground">Speak freely.</span>
              <br />
              <span className="text-primary">Grow fearlessly.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed opacity-0 animate-slide-up stagger-2">
              Anoq lets users share <span className="text-foreground font-medium">100% anonymous</span> feedback—so you get the <span className="text-foreground font-medium">raw, unfiltered truth</span> to build better products.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 opacity-0 animate-slide-up stagger-3">
              <Link href="/create">
                <Button size="lg" className="px-8 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group w-full sm:w-auto">
                  Start Collecting Feedback
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create/ai">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-foreground/20 text-foreground hover:bg-secondary group w-full sm:w-auto">
                  <Zap className="mr-2 w-5 h-5 text-primary" />
                  AI-Powered Setup
                </Button>
              </Link>
            </div>

            <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto opacity-0 animate-slide-up stagger-4">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground/80">Complete Anonymity</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground/80">AI-Powered Insights</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/50 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground/80">Real-Time Analytics</span>
              </div>
            </div>
          </div>
        </main>

        <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float opacity-0 animate-fade-in" />
        <div className="absolute bottom-60 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay opacity-0 animate-fade-in" />
      </div>
      <FeaturesPage />
    </>
  );
}
