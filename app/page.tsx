import FeaturesPage from "@/components/Features";
import { Button } from "@/components/ui/button";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600 blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-600 blur-[120px] animate-pulse delay-300"></div>
        </div>
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
          <Link href="/" className="font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 hover:from-pink-300 hover:to-purple-400 transition-all">
            Anoq
          </Link>
          <div className="ml-auto flex items-center space-x-3">
            {authenticated ? (
              <LogoutLink postLogoutRedirectURL="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
                  Sign Out
                </Button>
              </LogoutLink>
            ) : (
              <LoginLink postLoginRedirectURL="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm">
                  Sign In
                </Button>
              </LoginLink>
            )}
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </nav>
        {/* Hero Section */}
        <main className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-4">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-white rounded-full backdrop-blur-sm border border-white/10">
                🚀 Anonymous Feedback, Zero Fear
              </span>
            </div>
            <h1 className="text-6xl font-bold text-white leading-tight mb-6">
              Speak <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">freely.</span><br />
              Grow <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-indigo-300">fearlessly.</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Anoq lets users share <strong>100% anonymous</strong> feedback—so you get the <strong>raw, unfiltered truth</strong> to improve your product.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/create">
                <Button className="px-8 py-5 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-600/40 transition-all transform hover:scale-105 group">
                  Start Collecting Feedback
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/create/ai">
                <Button variant="outline" className="px-8 py-5 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm flex items-center gap-2 group">
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                  AI-Powered Setup
                </Button>
              </Link>
            </div>
          </div>
        </main>
        {/* Floating Animated Shapes (Decorative) */}
        <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
      </div>
        <FeaturesPage></FeaturesPage>
    </>
  );
}