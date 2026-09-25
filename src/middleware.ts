import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("qa_session");
  const isLogin = request.nextUrl.pathname === "/login";
  const expired = request.nextUrl.searchParams.get("expired") === "1";

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLogin && expired) {
    const response = NextResponse.next();
    response.cookies.delete("qa_session");
    return response;
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|lottie)$).*)"],
};
