import e, { createClient } from "@/dbschema/edgeql-js";
import rateLimit from "../(helper)/ratelimit"
import {  NextResponse } from "next/server";

async function insertFilledForm(client, slug, questions, choiceQuestions,userIp,name,email) {



const query = e.params({ items: e.json, choiceItems:e.json ,slug:e.str , userIp:e.str ,name:e.str ,email:e.str}, (params) => {
  const choiceQuestions = e.for(e.json_array_unpack(params.choiceItems), (item) => {
    return e.insert(e.MultipleChoiceQuestion, {
      question_text:e.cast(e.str, item['question_text']),
      choices: e.array_unpack(e.cast(e.array(e.str), item['choices'])),   
      selectedChoice:e.cast(e.str , item['selectedChoice'])
    });
  });
  const questions = e.for(e.json_array_unpack(params.items), (item) => {
    return e.insert(e.Question, {
      question_text:e.cast(e.str, item['question_text']),
      answer : e.cast(e.str,item['answer'])
    });
  });
  const form = e.select(e.Form, form => ({
    filter: e.op(form.slug, "=", slug)
  }));

  return e.with(
    [questions,choiceQuestions],
    e.insert(e.Filled_Form, {
      question: (questions),
      choiceQuestion:(choiceQuestions),
      form: form,
      userIp:(userIp),
      name:(name),
      email:(email)
    })
  );
});

  const result = await query.run(client , {
    items:questions,
    choiceItems:choiceQuestions,
    slug,
    userIp,
    name,
    email
  });


  
  return result;
}

export async function POST(req,res) {

  if (await rateLimit(req, res)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const {name,email, slug, question, choiceQuestion } = await req.json();
  const client = createClient();
  const userIP = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || req.connection.remoteAddress;

  try {
    await insertFilledForm(client, slug, question, choiceQuestion,userIP,name,email);

    return NextResponse.json(
      { message: "Form Submitted Successfully" },
      { status: 201 }
    );
  } catch (error) {

    console.log(error.name);



    if(error.name === 'ConstraintViolationError'){
      return NextResponse.json(
        { message: "It looks like you've already submitted. Please try again later. " },
        { status: 409 }
      );

    }
    return NextResponse.json(
      { message: "Something went wrong while submitting your response " },
      { status: 500 }
    );
  }
}
