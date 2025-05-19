import { NextResponse } from "next/server";
import rateLimit from "../../(helper)/ratelimit.js";
import createClient from "edgedb";
import { GetFormAIDescription, GetFormAIPH } from "./ai_util";

export async function POST(req: Request, res: Response) {
  const { productHuntLink, description, author } = await req.json();

  console.log('====================================');
  console.log(JSON.stringify({ productHuntLink, description, author }, null, 2));
  console.log('====================================');

  if (await rateLimit(req, res)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  const client = createClient();
  if (!productHuntLink && !description) {
    return NextResponse.json(
      { error: "Either Product Hunt link or Description is required" },
      { status: 400 }
    );
  }
  try {
    let form;
    if (description) {
      // Generate form based on the description
      form = await GetFormAIDescription(description);
    } else {
      // Generate form based on the Product Hunt link
      form = await GetFormAIPH(productHuntLink);
    }

    const body = {
      title: form.title,
      description: form.description,
      author: author,
      questions: form.questions,
      choiceQuestions: form.multiplechoicequestions
    }

    console.log('====================================');
    console.log(JSON.stringify(body, null, 2));
    console.log('====================================');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/form`, {
      method: "POST",
      body: JSON.stringify(body),
    })

    const { slug } = await res.json();
    return NextResponse.json(
      { message: "Form Generated Successfully", "slug": slug },
      { status: 200 }
    );



  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
