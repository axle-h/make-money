import { redirect } from 'next/navigation'
import {auth, signOut} from "@/auth";

export const dynamic = 'force-dynamic'

/**
 * log out the user and redirect to /logout-oidc?id_token_hint={id_token}
 */
export async function GET() {
    const session = await auth()

    if (!session?.user) {
        // already logged out
        return redirect('/')
    }

    const params = new URLSearchParams()
    if ('id_token' in session.user) {
        params.set('id_token_hint', session.user.id_token as string)
    }
    return await signOut({ redirectTo: '/logout-oidc?' + params })
}
