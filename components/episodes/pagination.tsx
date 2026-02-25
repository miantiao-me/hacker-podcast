'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { getPageStore } from '@/stores/page-store'

interface EpisodesPaginationProps {
  currentPage: number
  totalPages: number
}

export function EpisodesPagination({ currentPage, totalPages }: EpisodesPaginationProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  const scrollToTop = () => {
    setTimeout(() => {
      const mainContainer = document.getElementById('main-scroll-container')
      mainContainer?.scrollTo({ top: 0, behavior: 'auto' })
      window.scrollTo({ top: 0, behavior: 'auto' })
    }, 100)
  }

  const setPage = (page: number) => {
    if (page === currentPage)
      return
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    }
    else {
      params.set('page', String(page))
    }
    const url = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(url, { scroll: true })
    const pageStore = getPageStore()
    pageStore.setState(() => ({ currentPage: page }))
    scrollToTop()
  }

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
            <PaginationLink
              className={cn(
                'cursor-pointer',
                currentPage === 1 && 'pointer-events-none opacity-50',
              )}
              aria-label={t('pagination.previous')}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </PaginationLink>
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
                <PaginationLink
                  isActive={page === currentPage}
                  className={cn(
                    'cursor-pointer',
                    page === currentPage && `
                      bg-theme text-white
                      hover:bg-theme-hover hover:text-white
                    `,
                  )}
                  onClick={() => setPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <PaginationLink
              className={cn(
                'cursor-pointer',
                currentPage === totalPages && 'pointer-events-none opacity-50',
              )}
              aria-label={t('pagination.next')}
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
