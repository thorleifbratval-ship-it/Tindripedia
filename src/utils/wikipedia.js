import { getLanguage, getDisliked } from './storage'

const TOPIC_SEARCH_TERMS = {
  history: { en: 'History', no: 'Historie', sv: 'Historia', de: 'Geschichte' },
  science: { en: 'Science', no: 'Vitenskap', sv: 'Vetenskap', de: 'Wissenschaft' },
  art: { en: 'Art', no: 'Kunst', sv: 'Konst', de: 'Kunst' },
  geography: { en: 'Geography', no: 'Geografi', sv: 'Geografi', de: 'Geographie' },
  technology: { en: 'Technology', no: 'Teknologi', sv: 'Teknik', de: 'Technologie' },
  nature: { en: 'Nature', no: 'Natur', sv: 'Natur', de: 'Natur' },
  music: { en: 'Music', no: 'Musikk', sv: 'Musik', de: 'Musik' },
  sport: { en: 'Sport', no: 'Sport', sv: 'Sport', de: 'Sport' },
  philosophy: { en: 'Philosophy', no: 'Filosofi', sv: 'Filosofi', de: 'Philosophie' },
  food: { en: 'Food', no: 'Mat', sv: 'Mat', de: 'Essen' },
}

function getBaseUrl() {
  const lang = getLanguage()
  return `https://${lang}.wikipedia.org`
}

export async function searchArticles(query, limit = 10) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`

  const res = await fetch(url)
  const data = await res.json()
  return data.query?.search || []
}

export async function getArticleSummary(title) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/api/rest_v1/page/summary/${encodeURIComponent(title)}`

  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

export async function getArticleContent(title) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/api/rest_v1/page/mobile-html/${encodeURIComponent(title)}`

  const res = await fetch(url)
  if (!res.ok) return null
  return res.text()
}

export async function getArticleCategories(title) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=categories&cllimit=20&format=json&origin=*`

  const res = await fetch(url)
  const data = await res.json()
  const pages = data.query?.pages || {}
  const page = Object.values(pages)[0]
  return (page?.categories || []).map(c => c.title.replace(/^[^:]+:/, ''))
}

export async function getArticleLinks(title, limit = 20) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&pllimit=${limit}&plnamespace=0&format=json&origin=*`

  const res = await fetch(url)
  const data = await res.json()
  const pages = data.query?.pages || {}
  const page = Object.values(pages)[0]
  return (page?.links || []).map(l => l.title)
}

export async function fetchRelatedToArticle(articleTitle, count = 3) {
  const disliked = getDisliked()
  const seenTitles = new Set(disliked)
  seenTitles.add(articleTitle)

  try {
    const links = await getArticleLinks(articleTitle, 30)
    // Filter out meta/list pages and shuffle
    const filtered = links
      .filter(t => !t.includes(':') && !seenTitles.has(t))
      .sort(() => Math.random() - 0.5)
      .slice(0, count + 3)

    const articles = []
    for (const title of filtered) {
      if (articles.length >= count) break
      const summary = await getArticleSummary(title)
      if (summary && summary.type === 'standard' && summary.extract && summary.extract.length > 50) {
        articles.push({
          title: summary.title,
          description: summary.extract,
          thumbnail: summary.thumbnail?.source || null,
          originalimage: summary.originalimage?.source || null,
          pageUrl: summary.content_urls?.desktop?.page || '',
          categories: [],
          _relatedTo: articleTitle,
        })
      }
    }
    return articles
  } catch (e) {
    return []
  }
}

export async function getRandomArticles(count = 5) {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=${count}&format=json&origin=*`

  const res = await fetch(url)
  const data = await res.json()
  return data.query?.random || []
}

export async function fetchArticlesForTopics(topics, perTopic = 3) {
  const lang = getLanguage()
  const disliked = getDisliked()
  const seenTitles = new Set(disliked)
  const articles = []

  const shuffled = [...topics].sort(() => Math.random() - 0.5)

  for (const topic of shuffled) {
    const searchTerm = TOPIC_SEARCH_TERMS[topic]?.[lang] || TOPIC_SEARCH_TERMS[topic]?.en || topic
    const results = await searchArticles(searchTerm, perTopic + 5)

    for (const r of results) {
      if (seenTitles.has(r.title) || articles.length >= topics.length * perTopic) continue
      seenTitles.add(r.title)

      const summary = await getArticleSummary(r.title)
      if (summary && summary.type === 'standard' && summary.extract) {
        articles.push({
          title: summary.title,
          description: summary.extract,
          thumbnail: summary.thumbnail?.source || null,
          originalimage: summary.originalimage?.source || null,
          pageUrl: summary.content_urls?.desktop?.page || '',
          categories: [],
        })
        if (articles.filter(a => a._topic === topic).length >= perTopic) break
      }
    }
  }

  return articles.sort(() => Math.random() - 0.5)
}

export async function fetchRelatedArticles(searchTerms, count = 5) {
  const disliked = getDisliked()
  const seenTitles = new Set(disliked)
  const articles = []

  const shuffledTerms = [...searchTerms].sort(() => Math.random() - 0.5)

  for (const term of shuffledTerms) {
    if (articles.length >= count) break
    const results = await searchArticles(term, 5)

    for (const r of results) {
      if (seenTitles.has(r.title) || articles.length >= count) continue
      seenTitles.add(r.title)

      const summary = await getArticleSummary(r.title)
      if (summary && summary.type === 'standard' && summary.extract) {
        articles.push({
          title: summary.title,
          description: summary.extract,
          thumbnail: summary.thumbnail?.source || null,
          originalimage: summary.originalimage?.source || null,
          pageUrl: summary.content_urls?.desktop?.page || '',
          categories: [],
        })
      }
    }
  }

  return articles
}

export { TOPIC_SEARCH_TERMS }
