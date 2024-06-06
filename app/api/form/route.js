import { NextResponse } from "next/server";
import { createClient } from 'edgedb'
import e from '@/dbschema/edgeql-js'

import { nanoid } from "nanoid";

import rateLimit from "../(helper)/ratelimit"
function generateSlug() {
  return nanoid(6); // Generate a 6-character ID
}


export  async function POST(req,res ){
  

  if (await rateLimit(req, res)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }



    const {author:userEmail ,title,description,questions,choiceQuestions} = await req.json()


  const slug  =  generateSlug()

    const client = createClient()

    const query = e.params({ items: e.json, title: e.str, description: e.str,choiceItems:e.json ,slug:e.str,userEmail:e.str }, (params) => {
        const choiceQuestions = e.for(e.json_array_unpack(params.choiceItems), (item) => {
          return e.insert(e.MultipleChoiceQuestion, {
            question_text:e.cast(e.str, item['question_text']),
            choices: e.array_unpack(e.cast(e.array(e.json), item['choices'])),   
          });
        });
        const questions = e.for(e.json_array_unpack(params.items), (item) => {
          return e.insert(e.Question, {
            question_text:e.cast(e.str, item['question_text']),
          });
        });

        const author = e.select(e.User, user => ({
          filter_single: {email: userEmail}
        }))
      
        return e.with(
          [questions,choiceQuestions,author],
          e.insert(e.Form, {
            title: params.title,
            author: author,
            description: params.description,
            question: questions,
            choiceQuestion:choiceQuestions,
            slug : slug
          })
        );
      });
      
      await query.run(client, {
        items: questions,
        choiceItems:choiceQuestions,
        title,
        description,
        slug,
        userEmail 
      });
      

    const message = "Form created successfully"



    return NextResponse.json({"message":message, "slug":slug} )
}


