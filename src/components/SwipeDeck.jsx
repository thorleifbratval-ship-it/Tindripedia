import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const loadInitialArticles = useCallback(async () => {
    setLoading(true)
    const topics = getTopics()
    const fetched = await fetchArticlesForTopics(topics, 3)
    setArticles(fetched)
    setCurrentIndex(0)
    setLoading(false)
  }, [])

  const loadMoreArticles = useCallback(async () => {
    const topCats = getTopCategories(5)
    const topics = getTopics()
    const searchTerms = topCats.length > 0 ? topCats : topics

    const more = await fetchRelatedArticles(searchTerms, 5)
    setArticles(prev => {
      const existingTitles = new Set(prev.map(a => a.title))
      const unique = more.filter(a => !existingTitles.has(a.title))
      return unique.length > 0 ? [...prev, ...unique] : prev
    })
  }, [])

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

    setSwipeDirection(direction)

    if (direction === 'right') {
      addLiked(article)
      // Fetch related articles from the liked article's internal links
      // and inject them right after the current position
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
            next.splice(currentIndex + 1, 0, ...unique)
            return next
          })
        }
      } catch (e) {
        // silently continue
      }
    } else {
      addDisliked(article.title)
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 200)
  }

  function handleButtonSwipe(direction) {
    handleSwipe(direction)
  }

  async function handleSurpriseMe() {
    setLoading(true)
    try {
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
      setArticles(newArticles)
      setCurrentIndex(0)
    } catch (e) {
      // silently fail
    }
    setLoading(false)
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
            <AnimatePresence>
              {nextArticle && (
                <SwipeCard
                  key={nextArticle.title + '-next'}
                  article={nextArticle}
                  onSwipe={() => {}}
                  onTap={() => {}}
                  isTop={false}
                />
              )}
              <SwipeCard
                key={currentArticle.title}
                article={currentArticle}
                onSwipe={handleSwipe}
                onTap={setModalArticle}
                isTop={true}
              />
            </AnimatePresence>
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
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSurpriseMe}
            className="w-12 h-12 rounded-full bg-white/10 border-2 border-yellow-400/50 hover:bg-yellow-400/20 flex items-center justify-center transition-colors shadow-lg"
          >
            <span className="text-xl">🎲</span>
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
