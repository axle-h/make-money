import { CategoryRule, Transaction } from "@/app/api/schema";
import { Box, BoxProps, Flex, FlexProps, HStack, Tag } from "@chakra-ui/react";
import { formatDateShort } from "@/components/dates";
import React from "react";
import { CashFlow } from "@/components/cash-flow";

export interface TransactionSummaryProps extends FlexProps {
  transaction: Transaction;
  ruleMatch?: Pick<CategoryRule, "name" | "categoryName">;
}

export function TransactionSummary({
  transaction,
  ruleMatch,
  ...props
}: TransactionSummaryProps) {
  return (
    <Flex
      as="span"
      justifyContent="space-between"
      alignItems="center"
      w="100%"
      h="100%"
      {...props}
    >
      <Flex as="span" gap={4} alignItems="center" flex="1" textAlign="left">
        <Box as="span" fontWeight={600}>
          {formatDateShort(transaction.date)}
        </Box>
        <TransactionName transaction={transaction} ruleMatch={ruleMatch} />
      </Flex>
      <Box as="span" textAlign="right">
        <CashFlow amount={transaction.amount} />
      </Box>
    </Flex>
  );
}

export function TransactionName({
  transaction: { name, type, description, notes },
  ruleMatch,
}: TransactionSummaryProps) {
  return (
    <Flex as="span" direction="column">
      <Box as="span">
        {name} {type === "UNKNOWN" ? "" : `(${type})`}
      </Box>
      {description === "UNKNOWN" ? <></> : <Mute>{description}</Mute>}
      {!!notes ? <Mute as="span">{notes}</Mute> : <></>}
      {!!ruleMatch ? (
        <HStack as="span">
          <Tag.Root colorPalette="teal">
            <Tag.Label>{ruleMatch.name}</Tag.Label>
          </Tag.Root>
          <Tag.Root colorPalette="purple">
            <Tag.Label>{ruleMatch.categoryName}</Tag.Label>
          </Tag.Root>
        </HStack>
      ) : (
        <></>
      )}
    </Flex>
  );
}

function Mute(props: BoxProps) {
  return (
    <Box
      as="span"
      fontStyle="italic"
      color="gray.600"
      _dark={{ color: "gray.400" }}
      fontSize={14}
      {...props}
    />
  );
}
