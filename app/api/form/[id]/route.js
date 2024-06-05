import createClient from "edgedb";
import { NextResponse } from "next/server";
import e from "@/dbschema/edgeql-js";
import rateLimit from "../../(helper)/ratelimit";
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
      status,
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

export async function PATCH(req, { params }, res) {
  if (await rateLimit(req, res)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  const slug = params.id;

  console.log('====================================');
  console.log(params);
  console.log('====================================');

  const { title, description, questions, choiceQuestions } = await req.json();

  console.log('====================================');
  console.log(JSON.stringify({ title, description, questions, choiceQuestions,slug }, null, 2));
  console.log('====================================');

  const client = createClient();
  try {
   await client.execute(
      `
      WITH
      questions := (
          FOR item IN json_array_unpack(<json>$items)
          UNION (
            INSERT Question {
              question_text := <str>item['question_text'],
            }
          )
      ),
        choiceQuestions := (
          FOR item IN  json_array_unpack(<json>$choiceItems)
    
          UNION (
            INSERT MultipleChoiceQuestion {
              question_text := <str>item['question_text'],
              choices := (<str>json_array_unpack(item['choices']))
    
            }
          )
      ),
      UPDATE Form
      filter .slug=<str>$slug
      SET {
        title := <str>$title,
        description := <str>$description,
        question := questions,
        choiceQuestion := choiceQuestions
    };
      `,
      {
        slug,
        title,
        description,
        items: questions,
        choiceItems: choiceQuestions,
      }
    );
    
  } catch (error) {
    console.log(error);
    console.table(error);
  }
  return NextResponse.json(
    { message: "Form updated successfully" },
    { status: 200 }
  );
}

export async function DELETE(_, { params }) {
  const slug = params.id;
  const client = createClient();
  await client.execute(
      `
      delete Form
      filter .slug = <str>$slug
      `,
      { slug }
  );
  return NextResponse.json({ message: "Form deleted successfully" }, { status: 200 });
}