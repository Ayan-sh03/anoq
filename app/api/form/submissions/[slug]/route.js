import createClient from "edgedb";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {

    const id = params.slug;

    const client = createClient();

    try {
        const res = await client.query(
            `select Filled_Form {
                name,
                email,
                question: {
                    question_text,
                    answer
                },
                choiceQuestion: {
                    question_text,
                    choices,
                    selectedChoice
                },

            }
            filter .form.slug = <str>$id` , {id})
        
        if(res.length === 0){
            return NextResponse.json({"message" : "No Submissions"} , {status : 404})
        }


        return NextResponse.json({"data" : res} , {status : 200})
    }

    catch (error) {

        console.log(error.name);

        return NextResponse.json({"message" : error.name} , {status : 500})
    }

}