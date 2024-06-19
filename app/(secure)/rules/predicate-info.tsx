import {
    Button,
    Code,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr
} from "@chakra-ui/react";
import React from "react";

export function PredicateInfoDrawer({isOpen, onClose}: { isOpen: boolean, onClose(): void }) {
    return (
        <Drawer
            isOpen={isOpen}
            placement='right'
            onClose={onClose}
            size="md"
        >
            <DrawerOverlay/>
            <DrawerContent>
                <DrawerCloseButton/>
                <DrawerHeader>Transaction Predicate</DrawerHeader>

                <DrawerBody>
                    <Text mb={3}>
                        Transaction predicates use a SQL-like WHERE clause syntax e.g.
                    </Text>

                    <Code mb={3}>
                        name LIKE &apos;LIDL%&apos; AND (amount &lt; 0 OR type == &apos;OTHER&apos;)
                    </Code>

                    <Text mb={3}>
                        Will match all transactions whose name starts with `LIDL` and amount is less than 0 or the type
                        is equal to `OTHER`.
                    </Text>

                    <Text mb={3}>
                        Available operators:
                    </Text>

                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Operator</Th>
                                <Th>Description</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <Tr>
                                <Td><Code>==</Code></Td>
                                <Td>Equal to</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>!=</Code></Td>
                                <Td>Not equal to</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>&gt;</Code></Td>
                                <Td>Greater than</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>&gt;=</Code></Td>
                                <Td>Greater than or equal to</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>&lt;</Code></Td>
                                <Td>Less than</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>&lt;=</Code></Td>
                                <Td>Less than or equal to</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>LIKE</Code></Td>
                                <Td>Matches string pattern</Td>
                            </Tr>
                        </Tbody>
                    </Table>

                    <Text mb={3}>
                        Transaction field names:
                    </Text>

                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Field</Th>
                                <Th>Description</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <Tr>
                                <Td><Code>externalId</Code></Td>
                                <Td>Bank derived ID for this transaction</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>type</Code></Td>
                                <Td>Transaction type</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>name</Code></Td>
                                <Td>Transaction name</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>description</Code></Td>
                                <Td>Transaction description</Td>
                            </Tr>
                            <Tr>
                                <Td><Code>amount</Code></Td>
                                <Td>Transaction amount; debits are negative</Td>
                            </Tr>
                        </Tbody>
                    </Table>

                </DrawerBody>

                <DrawerFooter>
                    <Button variant='outline' colorScheme="blue" onClick={onClose}>
                        Close
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}