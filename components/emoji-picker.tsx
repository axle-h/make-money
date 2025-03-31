'use client'

import data from '@emoji-mart/data'
import { Picker } from 'emoji-mart'
import {Box, IconButton, Input, InputGroup, useDisclosure} from "@chakra-ui/react"
import {EmojiIcon} from "@/components/icons"
import React, {MutableRefObject, useEffect, useRef} from "react";
import {useColorMode} from "@/components/ui/color-mode";

export function EmojiPicker({ value, onChange }: { value: string, onChange(value: string): void }) {
    const { colorMode } = useColorMode()
    const { open, onClose, onToggle } = useDisclosure()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node
            if (target && wrapperRef.current && inputRef.current && !inputRef.current.contains(target) && !wrapperRef.current.contains(target)) {
                onClose()
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [wrapperRef, inputRef, onClose])

    return (
        <>
            <Box position="relative" w="100%">
                <InputGroup
                    endElement={
                        <IconButton variant="ghost" _hover={{ bg: 'initial' }} onClick={onToggle} aria-label="Pick emojis">
                            <EmojiIcon />
                        </IconButton>
                    }
                    onClick={onToggle}
                    ref={inputRef}
                >
                    <Input placeholder='Emoji' value={value} readOnly />
                </InputGroup>
                {
                    open ? (
                        <Box position="absolute" marginTop={2} right={0} zIndex={9999} ref={wrapperRef}>
                            <EmojiMartPicker
                                maxFrequentRows={0}
                                theme={colorMode}
                                data={data}
                                onEmojiSelect={(e: { native: string }) => {
                                    onChange(e.native)
                                    onClose()
                                }}
                                previewPosition="none"
                                set="native"
                                autoFocus={true}
                                noCountryFlags={true}
                                skinTonePosition="none"
                            />
                        </Box>
                    ) : <></>
                }
            </Box>
        </>
    )
}

function EmojiMartPicker(props: any) {
    const ref = useRef<HTMLDivElement | null>(null)
    const instance = useRef<Picker | null>(null)

    if (instance.current) {
        instance.current.update(props)
    }

    useEffect(() => {
        instance.current = new Picker({ ...props, ref })

        return () => {
            instance.current = null
        }
    }, [props, ref])

    return React.createElement('div', { ref })
}