"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Ellipsis, Lock, Unlock, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useToast } from "./ui/use-toast";

import type { FormSummary } from "@/lib/forms";

export default function FormCard({ title, description, slug, status }: FormSummary) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const open = status === "open";

  async function change(action: "delete" | "close" | "open") {
    if (action === "delete" && !window.confirm(`Delete “${title}” and its responses?`)) return;
    setPending(true);
    const suffix = action === "delete" ? "" : `/${action}`;
    const path = `/api/forms/${encodeURIComponent(slug)}${suffix}`;
    try {
      const res = await fetch(path, { method: action === "delete" ? "DELETE" : "PATCH", credentials: "same-origin" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch { toast({ title: "Couldn’t update this form", description: "Please try again.", variant: "destructive" }); }
    finally { setPending(false); }
  }
  return <article className="form-card">
    <div className="form-card-top"><span className={`form-status ${open ? "is-open" : ""}`}>{open ? "Open" : "Closed"}</span>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${title}`} disabled={pending}><Ellipsis /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild><Link href={`/update/${slug}`}><Pencil />Edit form</Link></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => change(open ? "close" : "open")}>{open ? <Lock /> : <Unlock />}{open ? "Close form" : "Open form"}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => change("delete")} className="text-destructive"><Trash2 />Delete form</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="form-card-copy"><h2><Link href={`/form/${slug}`}>{title}</Link></h2>{description && <p>{description}</p>}</div>
    <div className="form-card-links"><Link href={`/form/${slug}`}>Read replies <ArrowUpRight /></Link><Link href={`/${slug}`}>View form <ArrowUpRight /></Link></div>
  </article>;
}
