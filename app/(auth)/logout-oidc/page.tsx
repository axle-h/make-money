import {redirect} from "next/navigation";
import {ssoEndSessionUrl} from "@/auth";

/**
 * End sso session if configured.
 */
export default async function LogoutPage({ searchParams }: { searchParams: { id_token_hint?: string } }) {
    const params = new URLSearchParams()
    const postLogoutRedirectUri = publicUrlFromEnv()
    if (postLogoutRedirectUri) {
        params.set('post_logout_redirect_uri', postLogoutRedirectUri)
    }
    if (searchParams.id_token_hint) {
        params.set('id_token_hint', searchParams.id_token_hint)
    }
    return redirect(`${ssoEndSessionUrl()}?${params}`)
}

function publicUrlFromEnv(): string | null {
    let publicUrl = process.env.NEXTAUTH_URL
    if (!publicUrl) return null
    if (publicUrl.charAt(publicUrl.length - 1) === '/') {
        return publicUrl
    } else {
        return publicUrl + '/'
    }
}