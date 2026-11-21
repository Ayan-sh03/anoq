import type { ReactNode } from "react";
import Navbar from "./Navbar";

export default function StateSheet({ label, title, children, actions }: { label: string; title: string; children: ReactNode; actions: ReactNode }) {
  return <><Navbar /><main className="desk desk-narrow"><section className="state-sheet">
    <p className="kicker"><span className="ink-line" />{label}</p><h1>{title}</h1>
    <p>{children}</p><div className="action-row">{actions}</div>
  </section></main></>;
}
