import NextAuth, { NextAuthConfig, User } from 'next-auth'
import type { OIDCConfig } from 'next-auth/providers'

function issuer() {
  return process.env.AUTH_AXH_SSO_ISSUER
}

function AxhSso(): OIDCConfig<{ sub: string }> {
  return {
    id: 'axh-sso',
    name: 'AxhSso',
    type: 'oidc',
    checks: ['pkce', 'state'],
    authorization: {
      params: {
        scope: 'openid email profile roles',
      },
    },
    async profile(profile, tokens) {
      const userInfo = await getUserInfo(profile.sub, tokens.access_token || '')
      return { ...userInfo }
    },
    clientId: process.env.AUTH_AXH_SSO_ID,
    clientSecret: process.env.AUTH_AXH_SSO_SECRET,
    issuer: issuer(),
  }
}

/**
 * Authelia has no OIDC end-session endpoint, so end its session via its
 * logout page, which redirects back to `rd` (allowed as it is under ax-h.com).
 */
export function ssoLogoutUrl(): string {
  const url = new URL('logout', issuer())
  if (process.env.NEXTAUTH_URL) {
    url.searchParams.set('rd', process.env.NEXTAUTH_URL)
  }
  return url.href
}

let userInfoEndpoint: Promise<string> | undefined
function getUserInfoEndpoint(): Promise<string> {
  userInfoEndpoint ??= fetch(
    new URL('.well-known/openid-configuration', issuer())
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`OIDC discovery failed: ${response.status}`)
      }
      const { userinfo_endpoint } = await response.json()
      if (typeof userinfo_endpoint !== 'string') {
        throw new Error('OIDC discovery has no userinfo_endpoint')
      }
      return userinfo_endpoint
    })
    .catch((error) => {
      userInfoEndpoint = undefined // retry on next sign-in
      throw error
    })
  return userInfoEndpoint
}

async function getUserInfo(subject: string, accessToken: string) {
  const response = await fetch(await getUserInfoEndpoint(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
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

  const role = user.role
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(APP_ROLE)
}

export const config: NextAuthConfig = {
  session: { strategy: 'jwt' },
  providers: [AxhSso],
  pages: {
    signIn: '/login',
    error: '/error',
  },
  callbacks: {
    authorized({ auth: session }) {
      if (!session?.user) {
        return false
      }
      return isAuthorized(session.user)
    },
    session({ session, token }) {
      return { ...session, user: { ...session.user, ...token } }
    },
    jwt({ token, user }) {
      return { ...token, ...user }
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)
