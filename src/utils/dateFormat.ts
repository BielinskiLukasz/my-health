import { format, parseISO } from "date-fns"

export function formatDisplayDate(isoDate: string): string {
  return format(parseISO(isoDate), "EEEE, MMM d")
}

export function formatShortDate(isoDate: string): string {
  return format(parseISO(isoDate), "MMM d")
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}
