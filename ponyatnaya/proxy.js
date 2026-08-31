import { NextResponse } from "next/server"

/**
 * Next.js 16 request proxy.
 *
 * The application performs authentication inside its API routes and does not
 * need to rewrite or redirect page requests. Keeping an explicit no-op proxy
 * also makes the project safe if a stale proxy.js file is present locally.
 */
function proxy(request) {
  return NextResponse.next()
}

export { proxy }
export default proxy

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
