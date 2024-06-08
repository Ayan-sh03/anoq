"use client"
import {
  DeleteIcon,
  FlipVerticalIcon,
  Lock,
  LockOpen,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";

const FormCard = ({
  title,
  description,
  slug,
  status,
}: {
  title: string;
  description: string;
  slug: string;
  status: string;
}) => {

  const router = useRouter();
 async function toggleStatus(slug : string, status:string ) {
      if(status === "closed"){
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/open/${slug}`,{
          method :"PATCH"
        });
      }
      else{
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/close/${slug}`,{
          method :"PATCH"
        });
      }
  }

  async function deleteForm(slug: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/${slug}`, {
      method: "DELETE",
    });
    router.refresh()
  }



  return (
    <Card className="bg-white dark:bg-gray-950 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center gap-4 p-6">
        <div className="grid gap-1 flex-1">
          <Link href={`/form/${slug}`}>
            <CardTitle className="font-bold text-lg">{title}</CardTitle>
          </Link>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {description}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <FlipVerticalIcon className="w-4 h-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="cursor-pointer">
            <DropdownMenuItem>
              <DeleteIcon className="size-5 mr-2 cursor-pointer" />
              <Link href={`/update/${slug}`} >Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteForm(slug)}>
              <Trash2Icon className="size-5 mr-2 cursor-pointer" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus(slug, status)}>
              {status === "open" ? (
                <>
                  <Lock className="size-5 mr-2 cursor-pointer" />
                  Close
                </>
              ) : (
                <>
                  <LockOpen className="size-5 mr-2 cursor-pointer" />
                  Open
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href={`/${slug}`}
          className="text-primary hover:underline"
          prefetch={false}
        >
          View
          <span className="ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </Link>
      </CardHeader>
    </Card>
  );
};

export default FormCard;
