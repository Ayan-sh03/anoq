"use client";
import Loading from "@/app/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { ArrowRight, Sparkles, Link2, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

export default function CreateAI() {
  const [form, setForm] = useState({
    productHuntLink: "",
    description: "",
  });
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();

  if (isLoading) return <Loading />;

  if (!isAuthenticated) {
    redirect("/api/auth/login?post_login_redirect_url=/create/ai");
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    
    if (!form.productHuntLink && !form.description) {
      toast.toast({
        title: "Error",
        description: "Please enter a product description or a Product Hunt link to get started.",
        variant: "destructive",
      });
      setPending(false);
      return;
    }
    
    const body = JSON.stringify({
      productHuntLink: form.productHuntLink,
      description: form.description,
      author: user?.email,
    });
    
    const res = await fetch("/api/form/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      toast.toast({
        title: "Error",
        description: `Something went wrong: ${data.message}`,
        variant: "destructive",
      });
      setPending(false);
      return;
    }

    toast.toast({
      title: "Success",
      description: "Form created successfully!",
      action: (
        <Link href={`/${data.slug}`} className="text-primary hover:text-primary/80">
          Visit your form
        </Link>
      ),
      variant: "success",
    });

    setPending(false);
  }

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
      </nav>

      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-secondary text-foreground rounded-full border border-border mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Generate Your{' '}
              <span className="text-primary">Feedback Form</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Enter a product description or Product Hunt link to instantly create an optimized feedback form
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-8 rounded-2xl bg-card/50 border border-border space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <Label htmlFor="description" className="text-foreground font-medium">
                    Product Description
                  </Label>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={pending}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all min-h-[140px] text-lg"
                  placeholder="Describe your product features, target audience, and what feedback you're looking for..."
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-card text-sm text-muted-foreground">OR</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  <Label htmlFor="productHuntLink" className="text-foreground font-medium">
                    Product Hunt Link
                  </Label>
                </div>
                <Input
                  id="productHuntLink"
                  name="productHuntLink"
                  type="url"
                  value={form.productHuntLink}
                  onChange={handleChange}
                  disabled={pending}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-lg py-6"
                  placeholder="https://www.producthunt.com/posts/your-product"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={pending || (!form.description && !form.productHuntLink)}
                className="px-10 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                {pending ? (
                  "Generating..."
                ) : (
                  <>
                    Generate Feedback Form
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-48 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}
