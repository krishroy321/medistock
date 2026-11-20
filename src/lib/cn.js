import { clsx } from 'clsx'

/** Compose Tailwind class names conditionally. */
export function cn(...args) {
  return clsx(...args)
}
