import Link from "next/link";
import StateSheet from "./StateSheet";
import { Button } from "./ui/button";

export default function AlreadySubmitted() {
  return <StateSheet label="Response received" title="Your note is in." actions={<Button asChild variant="outline"><Link href="/">Return home</Link></Button>}>You’ve already sent a response to this form. Thanks for sharing your thoughts.</StateSheet>;
}
