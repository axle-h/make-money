'use client'

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {Box, IconButton, Input, InputGroup, InputRightElement, useColorMode, useDisclosure} from "@chakra-ui/react"
import {EmojiIcon} from "@/components/icons"
import {useEffect, useRef} from "react";


export function EmojiPicker({ value, onChange }: { value: string, onChange(value: string): void }) {
    const { colorMode } = useColorMode()
    const { isOpen, onClose, onToggle } = useDisclosure()
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
            <Box position="relative">
                <InputGroup onClick={onToggle} ref={inputRef}>
                    <Input placeholder='Emoji' value={value} readOnly />
                    <InputRightElement>
                        <IconButton variant="ghost" _hover={{ bg: 'initial' }} icon={<EmojiIcon />} onClick={onToggle} aria-label="Pick emojis" />
                    </InputRightElement>
                </InputGroup>
                {
                    isOpen ? (
                        <Box position="absolute" marginTop={2} right={0} zIndex={999} ref={wrapperRef}>
                            <Picker
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
