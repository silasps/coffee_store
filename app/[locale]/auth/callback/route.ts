import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type CallbackContext = {
  params: Promise<{ locale: string }>;
};

function getSafeNextPath(nextPath: string | null, locale: string) {
  const fallback = `/${locale}/painel`;

  if (!nextPath) return fallback;
  if (!nextPath.startsWith(`/${locale}/`) || nextPath.startsWith("//")) return fallback;

  return nextPath;
}

function redirectToAccess(request: NextRequest, locale: string, auth: string) {
  const redirectUrl = new URL(`/${locale}/acesso`, request.url);
  redirectUrl.searchParams.set("auth", auth);
  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest, { params }: CallbackContext) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");

  if (authError) {
    return redirectToAccess(request, locale, "try-login");
  }

  if (!code) {
    return redirectToAccess(request, locale, "try-login");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToAccess(request, locale, "try-login");
  }

  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"), locale);
  return NextResponse.redirect(new URL(nextPath, request.url));
}
