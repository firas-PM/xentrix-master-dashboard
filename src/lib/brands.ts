import { notFound } from "next/navigation";
import { connectDb } from "@/lib/mongoose";
import { Brand } from "@/models";

export async function getBrandBySlug(slug: string) {
  await connectDb();
  const brand = await Brand.findOne({ slug }).lean();
  if (!brand) notFound();
  return brand;
}
