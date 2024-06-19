import {SignInOptions} from "next-auth/react";
import {
    Flex,
    Heading,
    Button,
} from '@chakra-ui/react';
import {LoginIcon} from "@/components/icons";
import {signIn} from '@/auth'

export default function LoginPage({ searchParams }: { searchParams: SignInOptions }) {
    return (
        <Flex
            alignItems="center"
            flexDirection="column"
            bg='white'
            _dark={{
                bg: 'gray.900'
            }}
            py={20}
            borderRadius={8}
            boxShadow="lg"
        >
            <Heading mb={6}>Login</Heading>
            <form action={async () => {
                'use server'
                await signIn('axh-sso', { redirectTo: searchParams.callbackUrl || '/' })
            }}>
                <Button
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<LoginIcon />}
                    type="submit"
                >
                    Login with ax-h.com
                </Button>
            </form>

        </Flex>
    )
}