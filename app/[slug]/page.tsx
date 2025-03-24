import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
import Navbar from "@/components/Navbar";
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
    return <Closed />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-900 to-indigo-900 overflow-hidden relative ">
      {/* <Navbar/> */}
      <nav className="container mx-auto px-6 py-6 bg-transparent flex items-center z-10 relative">
        <Link href="/" className="font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300 hover:from-pink-300 hover:to-purple-400 transition-all">
          Anoq
        </Link>
      </nav>

      <FormComponent data={data} slug={params.slug} />
    </div>
  );
}
export default Page;
