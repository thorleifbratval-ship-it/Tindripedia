import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getLanguage } from '../utils/storage'

export default function ArticleModal({ article, onClose }) {
  const [htmlContent, setHtmlContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!article) return
    setLoading(true)
    const lang = getLanguage()
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/mobile-html/${encodeURIComponent(article.title)}`

    fetch(url)
      .then(r => r.ok ? r.text() : null)
      .then(html => {
        setHtmlContent(html)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [article])

  if (!article) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-0 top-6 bg-white rounded-t-3xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-lg font-bold text-text truncate flex-1 mr-4">
              {article.title}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-text font-bold text-xl flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : htmlContent ? (
              <iframe
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                      body { font-family: -apple-system, system-ui, sans-serif; padding: 16px; line-height: 1.6; color: #2d3436; }
                      img { max-width: 100%; height: auto; border-radius: 8px; }
                      table { font-size: 14px; overflow-x: auto; display: block; }
                      h1, h2, h3 { color: #1a1a2e; }
                      a { color: #4ecdc4; }
                      .mw-ref, .mf-section-0 .hatnote { display: none; }
                    </style>
                  </head>
                  <body>${htmlContent}</body>
                  </html>
                `}
                className="w-full h-full border-0"
                title={article.title}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="p-6">
                <div className="mb-6">
                  {article.originalimage && (
                    <img
                      src={article.originalimage}
                      alt={article.title}
                      className="w-full rounded-2xl mb-4 max-h-64 object-cover"
                    />
                  )}
                </div>
                <p className="text-text leading-relaxed text-base">
                  {article.description}
                </p>
                {article.pageUrl && (
                  <a
                    href={article.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-6 text-secondary font-semibold hover:underline"
                  >
                    Read on Wikipedia →
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
