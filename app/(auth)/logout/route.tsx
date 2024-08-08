import { redirect } from 'next/navigation'
import {auth, ssoEndSessionUrl, signOut} from "@/auth";

export const dynamic = 'force-dynamic'

/**
 * log out the user and
 *   a. if we can get an ssoEndSessionUrl then redirect back to /logout-oidc?id_token_hint={id_token}
 *   b. otherwise redirect home
 */
export async function GET() {
    const session = await auth()

    if (!session?.user) {
        // already logged out
        return redirect('/')
    }

    const endSessionUrl = await ssoEndSessionUrl()
    let redirectTo
    if (endSessionUrl) {
        // a. also redirect back here to initiate sso logout
        const params = new URLSearchParams()
        if ('id_token' in session) {
            params.set('id_token_hint', session.id_token as string)
        }
        redirectTo = '/logout-oidc?' + params
    } else {
        // b. probably no sso session
        redirectTo = '/'
    }
    return await signOut({ redirectTo })
}
