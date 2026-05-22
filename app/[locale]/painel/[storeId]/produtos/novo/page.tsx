import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string; storeId: string }> };

export default async function NewProductRedirect({ params }: Props) {
  const { locale, storeId } = await params;
  redirect(`/${locale}/painel/${storeId}/produtos`);
}
