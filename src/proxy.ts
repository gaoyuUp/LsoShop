import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth/session";
import { AFFILIATE_COOKIE, verifyAffiliateSession } from "@/lib/auth/affiliate";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 推广链接：先写入归因 cookie，页面与下单接口都会再次校验代理有效性
  if (pathname.startsWith("/r/")) {
    const parts = pathname.split("/").filter(Boolean);
    const code = (parts[1] ?? "").slice(0, 16).toUpperCase();
    if (code) {
      const priceCode = (request.nextUrl.searchParams.get("pc") ?? "").slice(0, 16).toUpperCase();
      const src = (request.nextUrl.searchParams.get("src") ?? "").replace(/:/g, "-").slice(0, 40);
      const response = NextResponse.next();
      response.cookies.set("lso_aff", [code, priceCode, src].join(":"), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86_400,
      });
      return response;
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname === "/promote" || pathname.startsWith("/promote/")) {
    const affiliate = await verifyAffiliateSession(request.cookies.get(AFFILIATE_COOKIE)?.value);
    if (!affiliate) {
      const url = request.nextUrl.clone();
      url.pathname = "/join";
      url.search = "?login=1&next=/promote";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const session = await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/promote", "/promote/:path*", "/r/:path*"],
};
