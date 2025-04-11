import { AccountType, accountTypeName } from "@/app/api/schema";
import { Box, BoxProps, Stack, Tag } from "@chakra-ui/react";
import React from "react";

export interface AccountTypeTagProps extends Tag.RootProps {
  accountType: AccountType;
}

export function AccountTypeTag({ accountType, ...props }: AccountTypeTagProps) {
  return (
    <Tag.Root
      {...props}
      colorPalette={accountType === "CURRENT_ACCOUNT" ? "purple" : "blue"}
    >
      <Tag.Label>{accountTypeName(accountType)}</Tag.Label>
    </Tag.Root>
  );
}

export function AccountSummary({
  accountName,
  accountType,
}: {
  accountName: string;
  accountType: AccountType;
}) {
  return (
    <Stack gap={1}>
      <Box as="span">{accountName}</Box>
      <Mute>{accountTypeName(accountType)}</Mute>
    </Stack>
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
