import Link from "next/link";
import StateSheet from "@/components/StateSheet";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <StateSheet label="Page not found" title="No form here." actions={<Button asChild variant="outline"><Link href="/">Return home</Link></Button>}>Check the link with the person who shared it.</StateSheet>;
}
