import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Animated background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/20 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/15 blur-3xl animate-pulse delay-2000"></div>

        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-1100"></div>
      </div>

      {/* Enhanced header section */}
      <div className="relative z-10 pt-8 pb-6">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                {data.title}
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {data.description}
            </p>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>100% Anonymous</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Takes 2 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <FormComponent data={data} slug={slug} />
      </div>
    </div>
  );
}
export default Page;
