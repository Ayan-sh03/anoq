import { Button } from "@/components/ui/button";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { Client, createClient } from "edgedb";
import Link from "next/link";


export default async function Home() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const user = await getUser();
  const authenticated = await isAuthenticated();
  const client = createClient();
  
  if (authenticated) {
    const existingUser = await checkUserExists(client , user?.email as string);

    if (!existingUser) {
      await syncUserToDatabase(client , user);
    }
  }

  return (
    <div className="container mx-auto p-4 h-screen w-full text-grey-600">
      <nav className="flex w-full items-center border-none">
        <span className="font-bold mr-auto text-black">
          <Link href={"/"}>Anoq</Link>
        </span>

        {authenticated ? (
          <LogoutLink  postLogoutRedirectURL="/" className="mr-3">
            <Button>Log Out</Button>
          </LogoutLink>
        ) : (
          <LoginLink postLoginRedirectURL="/" className="mr-3">
            <Button>Join Now</Button>
          </LoginLink>
        )}
      </nav>

      <main className=" h-full ">
        <section className="w-full py-12 md:py-24 m-auto lg:py-32 border-y">
            <div className="container px-4 md:px-6 space-y-10 xl:space-y-16 w-full">
              <div className=" max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 w-full  md:gap-16 text-center">
                <div className="w-full flex flex-col gap-5 md:gap-3">
                  <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                    Empower your Products with anonymous feedback
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                    Anoq is an anonymous feedback and query platform that helps User communicate openly and improve
                    continuously.
                  </p>
                  <div className="mt-6 space-x-4">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                      href="/create"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
      </main>
    </div>
  );
}


export async function checkUserExists(client : Client , email: string) {
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

export async function syncUserToDatabase(client : Client, user: KindeUser | null) {
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
