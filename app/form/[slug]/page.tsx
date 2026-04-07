import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CardComponent } from "@/components/CardComponent";
import { Search, List, FileText } from "lucide-react";
import Link from "next/link";

export default async function Submission({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form/submissions/${slug}`);

  const { data } = await res.json();

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-slate-700/40 to-slate-800/20 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-900/30 to-slate-900/20 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-10">
          <div>
            <Link href="/" className="font-display text-2xl font-bold tracking-tight mb-2 inline-block text-foreground">
              Submissions
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Form Responses</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all submissions
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                className="pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Search submissions..."
                type="text"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-border">
                  <List className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuRadioGroup value="date">
                  <DropdownMenuRadioItem value="date" className="focus:bg-primary/10">
                    Newest First
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest" className="focus:bg-primary/10">
                    Oldest First
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.map((item: any, index: number) => (
              <div 
                key={index} 
                className="opacity-0 animate-slide-up" 
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
              >
                <CardComponent 
                  email={item.email} 
                  name={item.name} 
                  key={index}  
                  questions={item.question} 
                  choiceQuesions={item.choiceQuestion} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-card/50 border border-border text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              No Submissions Yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              Share your form to start collecting anonymous feedback from your users
            </p>
          </div>
        )}
      </div>

      <div className="absolute top-32 right-20 w-20 h-20 rounded-full bg-gradient-to-br from-slate-600/30 to-slate-700/20 blur-xl animate-float" />
      <div className="absolute bottom-48 left-20 w-24 h-24 rounded-full bg-gradient-to-br from-teal-700/20 to-slate-800/20 blur-xl animate-float-delay" />
    </div>
  );
}
