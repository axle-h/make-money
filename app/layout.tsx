import type { Metadata } from "next";
import { fonts } from '@/components/fonts'
import {Providers} from "@/components/providers";
import React from "react";

export const metadata: Metadata = {
    title: 'Make Money',
    description: 'Money management for the MAKE household',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fonts.rubik.variable}>
    <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <link rel="manifest" href="/site.webmanifest"/>
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00a300"/>
        <meta name="apple-mobile-web-app-title" content="Make Money"/>
        <meta name="application-name" content="Make Money"/>
        <meta name="msapplication-TileColor" content="#00a300"/>
        <meta name="theme-color" content="#ffffff"/>
    </head>
    <body>
        <Providers>
            {children}
        </Providers>
    </body>
    </html>
  );
}
