import {TransactionMeta, TransactionQuery} from "@/app/api/schema";
import {QueryParams, toApiQuery} from "./types";
import {
    Avatar,
    AvatarBadge,
    Button, Divider,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    FormControl, FormErrorMessage,
    FormLabel,
    IconButton, Select,
    Stack, Switch,
    useDisclosure
} from "@chakra-ui/react";
import {FilterIcon} from "@/components/icons";
import React from "react";
import {useRules, useTransactionMeta} from "@/api-client";
import {Select as ReactSelect} from "chakra-react-select";
import {CategorySelect} from "@/app/(secure)/categories/category-select";

export function TransactionFilters({queryParams, onChange}: {
    queryParams: QueryParams,
    onChange(params: QueryParams): void
}) {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const filtersApplied = Object.entries(queryParams)
        .some(([k, v]) => k !== 'search' && k !== 'page' && !!v)

    const query = toApiQuery(queryParams)
    return (
        <>
            <IconButton
                icon={
                    <Avatar bg="yellow.500" size="md" icon={<FilterIcon/>}>
                        {filtersApplied ? <AvatarBadge boxSize='1.25em' bg='green.500'></AvatarBadge> : <></>}
                    </Avatar>
                }
                aria-label="filter"
                onClick={onOpen}
                variant="ghost"
            />
            <Drawer
                isOpen={isOpen}
                placement='right'
                onClose={onClose}
                size="md"
            >
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    <DrawerHeader>Transaction Filters</DrawerHeader>

                    <DrawerBody>
                        <Stack spacing={6}>
                            <TransactionFilterSelect
                                query={query}
                                selected={queryParams.accountId?.toString()}
                                onChange={accountId => onChange({
                                    ...queryParams,
                                    accountId: Number(accountId) || undefined
                                })}
                                metaKey="accounts"
                                name="Account"
                            />

                            <TransactionFilterSelect
                                query={query}
                                selected={queryParams.statementId?.toString()}
                                onChange={statementId => onChange({
                                    ...queryParams,
                                    statementId: Number(statementId) || undefined
                                })}
                                metaKey="statements"
                                name="Statement"
                            />

                            <TransactionFilterSelect
                                query={query}
                                selected={queryParams.type}
                                onChange={type => onChange({...queryParams, type})}
                                metaKey="types"
                                name="Type"
                            />

                            <TransactionFilterSelect
                                query={query}
                                selected={queryParams.name}
                                onChange={name => onChange({...queryParams, name})}
                                metaKey="names"
                                name="Name"
                            />

                            <TransactionFilterSelect
                                query={query}
                                selected={queryParams.description}
                                onChange={description => onChange({...queryParams, description})}
                                metaKey="descriptions"
                                name="Description"
                            />

                            <Divider />

                            <FormControl>
                                <FormLabel>Category</FormLabel>
                                <CategorySelect
                                    placeholder="All categories"
                                    value={queryParams.categoryId?.toString() || undefined}
                                    onChange={event => onChange({
                                        ...queryParams,
                                        categoryId: Number(event.target.value) || undefined
                                    })}
                                />
                            </FormControl>

                            <CategoryRuleSelect
                                selected={queryParams.ruleId}
                                onChange={ruleId => onChange({...queryParams, ruleId})}
                            />

                            <FormControl display='flex' alignItems='center'>
                                <FormLabel htmlFor='uncategorized' mb='0'>
                                    Uncategorized
                                </FormLabel>
                                <Switch id='uncategorized'
                                        defaultChecked={queryParams.uncategorized === true}
                                        onChange={event => {
                                            onChange({...queryParams, uncategorized: event.target.checked});
                                        }} />
                            </FormControl>

                            <Button mt={4} colorScheme="teal" variant="outline" onClick={onClose}>
                                Apply
                            </Button>

                            <Button colorScheme="red" variant="outline" onClick={() => {
                                // clear all except search
                                onChange({
                                    search: queryParams.search || undefined
                                })
                                onClose()
                            }}>
                                Clear
                            </Button>
                        </Stack>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}

function CategoryRuleSelect({ selected, onChange }: { selected?: number, onChange(value?: number): void }) {
    const { rules, isLoading } = useRules()
    const ruleOptions = isLoading ? []
        : (rules?.map(({ id, name }) => ({ label: name, value: id })) ?? [])

    return (
        <FormControl>
            <FormLabel>Rule</FormLabel>
            <Select defaultValue={selected} placeholder="All rules" onChange={event => {
                onChange(Number(event.target.value) || undefined)
            }}>
                {ruleOptions.map(x =>
                    <option key={x.value} value={x.value}>{x.label}</option>)}
            </Select>
        </FormControl>
    )
}

interface TransactionFilterSelectProps {
    selected?: string
    onChange(value?: string): void
    metaKey: keyof TransactionMeta
    name: string
    query: TransactionQuery
}

function TransactionFilterSelect({selected, onChange, metaKey, name, query}: TransactionFilterSelectProps) {
    const {transactionMeta, isLoading} = useTransactionMeta(!!selected ? {} : query)

    const options: { label: string, value: string, field: 'label' | 'value' }[] =
        isLoading
            ? []
            : transactionMeta?.[metaKey]?.map(meta =>
            typeof meta === 'string' ? {label: meta, value: meta.toLowerCase(), field: 'label'} : {
                label: meta.name,
                value: meta.id.toString(),
                field: 'value'
            }
        ) ?? []
    return (
        <FormControl>
            <FormLabel>{name}</FormLabel>
            <ReactSelect
                isLoading={isLoading}
                placeholder={`All ${name.toLowerCase()}s`}
                defaultValue={options.find(x => x[x.field] === selected)}
                useBasicStyles
                isClearable
                options={options}
                onChange={newValue => onChange(newValue ? newValue[newValue.field] : undefined)}
            />
        </FormControl>
    )
}