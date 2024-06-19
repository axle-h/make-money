import React from "react"
import {MobileNav} from "@/components/nav";
import {Alert, AlertDescription, AlertIcon, AlertTitle, Box, Container, Flex} from "@chakra-ui/react";
import {auth, isAuthorized} from "@/auth";

export default async function PublicLayout({ children, }: { children: React.ReactNode }) {
    const session = await auth()
    return (
        <Flex h="100vh" flexDirection="column">
            {!isAuthorized(session)
                ? (
                    <Alert status='error'>
                        <AlertIcon />
                        <AlertTitle>Unauthorized</AlertTitle>
                        <AlertDescription>Looks like your account does not have the required roles to use Make Money.</AlertDescription>
                    </Alert>
                ) : <></>
            }

            <MobileNav session={session || undefined} />

            <Flex alignItems="center" justifyContent="center" flexGrow={1}>
                <Container maxW='600px' p={4}>
                    {children}
                </Container>
            </Flex>
        </Flex>
    )
}