import { NextResponse } from "next/server";
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import createClient from "edgedb";
import { syncUserToDatabase } from "@/lib/user";

// The Kinde issuer URL should already be in your `.env` file
// from when you initially set up Kinde. This will fetch your
// public JSON web keys file
const client = jwksClient({
  jwksUri: `${process.env.KINDE_ISSUER_URL}/.well-known/jwks.json`,
});
export async function POST(req){
    try {
        // Get the token from the request
        const token = await req.text();
    
        // Decode the token
        const { header } = jwt.decode(token, { complete: true });
        const { kid } = header;
        const clientEdedb = createClient()
    
        // Verify the token
        const key = await client.getSigningKey(kid);
        const signingKey = key.getPublicKey();
        const event =  jwt.verify(token, signingKey);
    
        // Handle various events
        switch (event?.type) {
          case "user.updated":
            // handle user updated event
            // e.g update database with event.data
            console.log(event.data);
            break;
          case "user.created":
            
            console.log(event.data);
            const user = {
                email : event.data.user.email,
                given_name: event.data.user.first_name,
                family_name: event.data.user.last_name
            }
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(user),
            })

            break;
          default:
            
            break;
        }
    
      } catch (err) {
        if (err instanceof Error) {
          console.error(err.message);
          return NextResponse.json({ message: err.message }, { status: 400 });
        }
      }
      return NextResponse.json({ status: 200, statusText: "success" });
}