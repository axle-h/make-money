export { auth as middleware } from "@/auth"

export const config = {
    /*
     * Match all request paths except for the ones starting with:
     * - /login
     * - /auth/* (auth-js pages)
     * - /api/auth (auth-js api)
     * - /_next (next static files & image optimization)
     * - /favicon.ico (favicon file)
     */
    matcher: '/((?!error|assets/|login|auth/|api/auth|_next/|favicon.ico).*)',
}