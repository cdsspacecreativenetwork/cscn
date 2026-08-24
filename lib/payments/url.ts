import { headers } from "next/headers";

export async function getAppBaseUrl() {
  const headerList = await headers();
  const host = headerList.get("host");

  // Local previews may run beside another app on port 3000. Keep callbacks on
  // the origin that received the request instead of crossing dev servers.
  if (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
    return `http://${host}`;
  }

  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (configured) return configured.replace(/\/$/, "");

  const fallbackHost = host ?? "localhost:3001";
  const protocol = fallbackHost.includes("localhost") || fallbackHost.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${fallbackHost}`;
}
