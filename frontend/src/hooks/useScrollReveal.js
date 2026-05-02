import { useEffect, useRef } from 'react'

/**
 * Adds `revealed` class when the element enters the viewport.
 * Pair with the CSS `.reveal` / `.reveal.revealed` classes.
 *
 * @param {{ threshold?: number, rootMargin?: string, once?: boolean }} opts
 * @returns {React.RefObject}
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('revealed')
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return ref
}
