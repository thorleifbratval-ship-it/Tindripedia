import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import SwipeCard from './SwipeCard'
import ArticleModal from './ArticleModal'
import LikedList from './LikedList'
import Settings from './Settings'
import {
  getTopics,
  addLiked,
  addDisliked,
  boostCategories,
  getTopCategories,
  getLiked,
} from '../utils/storage'
import {
  fetchArticlesForTopics,
  fetchRelatedArticles,
  fetchRelatedToArticle,
  getArticleCategories,
  getRandomArticles,
  getArticleSummary,
} from '../utils/wikipedia'

export default function SwipeDeck() {
  const [articles, setArticles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modalArticle, setModalArticle] = useState(null)
  const [showLiked, setShowLiked] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mode, setMode] = useState('personal') // 'personal' | 'random'
  const cardRef = useRef(null)

  const loadRandomArticles = useCallback(async () => {
    setLoading(true)
    try {
      const randoms = await getRandomArticles(8)
      const newArticles = []
      for (const r of randoms) {
        const summary = await getArticleSummary(r.title)
        if (summary && summary.type === 'standard' && summary.extract) {
          newArticles.push({
            title: summary.title,
            description: summary.extract,
            thumbnail: summary.thumbnail?.source || null,
            originalimage: summary.originalimage?.source || null,
            pageUrl: summary.content_urls?.desktop?.page || '',
            categories: [],
          })
        }
      }
      setArticles(newArticles)
      setCurrentIndex(0)
    } catch (e) {
      // silently fail
    }
    setLoading(false)
  }, [])

  const loadInitialArticles = useCallback(async () => {
    setLoading(true)
    const topics = getTopics()
    const fetched = await fetchArticlesForTopics(topics, 3)
    setArticles(fetched)
    setCurrentIndex(0)
    setLoading(false)
  }, [])

  const loadMoreArticles = useCallback(async () => {
    if (mode === 'random') {
      const randoms = await getRandomArticles(5)
      const newArticles = []
      for (const r of randoms) {
        const summary = await getArticleSummary(r.title)
        if (summary && summary.type === 'standard' && summary.extract) {
          newArticles.push({
            title: summary.title,
            description: summary.extract,
            thumbnail: summary.thumbnail?.source || null,
            originalimage: summary.originalimage?.source || null,
            pageUrl: summary.content_urls?.desktop?.page || '',
            categories: [],
          })
        }
      }
      setArticles(prev => {
        const existingTitles = new Set(prev.map(a => a.title))
        const unique = newArticles.filter(a => !existingTitles.has(a.title))
        return unique.length > 0 ? [...prev, ...unique] : prev
      })
      return
    }

    // Mix fresh topic articles with category-based recommendations
    const topics = getTopics()
    const topCats = getTopCategories(5)

    const results = await Promise.all([
      fetchArticlesForTopics(topics, 1),
      topCats.length > 0 ? fetchRelatedArticles(topCats, 3) : Promise.resolve([]),
    ])

    const more = [...results[0], ...results[1]].sort(() => Math.random() - 0.5)

    setArticles(prev => {
      const existingTitles = new Set(prev.map(a => a.title))
      const unique = more.filter(a => !existingTitles.has(a.title))
      return unique.length > 0 ? [...prev, ...unique] : prev
    })
  }, [mode])

  useEffect(() => {
    loadInitialArticles()
  }, [loadInitialArticles])

  useEffect(() => {
    if (articles.length > 0 && currentIndex >= articles.length - 2) {
      loadMoreArticles()
    }
  }, [currentIndex, articles.length, loadMoreArticles])

  async function handleSwipe(direction) {
    const article = articles[currentIndex]
    if (!article) return

    setCurrentIndex(prev => prev + 1)

    if (direction === 'right') {
      addLiked(article)
      try {
        const [cats, related] = await Promise.all([
          getArticleCategories(article.title),
          fetchRelatedToArticle(article.title, 3),
        ])
        if (cats.length > 0) {
          boostCategories(cats)
          article.categories = cats
        }
        if (related.length > 0) {
          setArticles(prev => {
            const existingTitles = new Set(prev.map(a => a.title))
            const unique = related.filter(a => !existingTitles.has(a.title))
            if (unique.length === 0) return prev
            const next = [...prev]
            // Spread related articles out: first one 2-3 cards ahead,
            // rest spaced 2-3 cards apart so it feels like natural discovery
            const basePos = currentIndex + 2
            unique.forEach((article, i) => {
              const offset = i * 3 + Math.floor(Math.random() * 2)
              const insertAt = Math.min(basePos + offset, next.length)
              next.splice(insertAt, 0, article)
            })
            return next
          })
        }
      } catch (e) {
        // silently continue
      }
    } else {
      addDisliked(article.title)
    }
  }

  function handleButtonSwipe(direction) {
    if (cardRef.current) {
      cardRef.current.flyOut(direction)
    }
  }

  function toggleMode() {
    const newMode = mode === 'personal' ? 'random' : 'personal'
    setMode(newMode)
    if (newMode === 'random') {
      loadRandomArticles()
    } else {
      loadInitialArticles()
    }
  }

  const currentArticle = articles[currentIndex]
  const nextArticle = articles[currentIndex + 1]

  return (
    <div className="flex-1 flex flex-col min-h-dvh bg-gradient-to-br from-dark to-darker">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <h1 className="text-xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Tindripedia
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="text-lg">⚙️</span>
          </button>
          <button
            onClick={() => setShowLiked(true)}
            className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <span className="text-lg">❤️</span>
            {getLiked().length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {getLiked().length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-4 pb-2">
        <div className="relative w-full max-w-sm aspect-[3/4.5] max-h-[calc(100dvh-180px)]">
          {loading ? (
            <div className="w-full h-full rounded-3xl bg-white/5 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-3 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white/50">Loading articles...</p>
            </div>
          ) : !currentArticle ? (
            <div className="w-full h-full rounded-3xl bg-white/5 flex flex-col items-center justify-center">
              <span className="text-5xl mb-4">🔄</span>
              <p className="text-white/50 mb-4">No more articles</p>
              <button
                onClick={loadInitialArticles}
                className="bg-gradient-to-r from-secondary to-secondary-dark text-white font-semibold py-2 px-6 rounded-full"
              >
                Load more
              </button>
            </div>
          ) : (
            <>
              {nextArticle && (
                <SwipeCard
                  key={nextArticle.title + '-next'}
                  article={nextArticle}
                  onSwipe={() => {}}
                  onTap={() => {}}
                  isTop={false}
                  dragX={cardRef.current?.x}
                />
              )}
              <SwipeCard
                ref={cardRef}
                key={currentArticle.title}
                article={currentArticle}
                onSwipe={handleSwipe}
                onTap={setModalArticle}
                isTop={true}
              />
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {currentArticle && !loading && (
        <div className="flex items-center justify-center gap-6 pb-6 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('left')}
            className="w-16 h-16 rounded-full bg-white/10 border-2 border-dislike/50 hover:bg-dislike/20 flex items-center justify-center transition-colors shadow-lg"
          >
            <span className="text-3xl text-dislike font-bold">✕</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMode}
            className={`h-10 px-4 rounded-full border-2 flex items-center justify-center transition-colors shadow-lg text-sm font-semibold ${
              mode === 'random'
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300'
                : 'bg-secondary/20 border-secondary/50 text-secondary'
            }`}
          >
            {mode === 'random' ? '🎲 Random' : '✨ Personlig'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonSwipe('right')}
            className="w-16 h-16 rounded-full bg-white/10 border-2 border-like/50 hover:bg-like/20 flex items-center justify-center transition-colors shadow-lg"
          >
            <span className="text-3xl">❤️</span>
          </motion.button>
        </div>
      )}

      {/* Article Modal */}
      {modalArticle && (
        <ArticleModal
          article={modalArticle}
          onClose={() => setModalArticle(null)}
        />
      )}

      {/* Liked List */}
      <LikedList
        isOpen={showLiked}
        onClose={() => setShowLiked(false)}
        onSelectArticle={setModalArticle}
      />

      {/* Settings */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={loadInitialArticles}
      />
    </div>
  )
}
