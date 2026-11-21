import AlreadySubmitted from "@/components/AlreadySubmitted";
import Closed from "@/components/Closed";
import FormComponent from "@/components/FormComponent";
import Navbar from "@/components/Navbar";
import { getForm } from "@/lib/form-data";
import { apiGet } from "@/lib/server-api";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (form.status === "closed") return <Closed />;

  const response = await apiGet(`/api/forms/${encodeURIComponent(form.slug)}/submitted`);
  if (!response.ok) throw new Error("Couldn’t check the status of this form.");
  const status: { submitted: boolean } = await response.json();
  if (status.submitted) return <AlreadySubmitted />;

  return <><Navbar /><FormComponent form={form} /></>;
}
