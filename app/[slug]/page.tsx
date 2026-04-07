import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function getData(slug: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/${slug}`, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) return notFound();

  return data;
}

async function checkFilled(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submitted/${id}`, {
    cache: "no-store",
  });

  return response;
}

async function Page({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);

  if (data[0].status === "closed") {
    return <Closed />;
  }

  if (data.length === 0) {
    notFound();
  }

  const res = await checkFilled(data[0].id);
  const form = await res.json();

  if (!res.ok) {
    return <AlreadySubmitted />;
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

      <FormComponent data={data} slug={params.slug} />

      <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-48 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}

export default Page;
