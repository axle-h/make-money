import React from "react";
import { MobileNav } from "@/components/nav";
import { Alert, Container, Flex } from "@chakra-ui/react";
import { auth, isAuthorized } from "@/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <Flex h="100dvh" flexDirection="column">
      {!!session?.user && !isAuthorized(session.user) ? (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Title>Unauthorized</Alert.Title>
          <Alert.Description>
            Looks like your account does not have the required roles to use Make
            Money.
          </Alert.Description>
        </Alert.Root>
      ) : (
        <></>
      )}

      <MobileNav session={session || undefined} />

      <Flex alignItems="center" justifyContent="center" flexGrow={1}>
        <Container maxW="600px" p={4}>
          {children}
        </Container>
      </Flex>
    </Flex>
  );
}
