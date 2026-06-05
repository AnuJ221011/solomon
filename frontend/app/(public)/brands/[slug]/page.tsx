import type { Metadata } from "next";
import { BrandStorefront } from "./BrandStorefront";

interface Props { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-\d+$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title: name };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  return <BrandStorefront slug={slug} />;
}
