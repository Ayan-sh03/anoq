import { requireWorkspace } from "@/lib/auth/workspace";
import AIBuilder from "@/components/AIBuilder";

export default async function CreateAIPage() {
  const user = await requireWorkspace("/create/ai");
  return <AIBuilder key={user.id} userId={user.id} />;
}
