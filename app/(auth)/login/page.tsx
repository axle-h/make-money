'use client'

import { Flex, Heading, Button } from '@chakra-ui/react'
import { LoginIcon } from '@/components/icons'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { signInOnServer } from '@/app/(auth)/login/actions'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo =
    searchParams.get('redirectTo') || searchParams.get('callbackUrl') || '/'

  return (
    <Flex
      alignItems="center"
      flexDirection="column"
      bg="white"
      _dark={{
        bg: 'gray.900',
      }}
      py={20}
      borderRadius={8}
      boxShadow="lg"
    >
      <Heading size="4xl" mb={6}>
        Login
      </Heading>
      <form action={signInOnServer}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <LoginButton />
      </form>
    </Flex>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      colorPalette="teal"
      variant="outline"
      type="submit"
      loading={pending}
      loadingText="Signing you in"
    >
      <LoginIcon />
      Login with ax-h.com
    </Button>
  )
}
