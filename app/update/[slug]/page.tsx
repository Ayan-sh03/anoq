import { getData } from "@/app/[slug]/page";
import { Update } from "@/components/FormUpdate";
import { notFound } from "next/navigation";

const Page = async ({ params }: { params: { slug: string } }) => {

  const req = await getData(params.slug);

  if (req.length === 0) {
    notFound();
  }
  return (
    <div className="h-screen w-full ">
      <Update data={req[0]} slug={params.slug}/>
    </div>
  );
}

export default Page
