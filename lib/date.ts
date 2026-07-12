const zhCnUtcDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

const ONE_DAY = 24 * 60 * 60 * 1000

export function getPastDays(days: number): string[] {
  return Array.from({ length: days }, (_, index) => {
    return new Date(Date.now() - index * ONE_DAY).toISOString().split('T')[0]
  })
}

export function toIsoDateString(value: string | number | Date): string {
  return new Date(value).toISOString()
}

export function formatZhCnUtcDate(value: string | number | Date): string {
  return zhCnUtcDateFormatter.format(new Date(value))
}
