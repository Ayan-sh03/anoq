import Link from "next/link";
import StateSheet from "./StateSheet";
import { Button } from "./ui/button";

export default function Closed() {
  return <StateSheet label="Collection closed" title="This box is closed." actions={<Button asChild variant="outline"><Link href="/">Return home</Link></Button>}>The form owner has stopped collecting responses.</StateSheet>;
}
