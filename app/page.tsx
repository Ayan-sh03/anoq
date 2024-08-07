import { Button } from "@/components/ui/button";
import { LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { isAuthenticated } = getKindeServerSession();
  const authenticated = await isAuthenticated();
  

  return (
    <div className="container mx-auto p-4 h-screen w-full text-grey-600 bg-transparent z-10 ">
      <nav className="flex w-full items-center border-none">
        <span className="font-bold mr-auto text-black">
          <Link href={"/"}>Anoq</Link>
        </span>

        {authenticated ? (
          <LogoutLink postLogoutRedirectURL="/" className="mr-3">
            <Button>Log Out</Button>
          </LogoutLink>
        ) : (
          <LoginLink postLoginRedirectURL="/" className="mr-3">
            <Button>Join Now</Button>
          </LoginLink>
        )}

        <Button><Link href={"/dashboard"}>Dashbaord</Link></Button>
      </nav>

      <main className=" h-full ">
        <section className="w-full py-12 md:py-24 m-auto lg:py-32 ">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16 w-full">
            <div className=" max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 w-full  md:gap-16 text-center">
              <div className="w-full flex flex-col gap-5 md:gap-3">
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Empower your Products with anonymous feedback
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Anoq is an anonymous feedback and query platform that helps
                  User communicate openly and improve continuously.
                </p>
                <div className="mt-6 space-x-4">
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                    href="/create"
                  >
                    Get Started
                  </Link>
                  <Link
                    className="inline-flex h-9 mt-3 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                    href="/create/ai"
                  >
                    <span className="mr-2">Get Started with AI</span> <Sparkles className="size-5" />
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

