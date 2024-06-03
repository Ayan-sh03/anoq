import createClient from "edgedb";
import { NextResponse } from "next/server";

export async function GET(req) {

  const email = req.headers.get("X-User-Email");
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const client = createClient();

  const forms = await client.query(
    `
    select Form {
        title,
        description,
        slug,
        status
    }
    filter .author.email = <str>$email
    `,
    { email }
  );

  return NextResponse.json({ data: forms });
}
