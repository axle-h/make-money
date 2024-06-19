
import {Text, Button, Alert, AlertIcon, AlertTitle, AlertDescription, Stack} from "@chakra-ui/react";
import NextLink from 'next/link'
import {HomeIcon, LoginIcon} from "@/components/icons";
import React from "react";

export default async function ErrorPage({ searchParams: { error } }: { searchParams: { error?: string } }) {
    return (
        <Alert
            status='error'
            variant='subtle'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            textAlign='center'
            py={20}
            borderRadius={8}
            boxShadow="lg"
        >
            <AlertIcon boxSize='40px' mr={0} />

            <AlertTitle mt={4} mb={3} fontSize='lg'>
                {errorTitle(error)}
            </AlertTitle>

            <AlertDescription maxWidth='sm'>
                <ErrorDescription error={error} />
            </AlertDescription>
        </Alert>
    )
}

function errorTitle(error?: string) {
    switch (error?.trim()?.toLowerCase()) {
        case 'configuration':
            return 'Something went wrong'
        case 'accessdenied':
            return 'Access Denied'
        case 'verification':
            return 'Unable to sign in'
        default:
            return 'Something went wrong'
    }
}

function ErrorDescription({ error }: { error?: string }) {
    switch (error?.trim()?.toLowerCase()) {
        case 'configuration':
            return (
                <>
                    <Text>There is a problem with the server configuration.</Text>
                    <Text mb={4}>Check the server logs for more information.</Text>
                    <NextLink href='/login' passHref legacyBehavior>
                        <Button as="a" leftIcon={<LoginIcon />} variant="outline" colorScheme="red">Login as a different user</Button>
                    </NextLink>
                </>
            )
        case 'accessdenied':
            return (
                <>
                    <Text mb={4}>You do not have permission to login.</Text>
                    <NextLink href='/login' passHref legacyBehavior>
                        <Button as="a" leftIcon={<LoginIcon />} variant="outline" colorScheme="red">Login as a different user</Button>
                    </NextLink>
                </>
            )
        case 'verification':
            return (
                <>
                    <Text mb={4}>The sign in link is no longer valid. It may have been used already or it may have expired.</Text>
                    <NextLink href='/login' passHref legacyBehavior>
                        <Button as="a" leftIcon={<LoginIcon />} variant="outline" colorScheme="red">Login</Button>
                    </NextLink>
                </>
            )
        default:
            return (
                <>
                    <Text mb={4}>There was a problem with your request. Please try again.</Text>
                    <NextLink href='/login' passHref legacyBehavior>
                        <Button as="a" leftIcon={<HomeIcon />} variant="outline" colorScheme="red">Home</Button>
                    </NextLink>
                </>
            )
    }
}