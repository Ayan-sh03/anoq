"use client"
import {
  DeleteIcon,
  FlipVerticalIcon,
  Lock,
  LockOpen,
  Trash2Icon,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
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

  async function toggleStatus(slug: string, status: string) {
    if (status === "closed") {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/open/${slug}`, {
        method: "PATCH"
      });
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/close/${slug}`, {
        method: "PATCH"
      });
    }
    router.refresh();
  }

  async function deleteForm(slug: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/${slug}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="group relative rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:bg-card/80 hover:shadow-glow-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link href={`/form/${slug}`} className="block">
              <h3 className="font-display text-lg font-semibold text-foreground truncate hover:text-primary transition-colors">
                {title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description || "No description provided"}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 -mt-1 -mr-1">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <DeleteIcon className="w-4 h-4" />
                <Link href={`/update/${slug}`} className="flex items-center gap-2 w-full">
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteForm(slug)}>
                <Trash2Icon className="w-4 h-4" />
                <span>Delete</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => toggleStatus(slug, status)}>
                {status === "open" ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Close
                  </>
                ) : (
                  <>
                    <LockOpen className="w-4 h-4" />
                    Open
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            status === "open" 
              ? "bg-emerald-500/10 text-emerald-400" 
              : "bg-amber-500/10 text-amber-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "open" ? "bg-emerald-400" : "bg-amber-400"}`} />
            {status === "open" ? "Open" : "Closed"}
          </span>
          
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
          >
            View
            <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FormCard;
