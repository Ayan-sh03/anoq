"use client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { redirect } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Loading from "@/app/Loading";
import Link from "next/link";

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
          Visit your form on anoq.com/{data.slug}
        </Link>
      ),
      variant: "success",
    });

    setPending(false);
  }
  return (
    <div className="overflow-hidden h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-full    bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                Generate Feedback Form
              </h1>
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                Enter a product description or a Product Hunt link to get
                started.
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="product-description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Product Description
                  </Label>
                  <Textarea
                    id="product-description"
                    name="description"
                    disabled={pending}
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 sm:text-sm"
                    placeholder="Describe your product..."
                  />
                </div>
                <span className="font-bold "> OR</span>
                <div className="space-y-2">
                  <Label
                    htmlFor="product-hunt-link"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Product Hunt Link
                  </Label>
                  <Input
                    id="productHuntLink"
                    value={form.productHuntLink}
                    name="productHuntLink"
                    onChange={handleChange}
                    disabled={pending}
                    type="url"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 sm:text-sm"
                    placeholder="https://www.producthunt.com/posts/your-product"
                  />
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button type="submit" disabled={pending}>
                  Generate Feedback Form
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
