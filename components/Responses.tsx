"use client";
import { useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { CardComponent, type Reply } from "./CardComponent";
import { Button } from "./ui/button";

const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
};
const localTime = new Intl.DateTimeFormat(undefined, dateOptions);
const subscribe = () => () => {};

export default function Responses({ replies }: { replies: Reply[] }) {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("newest");
  // Hydration uses the server's UTC string before switching to the reader's locale.
  const formatter = useSyncExternalStore<Intl.DateTimeFormat | null>(subscribe, () => localTime, () => null);
  const term = query.trim().toLowerCase();
  const matches = replies.filter(reply => [reply.name || "Anonymous", reply.email, ...reply.answers.flatMap(answer => [answer.prompt, answer.value])].some(text => text?.toLowerCase().includes(term)));
  const dated = replies.length > 1 && replies.every(reply => Number.isFinite(Date.parse(reply.date || "")));
  if (dated) matches.sort((a, b) => (Date.parse(b.date!) - Date.parse(a.date!)) * (order === "newest" ? 1 : -1));
  return <>
    {!!replies.length && <div className="collection-tools"><div className="search-field"><Search size={17} /><Input type="search" aria-label="Search responses" placeholder="Search responses" value={query} onChange={e => setQuery(e.target.value)} /></div>
      {dated && <select className="field sort-field" aria-label="Sort responses" value={order} onChange={e => setOrder(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>}
    </div>}
    {matches.length ? <div className="form-grid">{matches.map((reply, i) => <CardComponent key={reply.id ?? i} reply={reply} formatter={formatter} />)}</div>
    : <section className="paper-panel empty"><h2 className="sheet-title">{term ? "No matching responses." : "No replies yet."}</h2><p>{term ? "Try searching for a different word." : "Share your form link to collect your first response."}</p>{term && <Button variant="outline" onClick={() => setQuery("")}>Clear search</Button>}</section>}
  </>;
}
