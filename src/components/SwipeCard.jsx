import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'

export default function SwipeCard({ article, onSwipe, onTap, isTop }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0])
  const [dragging, setDragging] = useState(false)

  function handleDragEnd(_, info) {
    setDragging(false)
    const threshold = 100
    if (info.offset.x > threshold) {
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      onSwipe('left')
    }
  }

  function handleTap() {
    if (!dragging) {
      onTap(article)
    }
  }

  if (!article) return null

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{ x, rotate, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 0, opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div
        onClick={handleTap}
        className="w-full h-full rounded-3xl overflow-hidden bg-card shadow-2xl cursor-pointer select-none flex flex-col"
      >
        {/* Image section */}
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

          {/* Like/Dislike overlays */}
          {isTop && (
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

        {/* Content section */}
        <div className="flex-1 p-5 flex flex-col overflow-hidden">
          <h2 className="text-xl font-bold text-text mb-2 leading-tight">
            {article.title}
          </h2>
          <p className="text-text-light text-sm leading-relaxed line-clamp-4 flex-1">
            {article.description}
          </p>
          <button
            className="mt-3 w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-base tracking-wide hover:bg-secondary-dark transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onTap(article)
            }}
          >
            LES
          </button>
        </div>
      </div>
    </motion.div>
  )
}
