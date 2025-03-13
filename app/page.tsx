import { Button } from "@/components/ui/button";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Navigation Bar */}
        <nav className="py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-xl">Anoq</span>
          </Link>

          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
                <LogoutLink postLogoutRedirectURL="/">
                  <Button variant="ghost" className="rounded-full px-5 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition">Log Out</Button>
                </LogoutLink>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
                <LoginLink postLoginRedirectURL="/">
                  <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 shadow-md hover:shadow-lg transition-all duration-300">Join Now</Button>
                </LoginLink>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <main className="pt-12 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center">


              {/* Main heading with gradient text */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">
                  Empower your Products with
                </span>
                <br />
                <span className="relative">
                  <span className="text-gray-800">anonymous feedback</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 30" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 26c32.14-10.91 79.1-18.19 139.8-6.54 82.93 15.94 119.18-7.99 237.89-14.57"
                      stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" fill="none"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mb-10">
                Anoq helps teams build better products through honest, anonymous feedback. Uncover insights your users are too shy to share directly.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Link href="/create">
                  <Button className="min-w-[180px] h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 font-medium shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
                <Link href="/create/ai">
                  <Button variant="outline" className="min-w-[220px] h-12 rounded-full border-2 border-indigo-200 text-indigo-700 px-6 font-medium bg-white/90 hover:bg-indigo-50 hover:border-indigo-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                    <span className="mr-2">AI-Powered Insights</span>
                    <Sparkles className="size-4 text-yellow-500" />
                  </Button>
                </Link>
              </div>

              {/* Mockup Preview */}
              <div className="mt-20 w-full max-w-5xl mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10"></div>
                <div className="relative z-0 rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <div className="bg-gradient-to-r from-indigo-600/5 to-purple-600/5 p-1">
                    <div className="bg-white rounded-t-lg p-2 flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="h-[300px] bg-white">
                      {/* This is where you could add a screenshot/mockup of your product */}
                      <div className="flex items-center justify-center h-full text-gray-400">
                        Product Dashboard Preview
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}