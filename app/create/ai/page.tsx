"use client";
import Loading from "@/app/Loading";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { ArrowRight, Sparkles, SparklesIcon } from "lucide-react";
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
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    if (!form.productHuntLink && !form.description) {
      toast.toast({
        title: "Error",
        description:
          "Please enter a product description or a Product Hunt link to get started.",
        variant: "destructive",
      });
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
    }

    toast.toast({
      title: "Success",
      description: "Form created successfully.",
      action: (
        <Link href={`/${data.slug}`}>
          Visit your form on {process.env.NEXT_PUBLIC_API_URL}/{data.slug}
        </Link>
      ),
      variant: "success",
    });

    setPending(false);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-indigo-600 blur-[120px] animate-pulse delay-300"></div>
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 text-sm font-medium bg-white/10 text-white rounded-full backdrop-blur-sm border border-white/10">
              <SparklesIcon className="w-4 h-4 mr-2" /> AI-Powered
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Generate Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">Feedback Form</span>
            </h1>
            <p className="text-gray-300 max-w-lg mx-auto">
              Enter a product description or Product Hunt link to instantly create an optimized feedback form
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-6">
              {/* Product Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-gray-300">
                  Product Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled={pending}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                  placeholder="Describe your product features, target audience, and what feedback you're looking for..."
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-gray-950 text-sm text-gray-300">OR</span>
                </div>
              </div>

              {/* Product Hunt Link */}
              <div className="space-y-3">
                <Label htmlFor="productHuntLink" className="text-gray-300">
                  Product Hunt Link
                </Label>
                <Input
                  id="productHuntLink"
                  name="productHuntLink"
                  type="url"
                  value={form.productHuntLink}
                  onChange={handleChange}
                  disabled={pending}
                  className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://www.producthunt.com/posts/your-product"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={pending || (!form.description && !form.productHuntLink)}
                className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-purple-600/40 transition-all transform hover:scale-105 group"
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

      {/* Floating Animated Shapes */}
      <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-purple-500/30 blur-xl animate-float"></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 rounded-full bg-pink-500/30 blur-xl animate-float-delay"></div>
    </div>
  );
}
