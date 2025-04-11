"use client";

import { Button, ButtonGroup, Drawer, Heading } from "@chakra-ui/react";
import { ApiError } from "@/api-client/error";
import { AddIcon } from "@/components/icons";
import React, { useState } from "react";
import { Account, NewAccount } from "@/app/api/schema";
import { accountApi, mutateAccounts } from "@/api-client";
import { mutateAll } from "@/api-client/request";
import { AccountTable } from "./account-table";
import { NewAccountForm } from "./new-account-form";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";

export default function AccountsPage() {
  const router = useRouter();
  return (
    <>
      <Heading size="4xl" mb={6}>
        Accounts
      </Heading>
      <AccountControls onCreate={(account) => createAccount(account)} />
      <AccountTable
        onViewTransactions={(account) =>
          router.push(`transactions?accountId=${account.id}`)
        }
        onDelete={(account) => deleteAccount(account)}
      />
    </>
  );
}

function AccountControls({
  onCreate,
}: {
  onCreate(account: NewAccount): Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const firstField = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <ButtonGroup variant="outline" mb={4}>
        <Button colorPalette="teal" onClick={() => setOpen(true)}>
          <AddIcon /> New Account
        </Button>
      </ButtonGroup>
      <Drawer.Root
        open={open}
        placement="end"
        initialFocusEl={() => firstField.current}
        onOpenChange={(e) => setOpen(e.open)}
        size="md"
      >
        <Drawer.Backdrop />

        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />

            <Drawer.Header>Create a new account</Drawer.Header>

            <Drawer.Body>
              <NewAccountForm
                ref={firstField}
                onSubmit={async (account) => {
                  const result = await onCreate(account);
                  if (result) {
                    setOpen(false);
                  }
                  return result;
                }}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}

async function createAccount(newAccount: NewAccount) {
  try {
    await accountApi.create(newAccount);
    await mutateAccounts();
    toaster.create({
      title: "Success",
      description: "Created new account.",
      type: "success",
      duration: 2000,
      closable: true,
    });
    return true;
  } catch (e) {
    let description: string;
    if (e instanceof ApiError && e.status === 400 && e.body.includes("P2002")) {
      description = "account already exists";
    } else if (e instanceof Error) {
      description = e.message;
    } else {
      description = e?.toString() || "an unknown error";
    }
    console.error(description);
    toaster.create({
      title: "Failed to create new account",
      description,
      type: "error",
      duration: 5000,
      closable: true,
    });
    return false;
  }
}

async function deleteAccount(account: Account) {
  try {
    await accountApi.delete(account.id);
    await mutateAll();
    toaster.create({
      title: "Success",
      description: `Deleted account ${account.bankName} ${account.sortCode} ${account.accountNumber}.`,
      type: "success",
      duration: 2000,
      closable: true,
    });
  } catch (e) {
    let description: string;
    if (e instanceof Error) {
      description = e.message;
    } else {
      description = e?.toString() || "an unknown error";
    }
    console.error(description);
    toaster.create({
      title: "Failed to delete account",
      description,
      type: "error",
      duration: 5000,
      closable: true,
    });
  }
}
