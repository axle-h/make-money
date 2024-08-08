import NextAuth, {NextAuthConfig, User} from "next-auth"
import type {OIDCConfig} from "next-auth/providers";

function issuer() {
    return process.env.AUTH_AXH_SSO_ISSUER
}

function AxhSso(): OIDCConfig<{ sub: string }> {
    return {
        id: "axh-sso",
        name: "AxhSso",
        type: "oidc",
        authorization: {
            params: {
                scope: 'openid email profile roles'
            }
        },
        async profile(profile, tokens) {
            const userInfo = await getUserInfo(profile.sub, tokens.access_token || '')
            return { ...userInfo, id_token: tokens.id_token }
        },
        clientId: process.env.AUTH_AXH_SSO_ID,
        clientSecret: process.env.AUTH_AXH_SSO_SECRET,
        issuer: issuer()
    }
}

export function ssoEndSessionUrl(): string | null {
    return issuer() + 'connect/endsession'
}

async function getUserInfo(subject: string, accessToken: string) {
    const response = await fetch(issuer() + 'connect/userinfo', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    })
    const userInfo = await response.json()
    if (userInfo.sub !== subject) {
        return null
    }
    return userInfo
}

const APP_ROLE = process.env['APP_ROLE'] || 'make-money'
export function isAuthorized(user: User): boolean {
    if (!('role' in user)) {
        return false
    }

    const roles = user.role as string[]
    return roles.includes(APP_ROLE)
}

export const config: NextAuthConfig = {
    session: { strategy: 'jwt' },
    providers: [AxhSso],
    pages: {
        signIn: "/login",
        error: '/error'
    },
    callbacks: {
        authorized({ auth: session }) {
            if (!session?.user) {
                return false
            }
            return isAuthorized(session.user)
        },
        session({ session, token }){
            return { ...session, user: { ...session.user, ...token } }
        },
        jwt({ token, user }){
            return { ...token, ...user }
        },
    },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)