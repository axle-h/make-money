import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'

export const dynamic = 'force-dynamic'

/**
 * log out the user and redirect to /logout-oidc to end the sso session
 */
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    // already logged out
    return redirect('/')
  }

  return await signOut({ redirectTo: '/logout-oidc' })
}
