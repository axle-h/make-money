import NextAuth, {NextAuthConfig, User} from "next-auth"
import DuendeIdentityServer6 from "next-auth/providers"
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
    return {
        issuer: process.env.AUTH_AXH_SSO_ISSUER || undefined,
        client_id: process.env.AUTH_AXH_SSO_ID || undefined,
        client_secret: process.env.AUTH_AXH_SSO_SECRET || undefined
    }
}

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
        ...ssoConfig()
    }
}

let server: AuthorizationServer | null = null

export async function discover(): Promise<AuthorizationServer> {
    if (server) {
        return server
    }

    const { issuer } = ssoConfig()
    if (!issuer) {
        throw new Error('issuer is required for discovery')
    }

    console.log(`discovery issuer=${issuer}`)
    const issuerUrl = new URL(issuer)
    const response = await discoveryRequest(issuerUrl, {})
    server = await processDiscoveryResponse(issuerUrl, response)
    return server
}

export async function ssoEndSessionUrl(): Promise<string | null> {
    const server = await discover()
    return server.end_session_endpoint || null
}

async function getUserInfo(subject: string, accessToken: string) {
    const server = await discover()
    const { client_id, client_secret } = ssoConfig()
    if (!client_id || !client_secret) {
        throw new Error('issuer is required for discovery')
    }
    const client = { client_id, client_secret }
    const response = await userInfoRequest(server, client, accessToken)
    return await processUserInfoResponse(server, client, subject, response)
}

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
        authorized: async ({ auth: session }) => {
            if (!session?.user) {
                return false
            }
            return isAuthorized(session.user)
        },
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