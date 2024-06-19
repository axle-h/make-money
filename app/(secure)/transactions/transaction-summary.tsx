import {CategoryRule, Transaction} from "@/app/api/schema";
import {Box, BoxProps, Flex, HStack, Stat, StatArrow, StatNumber, Tag} from "@chakra-ui/react";
import {formatDateShort} from "@/components/dates";
import {currency} from "@/components/currency";
import React from "react";
import {Prisma} from "@prisma/client";

export interface TransactionSummaryProps {
    transaction: Transaction
    ruleMatch?: Pick<CategoryRule, 'name' | 'categoryName'>
}

export function TransactionSummary({
                                       transaction,
                                       ruleMatch
                                   }: TransactionSummaryProps) {
    return (
        <Flex as='span' justifyContent="space-between" alignItems="center" w="100%" h="100%">
            <Flex as="span" gap={4} alignItems="center" flex="1" textAlign='left'>
                <Box as="span" fontWeight={600}>{formatDateShort(transaction.date)}</Box>
                <TransactionName transaction={transaction} ruleMatch={ruleMatch} />
            </Flex>
            <Box as="span" textAlign='right'>
                <CashFlow amount={transaction.amount} />
            </Box>
        </Flex>
    )
}

export function TransactionName({
    transaction: { name, type, description, notes },
    ruleMatch
}: TransactionSummaryProps) {
    return (
        <Flex as="span" direction="column">
            <Box as="span">{name} {type === 'UNKNOWN' ? '' : `(${type})`}</Box>
            {description === 'UNKNOWN' ? <></> : (
                <Mute>{description}</Mute>
            )}
            {!!notes ? <Mute as="span">{notes}</Mute> : <></>}
            {!!ruleMatch ? (
                <HStack as="span">
                    <Tag colorScheme="teal">{ruleMatch.name}</Tag>
                    <Tag colorScheme="purple">{ruleMatch.categoryName}</Tag>
                </HStack>
            ) : <></>}
        </Flex>
    )
}

export function CashFlow({ amount }: { amount: Prisma.Decimal | number }) {

    const [absAmount, isPos, isZero] = amount instanceof Prisma.Decimal
        ? [amount.abs(), amount.isPos(), amount.isZero()]
        : [Math.abs(amount), amount > 0, amount === 0]

    if (isZero) {
        return <></>
    }

    return (
        <Stat size="sm">
            <StatNumber fontWeight="300">
                <StatArrow type={isPos ? 'increase' : 'decrease'} />
                {currency(absAmount)}
            </StatNumber>
        </Stat>
    )
}

function Mute(props: BoxProps) {
    return (
        <Box as="span"
             fontStyle="italic"
             color="gray.600"
             _dark={{color: 'gray.400'}}
             fontSize={14}
            {...props}
        />
    )
}