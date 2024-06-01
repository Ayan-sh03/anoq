import {createClient} from "edgedb";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const formId = params.id;

  const userIp =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for") ||
    req.connection.remoteAddress;
  const client = createClient();

  const res = await client.query(
    `
    select Filled_Form
filter .form.id = <uuid>$formId and .userIp = <str>$userIp
    
    `,
    { formId , userIp}
  );

  if(res.length > 0){
    return NextResponse.json({"message" :"Already Submitted"},{status:409});
  }

  return NextResponse.json({"message" : "Not Submitted"} , {status : 200});

}
