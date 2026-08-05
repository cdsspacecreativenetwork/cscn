import Link from "next/link";
import { getPublishedMarketplaceResources } from "@/data/marketplace-resources";
import PublicResourcesClient from "./PublicResourcesClient";

export const metadata = { title: "Resources | CSCN Learning Platform" };
export default async function ResourcesPage() {
  const resources = await getPublishedMarketplaceResources();

  return (
    <main className="mx-auto min-h-screen max-w-[83rem] px-4 pb-16 pt-32 font-jakarta">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-semibold text-text-title leading-10 lg:pt-10">
            Resources
          </h1>
        </div>
      </div>
      
      <PublicResourcesClient resources={resources} />
    </main>
  );
}
