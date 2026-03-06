import { motion, AnimatePresence } from 'framer-motion'
import { getLiked } from '../utils/storage'
import { useState } from 'react'

export default function LikedList({ isOpen, onClose, onSelectArticle }) {
  const liked = getLiked()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-text">
                ❤️ Liked ({liked.length})
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-text font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {liked.length === 0 ? (
                <div className="text-center text-text-light py-12">
                  <p className="text-4xl mb-4">💔</p>
                  <p>No liked articles yet.</p>
                  <p className="text-sm mt-1">Swipe right on articles you enjoy!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...liked].reverse().map((article, i) => (
                    <motion.button
                      key={article.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => {
                        onSelectArticle(article)
                        onClose()
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      {article.thumbnail ? (
                        <img
                          src={article.thumbnail}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          📖
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-text text-sm truncate">
                          {article.title}
                        </h3>
                        <p className="text-xs text-text-light line-clamp-1">
                          {article.description}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
