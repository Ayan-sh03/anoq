import { notFound } from "next/navigation";
import { Update } from "@/components/FormUpdate";
import { requireWorkspace } from "@/lib/auth/workspace";
import { getForm } from "@/lib/form-data";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireWorkspace(`/update/${slug}`);
  const form = await getForm(slug);
  if (form.author_id !== user.id) notFound();
  return <Update data={form} slug={form.slug} />;
}
