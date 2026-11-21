import Closed from "@/components/Closed";
import EventDisplay from "@/components/EventDisplay";
import Navbar from "@/components/Navbar";
import { getForm } from "@/lib/form-data";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await getForm(slug);
  if (form.status === "closed") return <Closed />;
  return <>
    <Navbar section="Event display" />
    <EventDisplay title={form.title} slug={form.slug} />
  </>;
}
