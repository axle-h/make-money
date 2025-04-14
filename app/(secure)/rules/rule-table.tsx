import { useRules, useTransactions } from '@/api-client'
import { ErrorAlert, Loading, NoData } from '@/components/alert'
import { CategoryRule, NewCategoryRule } from '@/app/api/schema'
import {
  Code,
  IconButton,
  Menu,
  Table,
  Tag,
  useDisclosure,
} from '@chakra-ui/react'
import React, { useState } from 'react'
import { ListIcon, MoreVerticalIcon } from '@/components/icons'
import { DeleteIcon, EditIcon, ViewIcon } from '@/components/icons'
import { UpdateRuleDrawer } from './update-rule-drawer'
import { Predicate } from '@/app/api/predicate'

export interface RuleTableProps {
  onDelete(id: number): Promise<boolean>
  onViewTransactions(rule: CategoryRule, uncategorized: boolean): void
  onUpdate(id: number, values: NewCategoryRule): Promise<boolean>
}

export function RuleTable({
  onDelete,
  onViewTransactions,
  onUpdate,
}: RuleTableProps) {
  const { rules, isLoading, error } = useRules()
  const { transactions } = useTransactions({
    page: 1,
    limit: 999,
    uncategorized: true,
  })

  if (isLoading) {
    return <Loading />
  }
  if (error) {
    return <ErrorAlert error={error} />
  }
  if (!rules || rules.length === 0) {
    return <NoData />
  }

  const uncategorizedTransactions = transactions?.data || []

  function RuleRow({ rule }: { rule: CategoryRule }) {
    let uncategorizedCount: number | null = null
    try {
      const predicate = new Predicate(rule.predicate)
      uncategorizedCount = uncategorizedTransactions.filter((t) =>
        predicate.evaluate(t)
      ).length
    } catch (e) {
      console.error(e)
    }

    const hasUncategorizedTransactions =
      uncategorizedCount !== null && uncategorizedCount > 0

    return (
      <Table.Row>
        <Table.Cell>{rule.name}</Table.Cell>
        <Table.Cell whiteSpace="initial">
          <Code bgColor="transparent">{rule.predicate}</Code>
        </Table.Cell>
        <Table.Cell>
          <Tag.Root colorPalette="purple">
            <Tag.Label>{rule.categoryName}</Tag.Label>
          </Tag.Root>
        </Table.Cell>
        <Table.Cell
          textAlign="end"
          color={hasUncategorizedTransactions ? 'red.500' : 'initial'}
        >
          {uncategorizedCount === null ? (
            <Loading />
          ) : (
            <>{uncategorizedCount}</>
          )}
        </Table.Cell>
        <Table.Cell px={0}>
          <RuleMenu
            rule={rule}
            onDelete={() => onDelete(rule.id)}
            onViewTransactions={(uncategorized) =>
              onViewTransactions(rule, uncategorized)
            }
            onUpdate={(values) => onUpdate(rule.id, values)}
            hasUncategorizedTransactions={hasUncategorizedTransactions}
          />
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <Table.Root variant="line">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader>Rule</Table.ColumnHeader>
          <Table.ColumnHeader>Category</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Uncategorized</Table.ColumnHeader>
          <Table.ColumnHeader px={0}></Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} />
        ))}
      </Table.Body>
    </Table.Root>
  )
}

interface RuleMenuProps {
  rule: CategoryRule
  onUpdate(values: NewCategoryRule): Promise<boolean>
  onDelete(): Promise<boolean>
  onViewTransactions(uncategorized: boolean): void
  hasUncategorizedTransactions: boolean
}

function RuleMenu({
  rule,
  onDelete,
  onViewTransactions,
  onUpdate,
  hasUncategorizedTransactions,
}: RuleMenuProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton variant="ghost">
            <MoreVerticalIcon />
          </IconButton>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              value="view-transactions"
              onClick={() => onViewTransactions(false)}
            >
              <ViewIcon /> View transactions
            </Menu.Item>
            <Menu.Item
              value="approve-all"
              onClick={() => onViewTransactions(true)}
              disabled={!hasUncategorizedTransactions}
            >
              <ListIcon /> Approve all uncategorized
            </Menu.Item>
            <Menu.Item value="edit-rule" onClick={() => setUpdateOpen(true)}>
              <EditIcon /> Edit
            </Menu.Item>
            <Menu.Item
              value="delete-rule"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true)
                try {
                  await onDelete()
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              <DeleteIcon /> Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
      <UpdateRuleDrawer
        open={updateOpen}
        setOpen={setUpdateOpen}
        rule={rule}
        onSubmit={onUpdate}
      />
    </>
  )
}
