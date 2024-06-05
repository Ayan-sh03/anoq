import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/dbschema/interfaces";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page() {
  const { getUser, isAuthenticated } = getKindeServerSession();

  const user = await getUser();
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login?postLoginRedirectUrl=/dashboard");
  }

 const forms = await fetch(`http://localhost:3000/api/dashboard`, {
  method: "GET",
  headers: {
    "X-User-Email": user && user.email ? user.email : "",
  },
  cache: "no-store",
});


  const { data } = await forms.json();

  return <Dashboard data={data} />;
}

function Dashboard({ data }: { data: Form[] }) {
  return (
    <div className="flex flex-col w-full min-h-screen container">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] bg-gray-100/40 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 dark:bg-gray-800/40">
        <div className="max-w-6xl w-full mx-auto flex items-center gap-4">
          <form className="flex-1">
            <Input
              placeholder="Search forms..."
              className="bg-white dark:bg-gray-950"
            />
            <Button type="submit" className="sr-only">
              Submit
            </Button>
          </form>
          <Link href="/create"><Button>Create New</Button></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl w-full mx-auto" >
          {data.map((form, index) => {
            return (
              <FormCard
                key={index}
                title={form.title}
                description={form.description}
                slug={form.slug}
                status={form.status}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
