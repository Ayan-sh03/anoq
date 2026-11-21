"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import StateSheet from "@/components/StateSheet";
import { Button } from "@/components/ui/button";

export default function ErrorScreen({ reset }: { error: Error; reset: () => void }) {
  return <StateSheet label="Connection problem" title="Couldn’t open this page." actions={<>
    <Button onClick={reset}><RotateCcw /> Try again</Button>
    <Button variant="outline" asChild><Link href="/">Return home</Link></Button>
  </>}>Anoq couldn’t load the information for this page. Try again in a moment.</StateSheet>;
}
