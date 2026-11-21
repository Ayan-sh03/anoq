import { notFound } from "next/navigation";
import { apiGet } from "./server-api";
import type { FeedbackForm } from "./forms";

export async function getForm(slug: string): Promise<FeedbackForm> {
  const response = await apiGet(`/api/forms/${encodeURIComponent(slug)}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Couldn’t load this form.");
  return response.json();
}
