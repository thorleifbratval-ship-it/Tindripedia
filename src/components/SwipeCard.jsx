import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState, useRef, useImperativeHandle, forwardRef } from 'react'

const SwipeCard = forwardRef(function SwipeCard({ article, onSwipe, onTap, isTop, dragX }, ref) {
  const ownX = useMotionValue(0)
  const x = isTop ? ownX : useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])
  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0])

  // Background card reacts to the top card's drag position
  const bgScale = useTransform(dragX || ownX, [-200, 0, 200], [1, 0.95, 1])
  const bgY = useTransform(dragX || ownX, [-200, 0, 200], [0, 8, 0])
  const bgOpacity = useTransform(dragX || ownX, [-200, 0, 200], [1, 0.6, 1])

  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  function flyOut(direction) {
    if (exiting) return
    setExiting(true)
    const flyX = direction === 'right' ? 500 : -500
    animate(x, flyX, {
      type: 'spring',
      stiffness: 600,
      damping: 40,
      onComplete: () => onSwipe(direction),
    })
  }

  useImperativeHandle(ref, () => ({ flyOut, x: ownX }))

  function handleDragStart(_, info) {
    setDragging(true)
    dragStartRef.current = { x: info.point.x, y: info.point.y }
  }

  function handleDragEnd(_, info) {
    setDragging(false)
    if (exiting) return
    const swipeThreshold = 80
    const velocityThreshold = 300

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      flyOut('right')
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      flyOut('left')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
    }
  }

  function handleTap(e) {
    if (!dragging && !exiting) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x)
      const dy = Math.abs(e.clientY - dragStartRef.current.y)
      if (dx < 5 && dy < 5) {
        onTap(article)
      }
    }
  }

  if (!article) return null

  // Top card: controlled by drag
  if (isTop) {
    return (
      <motion.div
        className="absolute w-full h-full"
        style={{ x, rotate, zIndex: 10 }}
        drag={!exiting ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
      >
        <CardContent
          article={article}
          onTap={handleTap}
          onRead={onTap}
          exiting={exiting}
          likeOpacity={likeOpacity}
          dislikeOpacity={dislikeOpacity}
          showOverlays
        />
      </motion.div>
    )
  }

  // Background card: reacts to top card's drag
  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ scale: bgScale, y: bgY, opacity: bgOpacity, zIndex: 1 }}
    >
      <CardContent article={article} onTap={() => {}} onRead={() => {}} />
    </motion.div>
  )
})

function CardContent({ article, onTap, onRead, exiting, likeOpacity, dislikeOpacity, showOverlays }) {
  return (
    <div
      onPointerUp={onTap}
      className="w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl cursor-pointer select-none flex flex-col"
    >
      <div className="relative h-[55%] bg-gray-200 overflow-hidden flex-shrink-0">
        {article.thumbnail || article.originalimage ? (
          <img
            src={article.originalimage || article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark/80 to-darker/90">
            <span className="text-8xl opacity-40">📖</span>
          </div>
        )}

        {showOverlays && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute inset-0 bg-like/20 flex items-center justify-center pointer-events-none"
            >
              <span className="text-6xl font-black text-like border-4 border-like rounded-xl px-4 py-1 rotate-[-15deg]">
                LIKE
              </span>
            </motion.div>
            <motion.div
              style={{ opacity: dislikeOpacity }}
              className="absolute inset-0 bg-dislike/20 flex items-center justify-center pointer-events-none"
            >
              <span className="text-6xl font-black text-dislike border-4 border-dislike rounded-xl px-4 py-1 rotate-[15deg]">
                NOPE
              </span>
            </motion.div>
          </>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col overflow-hidden">
        <h2 className="text-xl font-bold text-text mb-2 leading-tight">
          {article.title}
        </h2>
        <p className="text-text-light text-sm leading-relaxed line-clamp-4 flex-1">
          {article.description}
        </p>
        <button
          className="mt-3 w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-base tracking-wide hover:bg-secondary-dark transition-colors"
          onPointerUp={(e) => {
            e.stopPropagation()
            if (!exiting) onRead(article)
          }}
        >
          LES
        </button>
      </div>
    </div>
  )
}

export default SwipeCard
