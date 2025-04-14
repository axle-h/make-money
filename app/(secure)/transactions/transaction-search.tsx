import { IconButton, Input, InputGroup, Dialog } from '@chakra-ui/react'
import React, { useEffect, useState } from 'react'
import { QueryParams } from '@/app/(secure)/transactions/types'
import { CloseIcon, FiltersAppliedBadge, SearchIcon } from '@/components/icons'
import useDebounce from '@/components/debounce'
import { Avatar } from '@/components/ui/avatar'

export function TransactionSearch({
  queryParams,
  onChange,
}: {
  queryParams: QueryParams
  onChange(params: QueryParams): void
}) {
  const [searchTerm, setSearchTerm] = useState(queryParams.search ?? '')
  const [open, setOpen] = useState(false)
  const handleSearch = useDebounce(
    (search: string) => onChange({ ...queryParams, search }),
    500
  )

  // close when enter pressed
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', keyDownHandler)

    // clean up
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [setOpen])

  const filtersApplied = !!queryParams.search

  return (
    <>
      <IconButton
        aria-label="filter"
        onClick={() => setOpen(true)}
        variant="ghost"
      >
        <Avatar bg="blue.500" size="md" icon={<SearchIcon />}>
          {filtersApplied ? <FiltersAppliedBadge /> : <></>}
        </Avatar>
      </IconButton>
      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="xl">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Body p={4}>
              <InputGroup
                startElement={
                  <SearchIcon pointerEvents="none" color="gray.300" />
                }
                endElement={
                  <IconButton
                    variant="ghost"
                    _hover={{ backgroundColor: 'transparent' }}
                    onClick={() => {
                      setSearchTerm('')
                      onChange({ ...queryParams, search: undefined })
                    }}
                    aria-label="clear search"
                  >
                    <CloseIcon />
                  </IconButton>
                }
              >
                <Input
                  value={searchTerm}
                  onChange={(event) => {
                    const { value } = event.target
                    setSearchTerm(value)
                    // Debounce the search callback
                    handleSearch(value)
                  }}
                />
              </InputGroup>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
