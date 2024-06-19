import React from "react"
import SecureNav from "@/components/nav";
import {auth} from "@/auth";
import { redirect } from 'next/navigation'

export default async function SecureLayout({ children }: { children: React.ReactNode }) {

    const session = await auth()
    if (!session) {
        redirect('/login')
    } else {
        return <SecureNav session={session}>{children}</SecureNav>
    }
}