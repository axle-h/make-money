'use client';

import {
    Flex,
    Button,
    Icon, Box
} from '@chakra-ui/react'
import {ArrowBackIcon, ArrowForwardIcon} from "@chakra-ui/icons";
import React from "react";

export function Pagination({ current, count, onPaginate }: { current: number, count: number, onPaginate(page: number): void }) {
    const PagButton = (props: { page: number, active?: boolean, disabled?: boolean, children: React.ReactNode }) => {
        const activeStyle = {
            bg: "blue.600",
            color: "white",
            _dark: {
                color: "white",
                bg: "blue.500",
            },
        };
        return (
            <Button
                mx={1}
                px={4}
                py={2}
                rounded="md"
                bg="transparent"
                _dark={{
                    color: props.disabled ? "gray.500" : "gray.200"
                }}
                color={props.disabled ? "gray.500" : "gray.800"}
                _hover={!props.disabled ? activeStyle : {}}
                cursor={props.disabled ? "not-allowed" : undefined}
                {...(props.active && activeStyle)}
                onClick={() => onPaginate(props.page)}
            >
                {props.children}
            </Button>
        );
    };

    if (!current || !count) return <></>

    function pageOffset(offset: number): number | null {
        const page = current + offset
        return page < 1 || page > count ? null : page
    }

    const prevPages = [pageOffset(-2), pageOffset(-1)].filter(p => p !== null) as number[]
    const nextPages = [pageOffset(1), pageOffset(2)].filter(p => p !== null) as number[]

    if (prevPages.length === 0 && nextPages.length === 0) {
        return <></>
    }

    const first = prevPages.length === 0 || prevPages.includes(1) ? null : 1
    const last = nextPages.length === 0 || nextPages.includes(count) ? null : count

    return (
        <Flex
            p={50}
            w="full"
            alignItems="center"
            justifyContent="center"
        >
            <Flex>
                { first ? <PagButton page={first}><ArrowBackIcon boxSize={4} /></PagButton> : <></> }
                {prevPages.map(prev => <PagButton key={prev} page={prev}>{prev}</PagButton>)}
                <PagButton page={current} active>{current}</PagButton>
                {nextPages.map(next => <PagButton key={next} page={next}>{next}</PagButton>)}
                { last ? <PagButton page={last}><ArrowForwardIcon boxSize={4} /></PagButton> : <></> }
            </Flex>
        </Flex>
    );
}

