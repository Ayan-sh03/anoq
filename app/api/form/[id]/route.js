import createClient from "edgedb";
import { NextResponse } from "next/server";
export async function GET(req, { params }) {
  const slug = params.id;

  if (!slug) {
    // Handle the case where form_id is not provided
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const client = createClient();
  

  try {
    const res = await client.query(
      `
    SELECT Form {
      id,
      title,
      description,
      question: {
        question_text,
              },
      choiceQuestion:{
        question_text,
        choices
      }

    } FILTER .slug = <str>$slug;
  `,
      { slug }
    );

    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

