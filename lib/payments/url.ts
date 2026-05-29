import { headers } from "next/headers";

export async function getAppBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
