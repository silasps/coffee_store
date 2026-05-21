import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutClient } from "@/components/cart/checkout-client";

type Props = {
  params: Promise<{ locale: string; storeSlug: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { locale, storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug, isActive: true },
    select: { id: true, slug: true, namePt: true, nameEn: true, logoUrl: true },
  });

  if (!store) notFound();

  return <CheckoutClient store={store} locale={locale} />;
}
