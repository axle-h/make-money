import { mutateTransactions, ruleApi, transactionApi } from '@/api-client'
import { Transaction, UpdateTransactionRequest } from '@/app/api/schema'
import { CategoryRule } from '@prisma/client'
import { toaster } from '@/components/ui/toaster'

export async function resetTransactionCategories(id: number) {
  try {
    await transactionApi.update(id, { categories: [] })
    await mutateTransactions()
    toaster.create({
      title: 'Success',
      description: `Reset categories.`,
      type: 'success',
      duration: 2000,
      closable: true,
    })
    return true
  } catch (e) {
    let description: string
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to reset categories',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }
}

export async function approveAllTransactionsForRule(ruleId: number) {
  let lastError: string | null = null

  let rule: CategoryRule | null
  try {
    rule = await ruleApi.get(ruleId)
  } catch (e) {
    let description
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to retrieve category rule',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }

  if (!rule) {
    toaster.create({
      title: 'Success',
      description: 'Category rule does not exist',
      type: 'success',
      duration: 2000,
      closable: true,
    })
    return false
  }

  let ids: number[]
  try {
    const transactions = await transactionApi.list({
      page: 1,
      limit: 1000,
      ruleId,
      uncategorized: true,
    })
    ids = transactions.data.map((t) => t.id)
  } catch (e) {
    let description
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to retrieve uncategorized transactions',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }

  if (ids.length === 0) {
    toaster.create({
      title: 'Success',
      description: 'No uncategorized transactions found for this rule',
      type: 'error',
      duration: 2000,
      closable: true,
    })
    return true
  }

  const promises = ids.map(async (id) => {
    try {
      await transactionApi.update(id, {
        notes: rule.name,
        categories: [{ id: rule.categoryId, fraction: 1 }],
      })
    } catch (e) {
      let description
      if (e instanceof Error) {
        description = e.message
      } else {
        description = e?.toString() || 'an unknown error'
      }
      console.error(description)
      lastError = description
    }
  })
  await Promise.all(promises)

  await mutateTransactions()

  if (lastError) {
    toaster.create({
      title: 'Failed to approve transactions',
      description: lastError,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }

  toaster.create({
    title: 'Success',
    description: 'Approved transactions.',
    type: 'success',
    duration: 2000,
    closable: true,
  })
  return true
}

export async function approveTransaction(
  id: number,
  values: UpdateTransactionRequest
) {
  try {
    await transactionApi.update(id, values)
    await mutateTransactions()
    toaster.create({
      title: 'Success',
      description: 'Approved transaction.',
      type: 'success',
      duration: 2000,
      closable: true,
    })
    return true
  } catch (e) {
    let description: string
    if (e instanceof Error) {
      description = e.message
    } else {
      description = e?.toString() || 'an unknown error'
    }
    console.error(description)
    toaster.create({
      title: 'Failed to approve transaction',
      description,
      type: 'error',
      duration: 5000,
      closable: true,
    })
    return false
  }
}

function cleanStringLiteral(s: string) {
  return s.replaceAll("'", "\\'")
}

export function buildRuleUrl({ name, description, type }: Transaction) {
  const urlParams = new URLSearchParams()
  urlParams.set('newName', toTitleCase(name))
  urlParams.set(
    'newPredicate',
    `name == '${cleanStringLiteral(name)}' AND description == '${cleanStringLiteral(description)}' AND type == '${cleanStringLiteral(type)}'`
  )
  return 'rules?' + urlParams.toString()
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  )
}
