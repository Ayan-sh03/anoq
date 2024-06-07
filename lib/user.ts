import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { Client } from "edgedb";

export async function checkUserExists(client: Client, email: string) {
    try {
      const user = await client.query(
        `
        SELECT User {
          id
        }
        FILTER .email = <str>$email
        `,
        { email }
      );
  
      return user[0] || null;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return null;
    }
  }
  
  export async function syncUserToDatabase(
    client: Client,
    user: KindeUser | null
  ) {
    try {
      await client.query(
        `
        INSERT User {
          email := <str>$email,
          given_name := <str>$given_name,
          family_name := <str>$family_name
        }
        `,
        {
          email: user?.email,
          given_name: user?.given_name,
          family_name: user?.family_name,
        }
      );
  
      console.log("User synced to database successfully");
    } catch (error) {
      console.error("Error syncing user to database:", error);
    }
  }
  