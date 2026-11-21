import { Loader2 } from "lucide-react";

export default function Loading() {
  return <div role="status" className="loading-state"><Loader2 className="animate-spin" size={22} />Loading…</div>;
}
