'use client'

import {
  ButtonGroup,
  Drawer,
  Field,
  Heading,
  NativeSelect,
  Stack,
  Table,
} from '@chakra-ui/react'
import { FileUpload } from '@/components/file-upload'
import { ParsedStatement, parseStatementFile } from './parse'
import React, { useState } from 'react'
import { mutateStatements, statementApi, useAccounts } from '@/api-client'
import { formatDateLong, formatDateTimeLong } from '@/components/dates'
import { UploadIcon } from '@/components/icons'
import { ApiError } from '@/api-client/error'
import { NewStatement, Statement } from '@/app/api/schema'
import { useRouter } from 'next/navigation'
import { StatementTable } from './statement-table'
import { ErrorAlert, Loading } from '@/components/alert'
import { currency } from '@/components/currency'
import { Decimal } from '@prisma/client-runtime-utils'
import { Field as FormikField, Form, Formik } from 'formik'
import { FieldProps } from 'formik'
import { Button } from '@/components/ui/button'
import { toaster } from '@/components/ui/toaster'

export default function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const router = useRouter()
  const pageParams = React.use(searchParams)

  return (
    <>
      <Heading size="4xl" mb={6}>
        Statements
      </Heading>
      <StatementControls />
      <StatementTable
        page={Number(pageParams.page) || 1}
        onViewTransactions={(statement) =>
          router.push(`transactions?statementId=${statement.id}`)
        }
        onDelete={(statement) => deleteStatement(statement)}
        updatePage={(page) => {
          const params = new URLSearchParams(pageParams)
          params.set('page', page.toString())
          router.replace(`?` + params.toString())
        }}
      />
    </>
  )
}

function StatementControls() {
  const firstField = React.useRef<HTMLInputElement>(null)
  const [parsedStatement, setParsedStatement] =
    useState<ParsedStatement | null>(null)

  return (
    <>
      <ButtonGroup variant="outline" mb={4}>
        <FileUpload
          onUpload={async (file) => {
            const statement = await tryParseStatement(file)
            if (statement) {
              setParsedStatement(statement)
            }
          }}
          colorPalette="teal"
        >
          <UploadIcon /> Upload Statement
        </FileUpload>
      </ButtonGroup>
      <Drawer.Root
        open={!!parsedStatement}
        placement="end"
        initialFocusEl={() => firstField.current}
        onOpenChange={(e) => {
          if (!e.open) {
            setParsedStatement(null)
          }
        }}
        size="md"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />

            <Drawer.Header>Upload a statement</Drawer.Header>

            <Drawer.Body>
              {parsedStatement ? (
                <UploadStatementForm
                  statement={parsedStatement}
                  onSubmit={async (accountId) => {
                    const result = await uploadStatement({
                      startDate: parsedStatement.startDate,
                      endDate: parsedStatement.endDate,
                      accountId,
                      transactions: parsedStatement.transactions,
                      dateUploaded: parsedStatement.dateUploaded,
                    })
                    if (result) {
                      setParsedStatement(null)
                    }
                    return result
                  }}
                />
              ) : (
                <></>
              )}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  )
}

