import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (number) => {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M"
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K"
  } else {
    return number.toString()
  }
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { year: "numeric", month: "short", day: "numeric" }
  return date.toLocaleDateString(undefined, options)
}
