import { redirect } from 'next/navigation'
import {auth, ssoEndSessionUrl, signOut} from "@/auth";
import {NextRequest} from "next/server";

const POST_LOGOUT_STATE = 'post_logout_callback'

export async function GET(request: NextRequest) {
    if (request.nextUrl.searchParams.get('state') === POST_LOGOUT_STATE) {
        // this is the callback initiated by the sso
        return await signOut({ redirectTo: '/' })
    }

    const session = await auth()
    if (!session?.user) {
        // no user, just redirect to login
        return redirect('/')
    }

    const endSessionUrl = await ssoEndSessionUrl()
    if (!endSessionUrl) {
        // no (easy) way to end the session on the sso
        return await signOut({ redirectTo: '/' })
    } else {
        // sign out of the sso first via https://identityserver4.readthedocs.io/en/latest/endpoints/endsession.html
        const params = new URLSearchParams()
        if ('id_token' in session) {
            params.set("id_token_hint", session.id_token as string)
        }

        // redirect back here
        params.set('post_logout_redirect_uri', request.url)
        params.set('state', POST_LOGOUT_STATE)

        redirect(`${endSessionUrl}?${params}`)
    }
}