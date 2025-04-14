'use client'

import { Button, ButtonGroup, Heading } from '@chakra-ui/react'
import React from 'react'
import { NewCategory } from '@/app/api/schema'
import { AddIcon } from '@/components/icons'
import { CategoryTable } from './category-table'
import { useRouter } from 'next/navigation'
import { CreateOrUpdateCategoryDrawer } from './create-or-update-category-drawer'
import { createCategory, deleteCategory, updateCategory } from './actions'

export default function CategoriesPage() {
  const router = useRouter()
  return (
    <>
      <Heading size="4xl" mb={6}>
        Categories
      </Heading>
      <CategoryControls onCreate={(c) => createCategory(c)} />
      <CategoryTable
        onDelete={(id) => deleteCategory(id)}
        onUpdate={(id, values) => updateCategory(id, values)}
        onViewTransactions={(id) =>
          router.push(`transactions?categoryId=${id}`)
        }
      />
    </>
  )
}

function CategoryControls({
  onCreate,
}: {
  onCreate(category: NewCategory): Promise<boolean>
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <ButtonGroup variant="outline" mb={4}>
        <Button colorPalette="teal" onClick={() => setOpen(true)}>
          <AddIcon /> New Category
        </Button>
      </ButtonGroup>
      <CreateOrUpdateCategoryDrawer
        open={open}
        setOpen={setOpen}
        onSubmit={onCreate}
      />
    </>
  )
}
