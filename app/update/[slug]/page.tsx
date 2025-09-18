import { getData } from "@/app/[slug]/page";
import { Update } from "@/components/FormUpdate";
import { notFound } from "next/navigation";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const req = await getData(slug);

  if (req.length === 0) {
    notFound();
  }
  return (
    <div className="h-screen w-full ">
      <Update data={req[0]} slug={slug} />
    </div>
  );
}

export default Page
