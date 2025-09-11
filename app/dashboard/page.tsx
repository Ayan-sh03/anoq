'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import { Form } from "@/dbschema/interfaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    fetchForms();
  }, [user, loading, isAuthenticated, router]);

  const fetchForms = async () => {
    try {
      setFormsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }

      const { data } = await response.json();
      setForms(data);
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

function Dashboard({ data }: { data: Form[] }) {
  return (
    <div className="flex flex-col w-full min-h-screen container">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] bg-gray-100/40 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 dark:bg-gray-800/40">
        <div className="max-w-6xl w-full mx-auto flex items-center gap-4">
          <Link href="/create"><Button>Create New</Button></Link>
        </div>
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
      </main>
    </div>
  );
}
