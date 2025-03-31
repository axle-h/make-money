'use client'

import { ColorModeProvider } from "@/components/ui/color-mode"
import { ChakraProvider } from "@chakra-ui/react"
import { SessionProvider } from "next-auth/react"
import {system} from "@/components/theme"
import React from "react"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider value={system}>
            <ColorModeProvider>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </ColorModeProvider>
        </ChakraProvider>
    )
}
