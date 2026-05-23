import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATTERNS = [
  /^\/[a-z]{2}\/painel/,
  /^\/[a-z]{2}\/vendedor/,
  /^\/[a-z]{2}\/admin/,
];

const AUTH_CALLBACK_BYPASS = /^\/[a-z]{2}\/auth\/callback/;

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let Supabase auth callback pass through without i18n processing
  if (AUTH_CALLBACK_BYPASS.test(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATTERNS.some((p) => p.test(pathname));

  if (isProtected) {
    const token =
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`)?.value;

    if (!token) {
      const locale = pathname.split("/")[1] || "pt";
      return NextResponse.redirect(
        new URL(`/${locale}/acesso?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|apple-icon|icon|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
