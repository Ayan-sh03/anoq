import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

export async function getData(slug: string) {
  const response = await fetch(`${process.env.URL}/api/form/${slug}`, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) return notFound();

  return data;
}

async function checkFilled(id: string) {
  const response = await fetch(`${process.env.URL}/api/submitted/${id}`, {
    cache: "no-store",
  });

  return response;
}

async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getData(slug);

  console.log("Data:", data);
  if (data.status === "closed") {
    return <Closed />
  }

  if (data.length === 0) {
    notFound();
  }

  

  const res = await checkFilled(data.slug);

  if (!res.ok) {
    return <AlreadySubmitted />;
  }

  return (
    <div className="min-h-screen w-full ">
      <Navbar />
      <FormComponent data={data} slug={slug} />
    </div>
  );
}
export default Page;
