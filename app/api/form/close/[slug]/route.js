import rateLimit from "@/app/api/(helper)/ratelimit";
import createClient from "edgedb";
import { NextResponse } from "next/server";

export async function PATCH(req, { params },res) {
  if (await rateLimit(req, res)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  const slug = params.slug;
  const client = createClient();

 await client.execute(
    `update Form
    filter .slug = <str>$slug
    set {
      status := "closed"
    };
    `,
    { slug }
  );


  return NextResponse.json({ message: "Form closed successfully" }, { status: 200 });
}
