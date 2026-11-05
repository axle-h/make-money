import { redirect } from 'next/navigation'
import { ssoLogoutUrl } from '@/auth'

/**
 * End the sso session.
 */
export default function LogoutPage() {
  return redirect(ssoLogoutUrl())
}
