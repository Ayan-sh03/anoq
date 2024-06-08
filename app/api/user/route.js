import createClient from "edgedb";
import { NextResponse } from "next/server";

export async function POST(req){
    //sync user to database
    const {email,given_name,family_name} = await req.json()

    console.log('====================================');
    console.log(JSON.stringify({email,given_name,family_name}, null, 2));
    console.log('====================================');
    
    const client = createClient()
    

    const res = await client.query(
        `
        INSERT User {
          email := <str>$email,
          given_name := <str>$given_name,
          family_name := <str>$family_name
        }
        `,
        {
          email:email,
          given_name:given_name,
          family_name:family_name,
        }
      );

    console.log(res)    

    return NextResponse.json({message:"user synced to database"})

}