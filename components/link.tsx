import NextLink from "next/link";
import {
  Link as ChakraLink,
  LinkProps as ChakraLinkProps,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@/components/icons";

export function Link({
  external = false,
  href,
  children,
  ...props
}: { href: string; external?: boolean } & ChakraLinkProps) {
  return (
    <ChakraLink {...props} asChild cursor="pointer">
      <NextLink href={href} prefetch={!external}>
        {children}
        {external ? <ExternalLinkIcon /> : <></>}
      </NextLink>
    </ChakraLink>
  );
}
