"use client"
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "@/lib/auth/context";
import { User, LogOut, Plus, BarChart3 } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-300">
              A
            </div>
            <span className="font-bold text-xl text-gray-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
              Anoq
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/create" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.email}</span>
                </div>
                <Link href="/logout">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                    <LogOut className="w-4 h-4" />
                    <span className="ml-1">Logout</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
