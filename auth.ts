import NextAuth, {NextAuthConfig, Session} from "next-auth"
import type {OAuthConfig} from "next-auth/providers";
import {
    userInfoRequest,
    processUserInfoResponse,
    discoveryRequest,
    processDiscoveryResponse,
    AuthorizationServer
} from 'oauth4webapi'

interface Profile {
    email: string
    id: string
    name: string
}

function ssoConfig() {
    const issuer = process.env.SSO_ISSUER
    const clientId = process.env.SSO_CLIENT_ID
    const clientSecret = process.env.SSO_CLIENT_SECRET

    if (!issuer || !clientId || !clientSecret) {
        throw new Error('SSO_ISSUER, SSO_CLIENT_ID and SSO_CLIENT_SECRET are required')
    }

    return { issuer, clientId, clientSecret }
}
const SSO_CONFIG = ssoConfig()

function AxhSso(): OAuthConfig<Profile> {
    return {
        id: "axh-sso",
        name: "AxhSso",
        type: "oidc",
        authorization: {
            params: {
                scope: 'openid email profile roles'
            }
        },
        profile(profile) {
            return profile
        },
        ...SSO_CONFIG
    }
}

let server: AuthorizationServer | null = null

export async function discover(): Promise<AuthorizationServer> {
    if (server) {
        return server
    }

    const issuerUrl = new URL(SSO_CONFIG.issuer)
    const response = await discoveryRequest(issuerUrl, {})
    server = await processDiscoveryResponse(issuerUrl, response)
    return server
}
discover().catch(e => console.error(e))

export async function ssoEndSessionUrl(): Promise<string | null> {
    const server = await discover()
    return server.end_session_endpoint || null
}

async function getUserInfo(subject: string, accessToken: string) {
    const server = await discover()
    const client = { client_id: SSO_CONFIG.clientId, client_secret: SSO_CONFIG.clientSecret }
    const response = await userInfoRequest(server, client, accessToken)
    return await processUserInfoResponse(server, client, subject, response)
}

export function isAuthorized(session: Session | null): boolean {
    if (!session?.user) {
        return false
    }

    if (!('role' in session.user)) {
        return false
    }

    const roles = session.user.role as string[]
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
        authorized: async ({ auth: session }) => isAuthorized(session),
        session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    given_name: token.given_name,
                    family_name: token.family_name,
                    role: token.role
                },
                id_token: token.id_token
            }
        },
        async jwt({ token, trigger, session, account, user, profile }) {
            if (trigger === 'signIn') {
                // No userinfo on oidc flows for some reason... have to get it ourselves here
                if (!profile?.sub) {
                    throw new Error('no sub claim in token')
                }
                if (!account?.access_token) {
                    throw new Error('no access token')
                }
                const userInfo = await getUserInfo(profile.sub, account.access_token)
                return { ...token, ...userInfo, id_token: account.id_token }
            }
            return token
        },
    },
}

export const APP_ROLE = process.env['APP_ROLE'] || 'make-money'
export const { handlers, signIn, signOut, auth } = NextAuth(config)