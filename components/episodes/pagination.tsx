'use client'

import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

interface EpisodePaginationProps {
  currentPage: number
  totalPages: number
}

function getPageHref(page: number) {
  return page <= 1 ? '/' : `/page/${page}`
}

export function EpisodePagination({ currentPage, totalPages }: EpisodePaginationProps) {
  const pages = useMemo(() => {
    const result: Array<{ type: 'page', value: number } | { type: 'ellipsis', key: string }> = []
    for (let page = 1; page <= totalPages; page += 1) {
      const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
      const showEllipsisBefore = page === 2 && currentPage > 3
      const showEllipsisAfter = page === totalPages - 1 && currentPage < totalPages - 2

      if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
        continue
      }

      if (showEllipsisBefore || showEllipsisAfter) {
        result.push({ type: 'ellipsis', key: `ellipsis-${page}` })
      }
      else {
        result.push({ type: 'page', value: page })
      }
    }
    return result
  }, [currentPage, totalPages])

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={`
      px-4 py-8
      md:px-10 md:py-12
      lg:px-20
    `}
    >
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'cursor-pointer',
                currentPage === 1 && 'opacity-50',
              )}
              nativeButton={false}
              render={(
                <Link
                  href={getPageHref(Math.max(1, currentPage - 1))}
                  scroll
                  aria-label="上一页"
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : undefined}
                />
              )}
            >
              <RiArrowLeftSLine className="size-4" aria-hidden="true" />
            </Button>
          </PaginationItem>

          {pages.map((item) => {
            if (item.type === 'ellipsis') {
              return (
                <PaginationItem key={item.key}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }

            const page = item.value
            return (
              <PaginationItem key={page}>
                <Button
                  variant={page === currentPage ? 'outline' : 'ghost'}
                  size="icon"
                  className={cn(
                    'cursor-pointer',
                    page === currentPage && `
                      bg-theme text-white
                      hover:bg-theme-hover hover:text-white
                    `,
                  )}
                  nativeButton={false}
                  render={(
                    <Link
                      href={getPageHref(page)}
                      scroll
                      aria-current={page === currentPage ? 'page' : undefined}
                      data-slot="pagination-link"
                      data-active={page === currentPage}
                    />
                  )}
                >
                  {page}
                </Button>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'cursor-pointer',
                currentPage === totalPages && 'opacity-50',
              )}
              nativeButton={false}
              render={(
                <Link
                  href={getPageHref(Math.min(totalPages, currentPage + 1))}
                  scroll
                  aria-label="下一页"
                  aria-disabled={currentPage === totalPages}
                  tabIndex={currentPage === totalPages ? -1 : undefined}
                />
              )}
            >
              <RiArrowRightSLine className="size-4" aria-hidden="true" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
