import { requireWorkspace } from "@/lib/auth/workspace";
import AIBuilder from "@/components/AIBuilder";

export default async function CreateAIPage() {
  await requireWorkspace("/create/ai");
  return <AIBuilder />;
}
