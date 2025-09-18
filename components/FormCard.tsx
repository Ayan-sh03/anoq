"use client"
import {
  DeleteIcon,
  FlipVerticalIcon,
  Lock,
  LockOpen,
  Trash2Icon,
  BarChart3,
  Users,
  Calendar,
  Sparkles,
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
import { useState, useEffect } from "react";

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
  const [isHovered, setIsHovered] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [lastSubmission, setLastSubmission] = useState("");

  // Simulate fetching submission data
  useEffect(() => {
    // This would be replaced with actual API call
    setSubmissionCount(Math.floor(Math.random() * 150) + 10);
    setLastSubmission("2 hours ago");
  }, [slug]);
  async function toggleStatus(slug: string, status: string) {
    if (status === "closed") {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/open/${slug}`, {
        method: "PATCH"
      });
    }
    else {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/close/${slug}`, {
        method: "PATCH"
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
    <Card
      className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-in-out hover:translate-y-[-4px] border border-gray-100 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>

      <CardHeader className="relative z-10 flex flex-row items-center gap-4 p-6">
        <div className="flex-1">
          {/* Title with enhanced gradient effect */}
          <Link href={`/form/${slug}`}>
            <CardTitle className="font-bold text-xl text-gray-800 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 mb-2">
              {title}
            </CardTitle>
          </Link>
          <CardDescription className="text-gray-600 text-sm leading-relaxed">
            {description}
          </CardDescription>

          {/* Stats section */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              <span>{submissionCount} responses</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{lastSubmission}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${status === 'open' ? 'text-green-600' : 'text-orange-600'}`}>
              {status === 'open' ? <Sparkles className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span className="capitalize">{status}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick stats badge */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status === 'open' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {status === 'open' ? 'Active' : 'Closed'}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-300">
                <FlipVerticalIcon className="w-4 h-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="cursor-pointer bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
              <DropdownMenuItem className="hover:bg-indigo-50 transition-colors duration-200">
                <BarChart3 className="size-4 mr-2 cursor-pointer text-indigo-600" />
                <Link href={`/form/${slug}`} className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">Analytics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-indigo-50 transition-colors duration-200">
                <DeleteIcon className="size-4 mr-2 cursor-pointer text-indigo-600" />
                <Link href={`/update/${slug}`} className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteForm(slug)} className="hover:bg-red-50 transition-colors duration-200">
                <Trash2Icon className="size-4 mr-2 cursor-pointer text-red-500" />
                <span className="text-gray-700 hover:text-red-500 transition-colors duration-200">Delete</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStatus(slug, status)} className="hover:bg-indigo-50 transition-colors duration-200">
                {status === "open" ? (
                  <>
                    <Lock className="size-4 mr-2 cursor-pointer text-indigo-600" />
                    <span className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">Close</span>
                  </>
                ) : (
                  <>
                    <LockOpen className="size-4 mr-2 cursor-pointer text-indigo-600" />
                    <span className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">Open</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </CardHeader>
    </Card>
  );
};

export default FormCard;
