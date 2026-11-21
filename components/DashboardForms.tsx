"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import FormCard from "./FormCard";
import type { FormSummary } from "@/lib/forms";

export default function DashboardForms({ forms }: { forms: FormSummary[] }) {
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(true);
  const term = query.trim().toLowerCase();
  const matches = forms.filter(form => `${form.title} ${form.description ?? ""}`.toLowerCase().includes(term));
  return <>
    {forms.length > 0 && <div className="collection-tools"><div className="search-field"><Search size={17} /><Input aria-label="Search forms" placeholder="Search forms" type="search" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className="view-toggle" aria-label="Form layout" role="group">{[true, false].map(tiles => <button type="button" key={String(tiles)} aria-label={tiles ? "Grid view" : "List view"} aria-pressed={grid === tiles} onClick={() => setGrid(tiles)}>{tiles ? <LayoutGrid /> : <List />}</button>)}</div>
    </div>}
    {matches.length ? <div className={grid ? "form-grid" : "form-list"}>{matches.map(form => <FormCard key={form.slug} {...form} />)}</div>
      : <section className="paper-panel empty"><h2 className="sheet-title">{term ? "No matching forms." : "Your first form goes here."}</h2>
        <p>{term ? "Try another title or description." : "Start with a question you’d like an honest answer to."}</p>
        {term ? <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button> : <Button asChild><Link href="/create">Create a form <ArrowRight /></Link></Button>}
      </section>}
  </>;
}
