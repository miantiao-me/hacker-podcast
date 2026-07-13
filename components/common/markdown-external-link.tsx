import type { ReactNode } from 'react'

interface MarkdownExternalLinkProps {
  href?: string
  children?: ReactNode
  className?: string
}

export function MarkdownExternalLink({ href, children, className }: MarkdownExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? `
        font-medium text-theme-text underline transition-colors
        hover:text-theme-text-hover
      `}
    >
      {children}
    </a>
  )
}
