import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StateSheet from "@/components/StateSheet";

export default function ThankYouPage() {
  return <StateSheet label="Response received" title="Thanks for the note." actions={<>
    <Button asChild><Link href="/dashboard">Go to dashboard <ArrowRight /></Link></Button>
    <Button asChild variant="outline"><Link href="/create">Create another form</Link></Button>
  </>}>Your feedback has reached the form owner. Thanks for taking the time to share it.</StateSheet>;
}
