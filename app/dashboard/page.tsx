import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import { Form } from "@/dbschema/interfaces";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Plus, Search, MessageSquare, ArrowRight, LayoutGrid, List } from "lucide-react";
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
    notFound();
  }

  const { data } = await forms.json();

  return <Dashboard data={data} />;
}

function Dashboard({ data }: { data: Form[] }) {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/20 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-900/30 to-slate-900/20 blur-[120px]" />
      </div>

      <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
        <Link href="/" className="font-display text-3xl font-bold tracking-tight text-foreground">
          Anoq
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Link href="/create">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group">
              <Plus className="w-4 h-4" />
              New Form
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h1 className="font-display text-4xl font-bold text-foreground mb-3">
              Your Feedback Forms
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all your anonymous feedback collection forms
            </p>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search forms..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-card">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {data.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((form, index) => (
                <div key={index} className="opacity-0 animate-slide-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}>
                  <FormCard
                    title={form.title}
                    description={form.description}
                    slug={form.slug}
                    status={form.status}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-card/50 border border-border text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                No forms yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                Create your first form to start collecting anonymous feedback from your users
              </p>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group">
                  Create Form
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-48 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}
