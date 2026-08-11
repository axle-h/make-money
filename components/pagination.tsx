'use client'

import { Flex, Button } from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon } from './icons'
import React from 'react'

const activeStyle = {
  bg: 'blue.600',
  color: 'white',
  _dark: {
    color: 'white',
    bg: 'blue.500',
  },
}

function PagButton({
  page,
  active,
  disabled,
  onPaginate,
  children,
}: {
  page: number
  active?: boolean
  disabled?: boolean
  onPaginate(page: number): void
  children: React.ReactNode
}) {
  return (
    <Button
      mx={1}
      px={4}
      py={2}
      rounded="md"
      bg="transparent"
      _dark={{
        color: disabled ? 'gray.500' : 'gray.200',
      }}
      color={disabled ? 'gray.500' : 'gray.800'}
      _hover={!disabled ? activeStyle : {}}
      cursor={disabled ? 'not-allowed' : undefined}
      {...(active && activeStyle)}
      onClick={() => onPaginate(page)}
    >
      {children}
    </Button>
  )
}

export function Pagination({
  current,
  count,
  onPaginate,
}: {
  current: number
  count: number
  onPaginate(page: number): void
}) {
  if (!current || !count) return <></>

  function pageOffset(offset: number): number | null {
    const page = current + offset
    return page < 1 || page > count ? null : page
  }

  const prevPages = [pageOffset(-2), pageOffset(-1)].filter(
    (p) => p !== null
  ) as number[]
  const nextPages = [pageOffset(1), pageOffset(2)].filter(
    (p) => p !== null
  ) as number[]

  if (prevPages.length === 0 && nextPages.length === 0) {
    return <></>
  }

  const first = prevPages.length === 0 || prevPages.includes(1) ? null : 1
  const last =
    nextPages.length === 0 || nextPages.includes(count) ? null : count

  return (
    <Flex p={50} w="full" alignItems="center" justifyContent="center">
      <Flex>
        {first ? (
          <PagButton page={first} onPaginate={onPaginate}>
            <ArrowBackIcon boxSize={4} />
          </PagButton>
        ) : (
          <></>
        )}
        {prevPages.map((prev) => (
          <PagButton key={prev} page={prev} onPaginate={onPaginate}>
            {prev}
          </PagButton>
        ))}
        <PagButton page={current} active onPaginate={onPaginate}>
          {current}
        </PagButton>
        {nextPages.map((next) => (
          <PagButton key={next} page={next} onPaginate={onPaginate}>
            {next}
          </PagButton>
        ))}
        {last ? (
          <PagButton page={last} onPaginate={onPaginate}>
            <ArrowForwardIcon boxSize={4} />
          </PagButton>
        ) : (
          <></>
        )}
      </Flex>
    </Flex>
  )
}
