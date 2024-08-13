import {
    Avatar,
    AvatarBadge,
    IconButton, Input, InputGroup, InputLeftElement, InputRightElement,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    useDisclosure
} from "@chakra-ui/react";
import React, {useEffect, useState} from "react";
import {QueryParams} from "@/app/(secure)/transactions/types";
import {CloseIcon, SearchIcon} from "@chakra-ui/icons";
import useDebounce from "@/components/debounce";

export function TransactionSearch({queryParams, onChange}: {
    queryParams: QueryParams,
    onChange(params: QueryParams): void
}) {
    const [searchTerm, setSearchTerm] = useState(queryParams.search ?? '')
    const {isOpen, onOpen, onClose} = useDisclosure()
    const handleSearch = useDebounce(
        (search: string) => onChange({ ...queryParams, search }),
        500);

    // close when enter pressed
    useEffect(() => {
        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                onClose()
            }
        }
        document.addEventListener("keydown", keyDownHandler);

        // clean up
        return () => {
            document.removeEventListener("keydown", keyDownHandler);
        };
    }, [onClose])

    const filtersApplied = !!queryParams.search

    return (
        <>
            <IconButton
                icon={
                    <Avatar bg="blue.500" size="md" icon={<SearchIcon/>}>
                        {filtersApplied ? <AvatarBadge boxSize='1.25em' bg='green.500'></AvatarBadge> : <></>}
                    </Avatar>
                }
                aria-label="filter"
                onClick={onOpen}
                variant="ghost"
            />
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalBody p={4}>
                        <InputGroup size="lg">
                            <InputLeftElement pointerEvents='none' color='gray.300'>
                                <SearchIcon />
                            </InputLeftElement>
                            <Input
                                value={searchTerm}
                                onChange={event => {
                                    const { value } = event.target
                                    setSearchTerm(value)
                                    // Debounce the search callback
                                    handleSearch(value)
                                }}
                            />
                            <InputRightElement>
                                <IconButton
                                    variant="ghost"
                                    _hover={{ backgroundColor: 'transparent' }}
                                    onClick={() => {
                                        setSearchTerm('')
                                        onChange({...queryParams, search: undefined})
                                    }}
                                    icon={<CloseIcon/>}
                                    aria-label="clear search"
                                />
                            </InputRightElement>
                        </InputGroup>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}