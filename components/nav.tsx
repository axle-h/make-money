'use client'

import {
    AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
    Avatar,
    Badge,
    Box,
    BoxProps, Button,
    CloseButton,
    Container,
    Drawer,
    DrawerContent,
    Flex,
    FlexProps,
    HStack,
    IconButton, Menu, MenuButton, MenuItem, MenuList,
    useColorMode,
    useDisclosure,
} from '@chakra-ui/react'
import {Link} from '@chakra-ui/next-js'
import {HamburgerIcon, IconProps, MoonIcon, SunIcon} from '@chakra-ui/icons'
import {usePathname, useRouter} from "next/navigation";
import {
    AppIcon, AppName,
    BankIcon,
    CategoriesIcon,
    CodeIcon,
    CreditCardIcon,
    DollarIcon,
    HomeIcon,
    ListIcon, LogoutIcon,
    TransactionIcon
} from "@/components/icons";
import {useUncategorizedTransactionCount} from "@/api-client/transactions";
import React, {useState} from "react";
import {Session} from "next-auth";

interface NavItemProps extends FlexProps {
    NavIcon: React.ComponentType<IconProps>
    href: string
    children: React.ReactNode
}

interface SidebarProps extends BoxProps {
    onClose: () => void
}

function SidebarContent({ onClose, ...rest }: SidebarProps) {
    const pathName = usePathname()
    const todoTransactionCount = useUncategorizedTransactionCount()

    function NavItem({ NavIcon, href, children, ...rest }: NavItemProps) {
        const current = pathName === href
        return (
            <Link
                href={href}
                style={{ textDecoration: 'none' }}
                _focus={{ boxShadow: 'none' }}>
                <Flex
                    align="center"
                    p="4"
                    mx="4"
                    my="1"
                    borderRadius="lg"
                    role="group"
                    cursor="pointer"
                    _hover={{
                        bg: 'gray.600',
                        color: 'white',
                    }}
                    bg={current ? 'gray.300' : undefined}
                    _dark={{
                        bg: current ? 'gray.700' : undefined
                    }}
                    onClick={onClose}
                    {...rest}>
                    <NavIcon
                        mr="4"
                        fontSize="16"
                        _groupHover={{
                            color: 'white',
                        }}
                    />
                    {children}
                </Flex>
            </Link>
        )
    }

    return (
        <Box
            transition="3s ease"
            bg='white'
            borderRight="1px"
            borderRightColor='gray.200'
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            _dark={{
                bg: 'gray.900',
                borderRightColor: 'gray.700'
            }}
            {...rest}>

            <Flex h="20" alignItems="center" mx="8" justifyContent={{ base: 'space-between', md: 'center' }}>
                <Flex alignItems="center">
                    <AppIcon />
                    <AppName />
                </Flex>
                <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
            </Flex>

            <NavItem NavIcon={HomeIcon} href="/dashboard">
                Dashboard
            </NavItem>

            <NavItem NavIcon={DollarIcon} href="/income">
                Income
            </NavItem>

            <NavItem NavIcon={BankIcon} href="/accounts">
                Accounts
            </NavItem>

            <NavItem NavIcon={CreditCardIcon} href="/statements">
                Statements
            </NavItem>

            <NavItem NavIcon={TransactionIcon} href="/transactions">
                Transactions
            </NavItem>

            <NavItem NavIcon={CategoriesIcon} href="/categories">
                Categories
            </NavItem>

            <NavItem NavIcon={CodeIcon} href="/rules">
                Rules
            </NavItem>

            <NavItem NavIcon={ListIcon} href="/uncategorized">
                Uncategorized
                {todoTransactionCount > 0 ? <Badge ml={2} colorScheme="red" variant="solid">{todoTransactionCount}</Badge> : <></>}
            </NavItem>
        </Box>
    )
}

export interface MobileNavProps extends FlexProps {
    session?: Session
    onOpen?(): void
}

function UserMenu({ session }: { session: Session }) {
    const logoutDisclosure = useDisclosure()

    if (!session.user) {
        return <></>
    }

    let displayName = ''
    if ('given_name' in session.user) {
        displayName += session.user.given_name + ' '
    }
    if ('family_name' in session.user) {
        displayName += session.user.family_name
    }

    if (!displayName) {
        displayName = session.user.name || ''
    }

    return (
        <>
            <Menu>
                <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}>
                    <Avatar size={'sm'} name={displayName} />
                </MenuButton>
                <MenuList>
                    <MenuItem icon={<LogoutIcon />} onClick={logoutDisclosure.onOpen}>Logout</MenuItem>
                </MenuList>
            </Menu>
            <LogoutAlert {...logoutDisclosure} />
        </>
    )
}

function LogoutAlert({ onClose, isOpen }: { onClose(): void, isOpen: boolean }) {
    const router = useRouter()
    const [isLoading, setLoading] = useState(false)
    const cancelRef = React.useRef()

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef as any}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        Logout
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        Are you sure you want to logout?
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef as any} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme='red'
                                isLoading={isLoading}
                                onClick={() => {
                                    setLoading(true)
                                    router.replace('/logout');
                                }}
                                ml={3}>
                            Logout
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}

export function MobileNav({ onOpen, session, ...rest }: MobileNavProps) {
    const { colorMode, toggleColorMode } = useColorMode()
    return (
        <Flex
            px={4}
            height="20"
            alignItems="center"
            bg='white'
            borderBottomWidth="1px"
            borderBottomColor='gray.200'
            justifyContent='space-between'
            _dark={{
                bg: 'gray.900',
                borderBottomColor: 'gray.700'
            }}
            {...rest}>

            {!!onOpen
                ? (
                    <>
                        <IconButton
                            display={{ base: 'flex', md: 'none' }}
                            onClick={onOpen}
                            variant="ghost"
                            aria-label="open menu"
                            icon={<HamburgerIcon />}
                        />
                        <AppIcon display={{ base: 'flex', md: 'none' }} />
                    </>
                )
                : (
                    <>
                        <Box />
                        <Flex alignItems="center">
                            <AppIcon />
                            <AppName />
                        </Flex>
                    </>
                )}

            <HStack spacing={{ base: '1', md: '3' }}>
                {!!session ? <UserMenu session={session} /> : <></>}

                <IconButton
                    onClick={toggleColorMode}
                    variant="ghost"
                    aria-label="change colour mode"
                    icon={colorMode === 'light' ? <MoonIcon  /> : <SunIcon />}
                />
            </HStack>
        </Flex>
    )
}

export default function SecureNav({ children, session }: { children: React.ReactNode, session: Session }) {
    const { isOpen, onOpen, onClose } = useDisclosure()

    return (
        <Box minH="100dvh">
            <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full">
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>

            <MobileNav
                ml={{ base: 0, md: 60 }}
                justifyContent={{ base: 'space-between', md: 'flex-end' }}
                onOpen={onOpen}
                session={session}
            />

            <Box ml={{ base: 0, md: 60 }}>
                <Container maxW='1200px' p={4}>
                    {children}
                </Container>
            </Box>
        </Box>
    )
}