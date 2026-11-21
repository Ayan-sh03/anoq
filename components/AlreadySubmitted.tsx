"use client";
import Link from "next/link";
import { useEffect } from "react";
import StateSheet from "./StateSheet";
import { Button } from "./ui/button";

export default function AlreadySubmitted({ slug }: { slug: string }) {
  useEffect(() => {
    try { sessionStorage.removeItem(`anoq:response-draft:${slug}`); } catch { /* Storage can be disabled. */ }
  }, [slug]);
  return <StateSheet label="Response received" title="Your note is in." actions={<><Button asChild variant="outline"><Link href="/">Return home</Link></Button><Link className="text-link" href={`/event/${slug}`}>Show event QR</Link></>}>You’ve already sent a response to this form. Thanks for sharing your thoughts.</StateSheet>;
}
