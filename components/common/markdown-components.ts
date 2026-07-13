import type { Components } from 'react-markdown'
import { MarkdownExternalLink } from '@/components/common/markdown-external-link'

export const markdownExternalLinkComponents = {
  a: MarkdownExternalLink,
} satisfies Partial<Components>
