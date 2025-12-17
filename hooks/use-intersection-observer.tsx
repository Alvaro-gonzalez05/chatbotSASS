"use client"

import { useEffect, useState, useCallback } from "react"

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  const callbackRef = useCallback((node: Element | null) => {
    setRef(node)
  }, [])

  useEffect(() => {
    if (!ref) return

    if (triggerOnce && hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting
        
        if (isElementIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsIntersecting(true)
          if (triggerOnce) {
            setHasTriggered(true)
          }
        } else if (!triggerOnce) {
          setIsIntersecting(isElementIntersecting)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(ref)

    return () => {
      observer.unobserve(ref)
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered, ref])

  return { ref: callbackRef, isIntersecting }
}