import type { Metadata } from "next";
import { ShopContent } from "./ShopContent";

export const metadata: Metadata = {
  title: "Browse Products",
  description:
    "Discover unique Indian artisan products. Textiles, home décor, jewellery and more — wholesale prices direct from India.",
};

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  return <ShopContent initialFilters={params} />;
}