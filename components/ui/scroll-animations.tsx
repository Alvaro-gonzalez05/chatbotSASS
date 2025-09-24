"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function ScrollFadeIn({ children, className, delay = 0 }: ScrollAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isIntersecting ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollSlideUp({ children, className, delay = 0 }: ScrollAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60 }}
      animate={isIntersecting ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ 
        duration: 0.8, 
        delay: delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollSlideLeft({ children, className, delay = 0 }: ScrollAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -60 }}
      animate={isIntersecting ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
      transition={{ 
        duration: 0.7, 
        delay: delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollSlideRight({ children, className, delay = 0 }: ScrollAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 60 }}
      animate={isIntersecting ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
      transition={{ 
        duration: 0.7, 
        delay: delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollScaleIn({ children, className, delay = 0 }: ScrollAnimationProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isIntersecting ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ 
        duration: 0.6, 
        delay: delay,
        ease: "easeOut" 
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollStaggeredChildren({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollStaggerChild({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.6,
            ease: "easeOut",
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}