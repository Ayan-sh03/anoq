import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
import { notFound } from "next/navigation";

async function getData(slug: string) {
  const response = await fetch(`http://localhost:3000/api/form/${slug}`, {
    cache: "no-store",
  });
  const data = await response.json();

  console.log('====================================');
  console.log(JSON.stringify(data, null, 2));
  console.log('====================================');


  if (!response.ok) return notFound();

  return data;
}

async function checkFilled(id: string) {
  const response = await fetch(`http://localhost:3000/api/submitted/${id}`, {
    cache: "no-store",
  });

  return response;
}

async function Page({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);

  if(data[0].status === "closed"){
    return <Closed/>
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
    <div className="h-screen w-full">
      <FormComponent data={data} slug={params.slug} />
    </div>
  );
}
export default Page;
