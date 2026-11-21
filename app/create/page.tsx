import { ManualForm } from "@/components/FormUpdate";
import { requireWorkspace } from "@/lib/auth/workspace";

export default async function CreatePage() {
  const user = await requireWorkspace("/create");
  return <ManualForm key={user.id} owner={user.id} />;
}