function ParsedStatementSummary({
  statement: { startDate, endDate, sortCode, accountNumber, transactions },
}: {
  statement: ParsedStatement
}) {
  const amounts = transactions.map(({ amount }) => new Decimal(amount))

  const totalDebits = amounts
    .filter((t) => t.isNeg())
    .reduce((a, b) => a.add(b), new Decimal(0))
  const totalCredits = amounts
    .filter((t) => t.isPos())
    .reduce((a, b) => a.add(b), new Decimal(0))

  return (
    <Table.Root size="sm">
      <Table.Body>
        <Table.Row>
          <Table.Cell fontWeight="bold">Start date</Table.Cell>
          <Table.Cell>{formatDateLong(startDate)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell fontWeight="bold">End date</Table.Cell>
          <Table.Cell>{formatDateLong(endDate)}</Table.Cell>
        </Table.Row>
        {!!sortCode ? (
          <Table.Row>
            <Table.Cell fontWeight="bold">Sort code</Table.Cell>
            <Table.Cell>{sortCode}</Table.Cell>
          </Table.Row>
        ) : (
          <></>
        )}
        {!!accountNumber ? (
          <Table.Row>
            <Table.Cell fontWeight="bold">Account number</Table.Cell>
            <Table.Cell>{accountNumber}</Table.Cell>
          </Table.Row>
        ) : (
          <></>
        )}
        <Table.Row>
          <Table.Cell fontWeight="bold">Transactions</Table.Cell>
          <Table.Cell>{transactions.length.toLocaleString()}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell fontWeight="bold">Total debits</Table.Cell>
          <Table.Cell>{currency(totalDebits)}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell fontWeight="bold">Total credits</Table.Cell>
          <Table.Cell>{currency(totalCredits)}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
  )
}

function UploadStatementForm({
  statement,
  onSubmit,
}: {
  statement: ParsedStatement
  onSubmit(accountId: number): Promise<boolean>
}) {
  const { accounts = [], isLoading, error } = useAccounts()

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <ErrorAlert error={error} />
  }

  const selectedAccount =
    !statement.accountNumber || !statement.sortCode
      ? null
      : accounts
          .filter((account) => account.sortCode)
          .find(
            (account) =>
              account.accountNumber.trim() ===
                statement.accountNumber?.trim() &&
              account.sortCode?.replaceAll('-', '')?.trim() ===
                statement.sortCode?.replace('-', '')?.trim()
          )

  if (!!statement.accountNumber && !!statement.sortCode && !selectedAccount) {
    return (
      <ErrorAlert
        error={`Statement is for unknown account ${statement.sortCode} ${statement.accountNumber}`}
      />
    )
  }

  return (
    <Stack gap={4}>
      <ParsedStatementSummary statement={statement} />
      <Formik
        initialValues={{ accountId: selectedAccount?.id || 0 }}
        onSubmit={async (values, actions) => {
          actions.setSubmitting(true)
          if (await onSubmit(values.accountId)) {
            actions.setSubmitting(false)
            actions.resetForm()
          }
        }}
      >
        {(form) => (
          <Form>
            <Stack gap={4}>
              <FormikField name="accountId">
                {({ field }: FieldProps<number, { accountId: number }>) => (
                  <Field.Root required>
                    <Field.Label>Account</Field.Label>
                    <NativeSelect.Root disabled={!!selectedAccount}>
                      <NativeSelect.Field
                        placeholder="Select account"
                        {...field}
                        onChange={(event) => {
                          const id = Number(event.target.value) || 0
                          return form.setFieldValue('accountId', id)
                        }}
                      >
                        {accounts.map((x) => (
                          <option key={`account-${x.id}`} value={x.id}>
                            {x.bankName} - {x.accountName}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                )}
              </FormikField>
              <Button
                variant="outline"
                colorPalette="teal"
                type="submit"
                loading={form.isSubmitting}
              >
                <UploadIcon /> Upload
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Stack>
  )
}

async function tryParseStatement(file: File): Promise<ParsedStatement | null> {
  try {
    return await parseStatementFile(file)
  } catch (e) {
    let description: string
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to parse statement',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return null
  }
}

async function uploadStatement(statement: NewStatement) {
  try {
    await statementApi.create(statement)
    await mutateStatements()
    toaster.create({
      title: 'Success',
      description: 'created new statement.',
      type: 'success',
      duration: 2000,
      closable: true,
    })
    return true
  } catch (e) {
    let description: string
    if (
      e instanceof ApiError &&
      e.status === 400 &&
      e.body.includes('account does not exist')
    ) {
      description = 'account does not exist'
    } else if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to create new statement',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }
}

async function deleteStatement(statement: Statement) {
  try {
    await statementApi.delete(statement.id)
    await mutateStatements()
    toaster.create({
      title: 'Success',
      description: `Deleted statement ${formatDateTimeLong(statement.dateUploaded)}.`,
      type: 'success',
      duration: 2000,
      closable: true,
    })
  } catch (e) {
    let description: string
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to delete statement',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
  }
}
