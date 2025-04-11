"use client";

import { ButtonGroup, Flex, Heading, HStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { PaginatedParams, QueryParams } from "./types";
import { TransactionTable } from "./transaction-table";
import { TransactionFilters } from "./transaction-filters";
import {
  approveAllTransactionsForRule,
  approveTransaction,
  buildRuleUrl,
  resetTransactionCategories,
} from "./actions";
import { createCategory } from "../categories/actions";
import { CheckIcon } from "@/components/icons";
import { TransactionSearch } from "@/app/(secure)/transactions/transaction-search";
import { Button } from "@/components/ui/button";

type TransactionsSearchParams = { [P in keyof PaginatedParams]: string } & {
  bulkApproveName: string;
};

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>;
}) {
  const router = useRouter();
  const [isBulkApproval, setBulkApproval] = useState(false);
  const pageQuery = React.use(searchParams);

  const queryParams: QueryParams = {
    accountId: Number(pageQuery.accountId) || undefined,
    statementId: Number(pageQuery.statementId) || undefined,
    categoryId: Number(pageQuery.categoryId) || undefined,
    ruleId: Number(pageQuery.ruleId) || undefined,
    type: pageQuery.type,
    name: pageQuery.name,
    description: pageQuery.description,
    uncategorized:
      pageQuery.uncategorized === "true" || pageQuery.uncategorized === "1",
    search: pageQuery.search,
  };
  const paginatedParams: PaginatedParams = {
    ...queryParams,
    page: Number(pageQuery.page) || 1,
    orderBy: pageQuery.orderBy as any,
    orderByDescending: pageQuery.orderByDescending === "true",
  };

  if (!paginatedParams.orderBy) {
    paginatedParams.orderBy = "date";
    paginatedParams.orderByDescending = true;
  }

  function updateQuery(nextParams: QueryParams) {
    const urlParams = new URLSearchParams();
    for (let [key, value] of Object.entries(nextParams)) {
      if (value) {
        urlParams.set(key, value.toString());
      }
    }
    urlParams.set("page", "1");
    router.replace("?" + urlParams.toString());
  }

  return (
    <>
      <Heading size="4xl">Transactions</Heading>
      {!!pageQuery.bulkApproveName ? (
        <Heading size="sm">Approving {pageQuery.bulkApproveName}</Heading>
      ) : (
        <></>
      )}
      <Flex alignItems="center" justifyContent="space-between" mb={4} mt={6}>
        <ButtonGroup variant="outline">
          {!!pageQuery.bulkApproveName &&
          !!queryParams.ruleId &&
          queryParams.uncategorized === true ? (
            <>
              <Button
                colorPalette="yellow"
                loading={isBulkApproval}
                onClick={async () => {
                  setBulkApproval(true);
                  if (
                    await approveAllTransactionsForRule(queryParams.ruleId || 0)
                  ) {
                    router.push("rules");
                  }
                  setBulkApproval(false);
                }}
              >
                <CheckIcon /> Approve All
              </Button>
            </>
          ) : (
            <></>
          )}
        </ButtonGroup>
        <HStack gap={2}>
          <TransactionSearch queryParams={queryParams} onChange={updateQuery} />
          <TransactionFilters
            queryParams={queryParams}
            onChange={updateQuery}
          />
        </HStack>
      </Flex>
      <TransactionTable
        queryParams={paginatedParams}
        updateSort={(orderBy, orderByDescending) => {
          const urlParams = new URLSearchParams(pageQuery);
          urlParams.set("orderBy", orderBy);
          urlParams.set("orderByDescending", orderByDescending.toString());
          router.replace("?" + urlParams.toString());
        }}
        updatePage={(page) => {
          const urlParams = new URLSearchParams(pageQuery);
          urlParams.set("page", page.toString());
          router.replace("?" + urlParams.toString());
        }}
        onCategoryReset={(id) => resetTransactionCategories(id)}
        onBuildRule={(transaction) => router.push(buildRuleUrl(transaction))}
        onUpdate={(id, values) => approveTransaction(id, values)}
        onCreateCategory={(category) => createCategory(category)}
      />
    </>
  );
}
