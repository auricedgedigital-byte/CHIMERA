"use client"

import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "framer-motion"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export interface HeroCarouselItem {
  id?: string | number
  title: string
  image: string
  credit?: string
  meta?: string[]
  accent?: string
  slug: string // collection route e.g. "/collections/new-world"
  tagline?: string
}

export interface HeroCarouselProps {
  items: HeroCarouselItem[]
  index?: number
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  brand?: React.ReactNode
  autoplay?: boolean
  autoplayDelay?: number
  className?: string
}

const CARD_H = 0.3
const CARD_AR = 0.72
const GAP = 0.038
const STRIP_TOP = 0.52
const TITLE = 0.072
const LABEL = 0.012
const PAD = 0.022
const RAIL = 0.18

const WHEEL_THRESHOLD = 60
const WHEEL_COOLDOWN = 420

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function HeroCarousel({
  items,
  index: controlled,
  defaultIndex = 0,
  onIndexChange,
  brand,
  autoplay = true,
  autoplayDelay = 5000,
  className,
}: HeroCarouselProps) {
  const router = useRouter()
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  const [uncontrolled, setUncontrolled] = React.useState(defaultIndex)
  const [dragging, setDragging] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const reduced = useReducedMotion()

  const last = items.length - 1
  const index = clamp(controlled ?? uncontrolled, 0, Math.max(0, last))

  const go = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, Math.max(0, last))
      if (controlled === undefined) setUncontrolled(clamped)
      if (clamped !== index) onIndexChange?.(clamped)
    },
    [controlled, index, last, onIndexChange]
  )

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const read = () => setBox({ w: stage.clientWidth, h: stage.clientHeight })
    read()
    const ro = new ResizeObserver(read)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  const fullH = clamp(box.h * CARD_H, 120, 420)
  const halfH = fullH / 2
  const cardW = fullH * CARD_AR
  const gap = Math.max(6, Math.round(cardW * GAP))
  const step = cardW + gap
  const pad = Math.max(20, Math.round(box.w * PAD))
  const label = Math.max(10, Math.round(box.h * LABEL))

  const xFor = React.useCallback(
    (i: number) => box.w / 2 - (i * step + cardW / 2),
    [box.w, step, cardW]
  )
  const x = useMotionValue(0)
  const target = xFor(index)

  const swing = reduced ? { duration: 0 } : { duration: 0.7, ease: "easeOut" as const }
  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 34, mass: 0.9 }

  React.useEffect(() => {
    if (dragging) return
    const run = animate(x, target, spring)
    return () => run.stop()
  }, [target, dragging, reduced, x]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let acc = 0
    let until = 0
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      const stuck = (delta > 0 && index === last) || (delta < 0 && index === 0)
      if (stuck) { acc = 0; return }
      e.preventDefault()
      const now = e.timeStamp
      if (now < until) return
      acc += delta
      if (Math.abs(acc) < WHEEL_THRESHOLD) return
      go(index + Math.sign(acc))
      acc = 0
      until = now + WHEEL_COOLDOWN
    }
    stage.addEventListener("wheel", onWheel, { passive: false })
    return () => stage.removeEventListener("wheel", onWheel)
  }, [go, index, last])

  React.useEffect(() => {
    if (!autoplay || paused || dragging || items.length < 2) return
    const id = window.setTimeout(
      () => go(index === last ? 0 : index + 1),
      autoplayDelay
    )
    return () => window.clearTimeout(id)
  }, [autoplay, autoplayDelay, dragging, go, index, items.length, last, paused])

  const active = items[index]
  if (!active) return null

  const lines = active.title.split("\n")
  const accent = active.accent ?? "#8a8a8a"

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Chimera Collections"
      onKeyDown={(e) => {
        const keys: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last }
        if (!(e.key in keys)) return
        e.preventDefault()
        go(keys[e.key]!)
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "relative h-full min-h-[100svh] w-full overflow-hidden bg-black text-white select-none",
        "outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:ring-inset",
        className
      )}
    >
      {/* Background: focused photo graded to accent */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swing}
        >
          <motion.img
            src={active.image}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-center"
            initial={{ scale: reduced ? 1.28 : 1.42 }}
            animate={{ scale: 1.28 }}
            transition={reduced ? { duration: 0 } : { duration: 8, ease: "linear" }}
          />
          <div className="absolute inset-0" style={{ backgroundColor: accent, mixBlendMode: "color" }} />
          <div className="absolute inset-0 opacity-60" style={{ backgroundColor: accent, mixBlendMode: "multiply" }} />
        </motion.div>
      </AnimatePresence>

      {/* Overlay: gradient + grain */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
      />

      {/* Top bar */}
      <div
        className="absolute inset-x-0 flex items-center justify-between z-20"
        style={{ top: Math.max(20, box.h * 0.032), paddingLeft: pad, paddingRight: pad }}
      >
        {brand ? (
          <div className="font-bold tracking-[0.25em] uppercase text-white" style={{ fontSize: label * 1.4 }}>
            {brand}
          </div>
        ) : null}
        <nav className="flex gap-6 text-white/70" style={{ fontSize: label }}>
          <a href="/collections/new-world" className="uppercase tracking-widest hover:text-white transition-colors font-mono">New World</a>
          <a href="/collections/classics" className="uppercase tracking-widest hover:text-white transition-colors font-mono">Classics</a>
          <a href="/collections/visions" className="uppercase tracking-widest hover:text-white transition-colors font-mono">Visions</a>
        </nav>
      </div>

      {/* Headline block */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col justify-end z-10"
        style={{
          height: `${STRIP_TOP * 100}%`,
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(box.h * 0.032),
        }}
      >
        <div className="flex w-full flex-wrap items-end gap-x-[5vw] gap-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2
              key={index}
              className="font-black leading-[0.85] tracking-[-0.04em] uppercase"
              style={{ fontSize: Math.max(32, Math.round(box.h * TITLE)) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {lines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={
                      reduced ? { duration: 0 } : { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>

          {active.tagline ? (
            <motion.p
              key={`tag-${index}`}
              className="font-mono uppercase tracking-[0.18em] opacity-70 text-white"
              style={{ fontSize: label }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {active.tagline}
            </motion.p>
          ) : null}

          {active.credit ? (
            <motion.p
              key={`credit-${index}`}
              className="font-mono uppercase tracking-[0.14em] opacity-60 text-white ml-auto"
              style={{ fontSize: label }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {active.credit}
            </motion.p>
          ) : null}
        </div>

        {/* "Enter Collection" hint on active card */}
        <AnimatePresence>
          <motion.div
            key={`hint-${index}`}
            className="mt-4 flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              onClick={() => router.push(active.slug)}
              className="group flex items-center gap-3 border border-white/40 text-white/80 hover:border-white hover:text-white transition-all px-5 py-2 uppercase tracking-[0.2em] font-mono"
              style={{ fontSize: label * 0.95 }}
            >
              Enter Collection
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The filmstrip */}
      <div className="absolute inset-x-0 z-10" style={{ top: `${STRIP_TOP * 100}%`, height: fullH }}>
        <motion.div
          className="flex items-start"
          style={{ gap, x, cursor: dragging ? "grabbing" : "grab" }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: xFor(last), right: xFor(0) }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false)
            const thrown = x.get() + info.velocity.x * 0.12
            go(Math.round((box.w / 2 - thrown - cardW / 2) / step))
          }}
        >
          {items.map((item, i) => (
            <motion.button
              key={item.id ?? i}
              type="button"
              aria-label={item.title.replace(/\n/g, " ")}
              aria-current={i === index}
              onClick={() => {
                if (i === index) {
                  router.push(item.slug)
                } else {
                  go(i)
                }
              }}
              className="relative shrink-0 overflow-hidden bg-white/5 group"
              style={{ width: cardW }}
              animate={{ height: i === index ? fullH : halfH }}
              transition={spring}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover object-center"
                style={{ objectPosition: "50% 20%" }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-black"
                animate={{ opacity: i === index ? 0 : 0.35 }}
                transition={spring}
              />
              {/* "Tap to Enter" label on active card */}
              {i === index && (
                <motion.span
                  className="absolute bottom-3 left-0 right-0 text-center font-mono text-white/60 uppercase tracking-widest"
                  style={{ fontSize: label * 0.85 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Click to Enter
                </motion.span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Progress rail */}
      <div
        className="absolute z-10"
        style={{ left: pad, bottom: Math.max(18, box.h * 0.025), width: box.w * RAIL }}
      >
        <div className="flex justify-between font-mono tabular-nums text-white/70" style={{ fontSize: label }}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{String(items.length).padStart(2, "0")}</span>
        </div>
        <div className="relative mt-2 h-px w-full bg-white/20">
          <motion.div
            className="absolute inset-y-0 bg-white"
            style={{ width: `${100 / items.length}%` }}
            animate={{ left: `${(index / items.length) * 100}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  )
}
