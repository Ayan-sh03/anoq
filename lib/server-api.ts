import { cookies, headers } from "next/headers";

// Use platform-provided domains when forwarding a user's cookies to a Vercel Function.
export async function apiGet(path: `/api/${string}`) {
  const incomingHost = (await headers()).get("host");
  const deploymentHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  const sameHost = deploymentHosts.find(host => host && host === incomingHost);
  const deploymentHost = sameHost || (process.env.VERCEL_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    : process.env.VERCEL_URL);
  const origin = process.env.GO_API_ORIGIN || (deploymentHost
    ? `https://${deploymentHost}`
    : "http://127.0.0.1:8000");

  const cookieNames = new Set(["access_token"]);
  const receipt = /^\/api\/forms\/([\w-]+)\/submitted$/.exec(path);
  if (receipt) cookieNames.add(`anoq_receipt_${receipt[1]}`);
  const requestHeaders = new Headers({ Accept: "application/json" });
  if (deploymentHost && !process.env.GO_API_ORIGIN) {
    if (sameHost) {
      cookieNames.add("_vercel_jwt");
      cookieNames.add("_vercel_protection_bypass");
    }
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
      requestHeaders.set("x-vercel-protection-bypass", process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
    }
  }

  const jar = await cookies();
  const forwarded = jar.getAll().filter(cookie => cookieNames.has(cookie.name));
  if (forwarded.length) {
    requestHeaders.set("Cookie", forwarded.map(cookie => `${cookie.name}=${encodeURIComponent(cookie.value)}`).join("; "));
  }
  return fetch(new URL(path, origin), {
    headers: requestHeaders, cache: "no-store", redirect: "error",
  });
}
