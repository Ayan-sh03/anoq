import AccountScreen from "@/components/AccountScreen";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AccountScreen mode="login" destination={typeof next === "string" ? next : undefined} />;
}
