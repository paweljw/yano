import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname === "/" || 
                     req.nextUrl.pathname.startsWith("/api/auth");
  
  // Protect app routes
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};