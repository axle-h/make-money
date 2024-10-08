'use client'

import { ChakraProvider} from '@chakra-ui/react'
import { SessionProvider } from "next-auth/react";
import {theme} from "@/components/theme";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider theme={theme}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </ChakraProvider>
    )
}