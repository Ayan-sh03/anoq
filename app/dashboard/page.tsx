'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAuth } from '@/lib/auth/context';
import { Sparkles, FileText, Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [forms, setForms] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);

  useEffect(() => {
    console.log("User state changed:", { user, loading, isAuthenticated });
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return;
    }

    fetchForms();
  }, [user, loading, isAuthenticated, router]);

  const fetchForms = async () => {
    try {
      setFormsLoading(true);
      const response = await fetch(`/api/dashboard`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const data = await response.json();
      setForms(data.data || data);
    } catch (error) {
      console.error('Error fetching forms:', error);
      notFound();
    } finally {
      setFormsLoading(false);
    }
  };

  if (loading || formsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  return <Dashboard data={forms} />;
}

function Dashboard({ data }: { data: any[] }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements - matching landing page theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
          <div className="max-w-6xl w-full mx-auto flex items-center gap-4">
            <Link href="/create">
              <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Create New Form
              </Button>
            </Link>
          </div>

          {data.length === 0 ? (
            // Empty State - Beautiful design following landing page theme
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto">
                {/* Decorative icon */}
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30"></div>
                  <div className="relative bg-white rounded-full p-6 shadow-lg">
                    <FileText className="w-16 h-16 text-indigo-600" />
                  </div>
                </div>

                {/* Main heading with gradient text */}
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    No forms yet?
                  </span>
                </h2>

                {/* Subheading */}
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto">
                  Start collecting anonymous feedback by creating your first form. It's quick, easy, and your users will love the anonymity.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/create">
                    <Button className="min-w-[200px] h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 font-medium shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Form
                    </Button>
                  </Link>
                  <Link href="/create/ai">
                    <Button variant="outline" className="min-w-[220px] h-12 rounded-full border-2 border-indigo-200 text-indigo-700 px-6 font-medium bg-white/90 hover:bg-indigo-50 hover:border-indigo-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300">
                      <span className="mr-2">AI-Powered Creation</span>
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </Button>
                  </Link>
                </div>

                {/* Mockup Preview - Similar to landing page */}
              </div>
            </div>
          ) : (
            // Forms Grid - Existing layout
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full mx-auto">
              {data.map((form, index) => {
                return (
                  <FormCard
                    key={index}
                    title={form.title}
                    description={form.description}
                    slug={form.slug}
                    status={form.status}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
