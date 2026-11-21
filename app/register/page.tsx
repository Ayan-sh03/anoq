import AccountScreen from "@/components/AccountScreen";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AccountScreen mode="register" destination={typeof next === "string" ? next : undefined} />;
}
