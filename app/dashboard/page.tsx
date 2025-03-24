import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import { Form } from "@/dbschema/interfaces";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Plus, ArrowRight, Search, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function Page() {
  const { getUser, isAuthenticated } = getKindeServerSession();

  const user = await getUser();
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login?postLoginRedirectUrl=/dashboard");
  }

  const forms = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
    method: "GET",
    headers: {
      "X-User-Email": user && user.email ? user.email : "",
    },
    cache: "no-store",
  });

  if (!forms.ok) {
    notFound()
  }

  const { data } = await forms.json();

  return <Dashboard data={data} />;
}

function Dashboard({ data }: { data: Form[] }) {
  return (
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
          <Link href="/create">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Form
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Your Feedback Forms</h1>
            <p className="text-gray-300">Manage all your anonymous feedback collection forms</p>
          </div>

          {/* Search and Filter (Placeholder) */}
          <div className="mb-8 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search forms..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
              Filter
            </Button>
          </div>

          {/* Forms Grid */}
          {data.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((form, index) => (
                <FormCard
                  key={index}
                  title={form.title}
                  description={form.description}
                  slug={form.slug}
                  status={form.status}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No forms yet</h3>
              <p className="text-gray-300 mb-4">Create your first form to start collecting anonymous feedback</p>
              <Link href="/create">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  Create Form <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Floating Animated Shapes */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
    </div>
  );
}