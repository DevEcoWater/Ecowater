import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LECTOR_ALLOWED = ["/dashboard/mapa", "/dashboard/zonas"];

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
  });

  if (!token) return NextResponse.next();

  const role = token.role as string;
  const pathname = req.nextUrl.pathname;

  if (role === "lector") {
    const isAllowed = LECTOR_ALLOWED.some((path) =>
      pathname.startsWith(path)
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard/mapa", req.url));
    }
  }

  if (role === "operario") {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*"],
};
