import { motion, AnimatePresence } from 'framer-motion'
import { getLiked, removeLiked, updateLikedCategories } from '../utils/storage'
import { getArticleCategories } from '../utils/wikipedia'
import { useState, useMemo, useEffect, useRef } from 'react'

// Map specific Wikipedia categories to broad general categories
const CATEGORY_MAP = [
  { label: 'Historie', keywords: ['histor', 'krig', 'slag', 'dynasti', 'revolusjon', 'middelalder', 'antikk', 'keiser', 'konge', 'dronning', 'war', 'battle', 'empire', 'ancient', 'medieval', 'century'] },
  { label: 'Geografi', keywords: ['geografi', 'land', 'by ', 'byer', 'øy', 'fjell', 'elv', 'innsjø', 'kontinent', 'region', 'provins', 'fylke', 'kommune', 'hovedstad', 'geography', 'countr', 'city', 'cities', 'island', 'mountain', 'river'] },
  { label: 'Vitenskap', keywords: ['vitenskap', 'forskning', 'fysikk', 'kjemi', 'biologi', 'matematikk', 'astronomi', 'medisin', 'science', 'physics', 'chemistry', 'biology', 'math', 'research', 'teori', 'theory'] },
  { label: 'Teknologi', keywords: ['teknologi', 'data', 'program', 'software', 'internet', 'ingeniør', 'maskin', 'teknisk', 'technology', 'computer', 'digital', 'electronic'] },
  { label: 'Kunst', keywords: ['kunst', 'maleri', 'skulptur', 'arkitektur', 'design', 'museum', 'galleri', 'art', 'paint', 'sculpt', 'architect'] },
  { label: 'Musikk', keywords: ['musikk', 'sang', 'album', 'band', 'artist', 'konsert', 'opera', 'musik', 'music', 'song', 'compos'] },
  { label: 'Litteratur', keywords: ['littera', 'bok', 'bøker', 'roman', 'forfatter', 'dikt', 'poesi', 'book', 'novel', 'author', 'poet', 'liter'] },
  { label: 'Sport', keywords: ['sport', 'fotball', 'olympi', 'mester', 'turnering', 'liga', 'idrett', 'ski', 'svømm', 'løp', 'football', 'soccer', 'athlet', 'championship'] },
  { label: 'Natur', keywords: ['natur', 'dyr', 'plante', 'skog', 'hav', 'klima', 'miljø', 'økologi', 'arter', 'nature', 'animal', 'plant', 'species', 'forest', 'ocean', 'climate'] },
  { label: 'Film & TV', keywords: ['film', 'tv', 'serie', 'regissør', 'skuespill', 'kino', 'movie', 'television', 'actor', 'direct'] },
  { label: 'Mat & Drikke', keywords: ['mat', 'drikke', 'vin', 'øl', 'kokk', 'kjøkken', 'food', 'drink', 'wine', 'beer', 'cuisine', 'culinar'] },
  { label: 'Religion & Filosofi', keywords: ['religion', 'kirke', 'filosofi', 'teolog', 'gud', 'bibel', 'islam', 'buddhis', 'hindu', 'church', 'philos', 'theolog'] },
  { label: 'Politikk', keywords: ['politikk', 'regjering', 'president', 'statsminister', 'parlament', 'demokrat', 'parti', 'politi', 'government', 'president', 'parliament'] },
  { label: 'Samfunn', keywords: ['samfunn', 'kultur', 'tradisjon', 'språk', 'utdann', 'skole', 'univers', 'societ', 'cultur', 'tradition', 'language', 'educat'] },
]

function classifyArticle(categories) {
  if (!categories || categories.length === 0) return null
  const joined = categories.join(' ').toLowerCase()
  for (const { label, keywords } of CATEGORY_MAP) {
    if (keywords.some(kw => joined.includes(kw))) {
      return label
    }
  }
  return null
}

// Filter out Wikipedia meta-categories
function filterCategories(cats) {
  const skip = /^(artikler|sider|pages|articles|all |cs1|commons|webarchive|wiki|bruk av|use |short desc|koordinater|manglende|accuracy|source|dato|webarkiv)/i
  return cats.filter(c => !skip.test(c) && !c.includes('Wikipedia') && !c.includes('Wikidata'))
}

