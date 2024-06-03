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
  params: { slug: string };
}) {
  const slug = params.slug;
  const res = await fetch(`http://localhost:3000/api/form/submissions/${slug}`);

  const { data } = await res.json();

  return (
    <main className="container h-screen  mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-between mb-8 md:flex-row">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View and manage All submissions.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <Input
              className="pl-10 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary"
              placeholder="Search submissions..."
              type="text"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <ListOrderedIcon className="w-5 h-5" />
                <span className="sr-only">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuRadioGroup value="date">
                <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rating">
                  Rating
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      
      {data && data.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {data?.map(async (item: any, index: number) => (
          <CardComponent email={item.email} name={item.name} key={index}  questions={item.question} choiceQuesions={item.choiceQuestion} />
        ))}
      </div>
):(
  <>
    <h2 className="text-xl">No Submissions!</h2>
  </>
)}

    </main>
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
