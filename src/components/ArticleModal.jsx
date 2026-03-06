import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { getLanguage } from '../utils/storage'

export default function ArticleModal({ article, onClose }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageTitle, setPageTitle] = useState(article?.title || '')
  const [history, setHistory] = useState([])
  const contentRef = useRef(null)

  useEffect(() => {
    if (!article) return
    loadArticle(article.title)
  }, [article])

  async function loadArticle(title) {
    setLoading(true)
    setPageTitle(title)
    if (contentRef.current) contentRef.current.scrollTop = 0

    const lang = getLanguage()
    try {
      // Use the summary + sections approach for clean rendering
      const summaryRes = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      )
      const summary = summaryRes.ok ? await summaryRes.json() : null

      const sectionsRes = await fetch(
        `https://${lang}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|sections|images&format=json&origin=*&mobileformat=true`
      )
      const data = sectionsRes.ok ? await sectionsRes.json() : null

      const parsed = []

      // Add main image
      if (summary?.originalimage?.source) {
        parsed.push({ type: 'image', src: summary.originalimage.source })
      }

      if (data?.parse?.text?.['*']) {
        parsed.push({ type: 'html', content: data.parse.text['*'] })
      } else if (summary?.extract_html) {
        parsed.push({ type: 'html', content: summary.extract_html })
      }

      setSections(parsed)
    } catch (e) {
      setSections([{ type: 'text', content: article.description }])
    }
    setLoading(false)
  }

  function handleLinkClick(e) {
    const link = e.target.closest('a')
    if (!link) return

    e.preventDefault()
    const href = link.getAttribute('href')
    if (!href) return

    // Internal wiki link
    if (href.startsWith('/wiki/')) {
      const newTitle = decodeURIComponent(href.replace('/wiki/', '').replace(/_/g, ' '))
      // Skip special pages
      if (newTitle.includes(':')) return
      setHistory(prev => [...prev, pageTitle])
      loadArticle(newTitle)
    } else if (href.startsWith('http')) {
      // External link - open in new tab
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  function handleBack() {
    if (history.length === 0) {
      onClose()
      return
    }
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    loadArticle(prev)
  }

  if (!article) return null

  const lang = getLanguage()

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
          <div className="flex items-center gap-2 p-3 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-text text-lg flex-shrink-0"
            >
              {history.length > 0 ? '←' : '✕'}
            </button>
            <h2 className="text-base font-bold text-text truncate flex-1">
              {pageTitle}
            </h2>
            <a
              href={`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-sm flex-shrink-0"
              title="Åpne i Wikipedia"
            >
              ↗
            </a>
          </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div onClick={handleLinkClick} className="article-content">
                {sections.map((section, i) => {
                  if (section.type === 'image') {
                    return (
                      <img
                        key={i}
                        src={section.src}
                        alt={pageTitle}
                        className="w-full max-h-64 object-cover"
                      />
                    )
                  }
                  if (section.type === 'html') {
                    return (
                      <div
                        key={i}
                        className="wiki-body px-4 py-3"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    )
                  }
                  return (
                    <p key={i} className="px-4 py-3 text-text leading-relaxed">
                      {section.content}
                    </p>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
