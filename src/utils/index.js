import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function hsvToRgb(h, s, v) {
  let r, g, b

  let i
  let f, p, q, t

  s /= 100
  v /= 100

  h /= 60 // sectors (0 to 6)
  i = Math.floor(h)
  f = h - i // fractional part of h

  p = v * (1 - s)
  q = v * (1 - s * f)
  t = v * (1 - s * (1 - f))

  switch (i) {
    case 0:
      r = v
      g = t
      b = p
      break

    case 1:
      r = q
      g = v
      b = p
      break

    case 2:
      r = p
      g = v
      b = t
      break

    case 3:
      r = p
      g = q
      b = v
      break

    case 4:
      r = t
      g = p
      b = v
      break

    default: // case 5:
      r = v
      g = p
      b = q
      break
  }

  r = Math.round(r * 255)
  g = Math.round(g * 255)
  b = Math.round(b * 255)

  return { r, g, b }
}