export default function LikedList({ isOpen, onClose, onSelectArticle }) {
  const [liked, setLiked] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [sortBy, setSortBy] = useState('recent')
  const backfillRef = useRef(false)

  // Refresh liked list when panel opens
  if (isOpen && refreshKey === 0) {
    setLiked(getLiked())
    setRefreshKey(1)
    backfillRef.current = false
  }
  if (!isOpen && refreshKey !== 0) {
    setRefreshKey(0)
  }

  // Backfill categories for uncategorized articles
  useEffect(() => {
    if (!isOpen || backfillRef.current) return
    backfillRef.current = true

    const uncategorized = liked.filter(a => !a.categories || a.categories.length === 0)
    if (uncategorized.length === 0) return

    ;(async () => {
      for (const article of uncategorized) {
        try {
          const cats = await getArticleCategories(article.title)
          const filtered = filterCategories(cats)
          if (filtered.length > 0) {
            updateLikedCategories(article.title, filtered)
            setLiked(prev => prev.map(a =>
              a.title === article.title ? { ...a, categories: filtered } : a
            ))
          }
        } catch {
          // Skip on error
        }
      }
    })()
  }, [isOpen, liked.length])

  const grouped = useMemo(() => {
    if (sortBy !== 'category') return null
    const groups = {}
    for (const article of liked) {
      const generalCat = classifyArticle(article.categories) || 'Annet'
      if (!groups[generalCat]) groups[generalCat] = []
      groups[generalCat].push(article)
    }
    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Annet') return 1
      if (b[0] === 'Annet') return -1
      return b[1].length - a[1].length
    })
  }, [liked, sortBy])

  function handleRemove(e, title) {
    e.stopPropagation()
    removeLiked(title)
    setLiked(prev => prev.filter(a => a.title !== title))
  }

  function handleRemoveCategory(category) {
    const articlesInCat = liked.filter(a => (classifyArticle(a.categories) || 'Annet') === category)
    for (const article of articlesInCat) {
      removeLiked(article.title)
    }
    setLiked(prev => prev.filter(a => (classifyArticle(a.categories) || 'Annet') !== category))
  }

  function ArticleRow({ article, onSelect, onRemove }) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
        <button
          onClick={() => onSelect(article)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
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
        </button>
        <button
          onClick={(e) => onRemove(e, article.title)}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center flex-shrink-0 transition-colors text-gray-400 text-sm"
        >
          ✕
        </button>
      </div>
    )
  }

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
                ❤️ Likte
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-text font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Sort tabs */}
            {liked.length > 0 && (
              <div className="flex gap-1 px-4 pt-3 pb-1">
                <button
                  onClick={() => setSortBy('recent')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    sortBy === 'recent'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Nyeste
                </button>
                <button
                  onClick={() => setSortBy('category')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    sortBy === 'category'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Kategorier
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {liked.length === 0 ? (
                <div className="text-center text-text-light py-12">
                  <p className="text-4xl mb-4">💔</p>
                  <p>Ingen likte artikler ennå.</p>
                  <p className="text-sm mt-1">Sveip til høyre på artikler du liker!</p>
                </div>
              ) : sortBy === 'recent' ? (
                <div className="space-y-3">
                  {[...liked].reverse().map((article) => (
                    <ArticleRow
                      key={article.title}
                      article={article}
                      onSelect={(a) => { onSelectArticle(a); onClose() }}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {grouped.map(([category, articles]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {category}
                          <span className="ml-1 text-gray-300">({articles.length})</span>
                        </h3>
                        <button
                          onClick={() => handleRemoveCategory(category)}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                        >
                          Fjern alle
                        </button>
                      </div>
                      <div className="space-y-2">
                        {articles.map((article) => (
                          <ArticleRow
                            key={article.title}
                            article={article}
                            onSelect={(a) => { onSelectArticle(a); onClose() }}
                            onRemove={handleRemove}
                          />
                        ))}
                      </div>
                    </div>
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
