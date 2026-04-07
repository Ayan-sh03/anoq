import { getData } from "@/app/[slug]/page";
import { Update } from "@/components/FormUpdate";
import { notFound } from "next/navigation";

const Page = async ({ params }: { params: { slug: string } }) => {
  const req = await getData(params.slug);

  if (req.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/20 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-900/30 to-slate-900/20 blur-[120px]" />
      </div>

      <nav className="container mx-auto px-6 py-6 flex items-center z-10 relative">
        <a href="/" className="font-display text-3xl font-bold tracking-tight text-foreground">
          Anoq
        </a>
      </nav>

      <Update data={req[0]} slug={params.slug} />

      <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-48 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}

export default Page;
