import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SVGProps } from "react";
import { CardComponent } from "@/components/CardComponent";
export default async function Submission({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await fetch(`${process.env.URL}/api/form/submissions/${slug}`, {
    credentials: "include", // Include cookies for authentication
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Background decorative elements - matching landing page theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-200/30 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-200/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl"></div>
      </div>

      <main className="container min-h-screen mx-auto px-4 py-8 md:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-between mb-8 md:flex-row">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Form Submissions
            </h1>
            <p className="text-gray-600">
              View and manage all submissions.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white/90 shadow-sm hover:shadow-md transition-all duration-300"
                placeholder="Search submissions..."
                type="text"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="rounded-full bg-white/90 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all duration-300">
                  <ListOrderedIcon className="w-5 h-5" />
                  <span className="sr-only">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
                <DropdownMenuRadioGroup value="date">
                  <DropdownMenuRadioItem value="date" className="hover:bg-indigo-50 focus:bg-indigo-100 transition-colors duration-200">
                    Date
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rating" className="hover:bg-indigo-50 focus:bg-indigo-100 transition-colors duration-200">
                    Rating
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.map(async (item: any, index: number) => (
              <CardComponent email={item.email} name={item.name} key={index} questions={item.question} choiceQuesions={item.choiceQuestion} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-xl opacity-30"></div>
              <div className="relative bg-white rounded-full p-6 shadow-lg">
                <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              No Submissions Yet
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              When users start submitting your form, their responses will appear here.
            </p>
          </div>
        )}
      </main>
    </div>
  );

  function ListOrderedIcon(props: HTMLOrSVGElement | SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="10" x2="21" y1="6" y2="6" />
        <line x1="10" x2="21" y1="12" y2="12" />
        <line x1="10" x2="21" y1="18" y2="18" />
        <path d="M4 6h1v4" />
        <path d="M4 10h2" />
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
      </svg>
    );
  }

  function MoveHorizontalIcon(props: HTMLOrSVGElement) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 8 22 12 18 16" />
        <polyline points="6 8 2 12 6 16" />
        <line x1="2" x2="22" y1="12" y2="12" />
      </svg>
    );
  }

  function SearchIcon(props: HTMLOrSVGElement | SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  }

  function StarIcon(props: HTMLOrSVGElement) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
}
