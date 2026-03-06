const KEYS = {
  LANGUAGE: 'tindripedia_language',
  TOPICS: 'tindripedia_topics',
  ONBOARDED: 'tindripedia_onboarded',
  LIKED: 'tindripedia_liked',
  DISLIKED: 'tindripedia_disliked',
  CATEGORY_WEIGHTS: 'tindripedia_category_weights',
}

function get(key, fallback = null) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch {
    return fallback
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getLanguage() {
  return get(KEYS.LANGUAGE, 'en')
}

export function setLanguage(lang) {
  set(KEYS.LANGUAGE, lang)
}

export function getTopics() {
  return get(KEYS.TOPICS, [])
}

export function setTopics(topics) {
  set(KEYS.TOPICS, topics)
}

export function isOnboarded() {
  return get(KEYS.ONBOARDED, false)
}

export function setOnboarded(val) {
  set(KEYS.ONBOARDED, val)
}

export function getLiked() {
  return get(KEYS.LIKED, [])
}

export function addLiked(article) {
  const liked = getLiked()
  if (!liked.find(a => a.title === article.title)) {
    liked.push({
      title: article.title,
      thumbnail: article.thumbnail,
      description: article.description,
      categories: article.categories || [],
      timestamp: Date.now(),
    })
    set(KEYS.LIKED, liked)
  }
}

export function getDisliked() {
  return get(KEYS.DISLIKED, [])
}

export function addDisliked(title) {
  const disliked = getDisliked()
  if (!disliked.includes(title)) {
    disliked.push(title)
    set(KEYS.DISLIKED, disliked)
  }
}

export function getCategoryWeights() {
  return get(KEYS.CATEGORY_WEIGHTS, {})
}

export function boostCategories(categories) {
  const weights = getCategoryWeights()
  categories.forEach(cat => {
    weights[cat] = (weights[cat] || 0) + 1
  })
  set(KEYS.CATEGORY_WEIGHTS, weights)
}

export function getTopCategories(n = 5) {
  const weights = getCategoryWeights()
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat)
}
