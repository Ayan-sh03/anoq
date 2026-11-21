import { Update } from "@/components/FormUpdate";
import { requireWorkspace } from "@/lib/auth/workspace";

export default async function CreatePage() {
  await requireWorkspace("/create");
  return <Update />;
}
