'use client'

import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'

// ─── Fade In on scroll ────────────────────────────────────────────────
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction,
  className,
}: {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const offsets = { up: [30, 0], down: [-30, 0], left: [0, 30], right: [0, -30] }
  const [y, x] = direction ? [offsets[direction][0], offsets[direction][1]] : [0, 0]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: direction ? y : 20, x }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Stagger children ─────────────────────────────────────────────────
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
}

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 40, stiffness: 150 })
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) motionValue.set(value)
  }, [isInView, value, motionValue])

  useEffect(() => {
    const unsub = spring.on('change', (latest) => {
      if (ref.current)
        ref.current.textContent = `${prefix}${Math.round(latest).toLocaleString('fr-FR')}${suffix}`
    })
    return unsub
  }, [spring, prefix, suffix])

  return <span ref={ref} className={className} />
}

// ─── Scale on hover ───────────────────────────────────────────────────
export function HoverScale({
  children,
  scale = 1.03,
  className,
}: {
  children: ReactNode
  scale?: number
  className?: string
}) {
  return (
    <motion.div whileHover={{ scale }} whileTap={{ scale: 0.98 }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── Page wrapper with fade transition ────────────────────────────────
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Floating animation (for decorative elements) ─────────────────────
export function FloatingElement({
  children,
  className,
  amplitude = 15,
  duration = 6,
}: {
  children: ReactNode
  className?: string
  amplitude?: number
  duration?: number
}) {
  return (
    <motion.div
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Blur-in text ─────────────────────────────────────────────────────
export function BlurText({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const Tag = motion[as] as typeof motion.div

  return (
    <Tag
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </Tag>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// SCROLL-DRIVEN ANIMATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════

// ─── ScrollScene: sticky section with scroll-progress-driven children ──
export function ScrollScene({
  children,
  className,
  height = '200vh',
}: {
  children: (progress: ReturnType<typeof useTransform<number, number>>) => ReactNode
  className?: string
  height?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  return (
    <div ref={ref} style={{ height }} className="relative">
      <div className={`sticky top-0 h-screen overflow-hidden ${className ?? ''}`}>
        {children(scrollYProgress)}
      </div>
    </div>
  )
}

// ─── ScrollFade: opacity tied to scroll range ─────────────────────────
export function ScrollFade({
  children,
  className,
  scrollProgress,
  fadeIn = [0, 0.3],
  fadeOut = [0.7, 1],
}: {
  children: ReactNode
  className?: string
  scrollProgress: ReturnType<typeof useTransform<number, number>>
  fadeIn?: [number, number]
  fadeOut?: [number, number]
}) {
  const opacity = useTransform(scrollProgress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [0, 1, 1, 0])

  return (
    <motion.div style={{ opacity }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── ScrollTransform: generic scroll-linked transform ─────────────────
export function ScrollTransform({
  children,
  className,
  scrollProgress,
  inputRange,
  outputRange,
  property = 'y',
}: {
  children: ReactNode
  className?: string
  scrollProgress: ReturnType<typeof useTransform<number, number>>
  inputRange: number[]
  outputRange: (string | number)[]
  property?: 'y' | 'x' | 'scale' | 'rotate' | 'opacity'
}) {
  const value = useTransform(scrollProgress, inputRange, outputRange)

  return (
    <motion.div style={{ [property]: value }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── ParallaxLayer: element with configurable scroll speed ────────────
export function ParallaxLayer({
  children,
  className,
  speed = 0.5,
}: {
  children: ReactNode
  className?: string
  speed?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

// ─── useScrollProgress: hook for custom scroll-driven logic ───────────
export function useScrollProgress(offset?: [string, string]) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: (offset ?? ['start end', 'end start']) as unknown as Parameters<typeof useScroll>[0]['offset'],
  })
  return { ref, scrollYProgress }
}

// Re-export motion for direct usage in pages
export { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion'
