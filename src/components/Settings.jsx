import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLanguage, setLanguage, getTopics, setTopics } from '../utils/storage'

const LANGUAGES = [
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

const TOPICS = [
  { id: 'history', emoji: '🏛️', label: { en: 'History', no: 'Historie', sv: 'Historia', de: 'Geschichte' } },
  { id: 'science', emoji: '🔬', label: { en: 'Science', no: 'Vitenskap', sv: 'Vetenskap', de: 'Wissenschaft' } },
  { id: 'art', emoji: '🎨', label: { en: 'Art', no: 'Kunst', sv: 'Konst', de: 'Kunst' } },
  { id: 'geography', emoji: '🌍', label: { en: 'Geography', no: 'Geografi', sv: 'Geografi', de: 'Geographie' } },
  { id: 'technology', emoji: '💻', label: { en: 'Technology', no: 'Teknologi', sv: 'Teknik', de: 'Technologie' } },
  { id: 'nature', emoji: '🌿', label: { en: 'Nature', no: 'Natur', sv: 'Natur', de: 'Natur' } },
  { id: 'music', emoji: '🎵', label: { en: 'Music', no: 'Musikk', sv: 'Musik', de: 'Musik' } },
  { id: 'sport', emoji: '⚽', label: { en: 'Sport', no: 'Sport', sv: 'Sport', de: 'Sport' } },
  { id: 'philosophy', emoji: '🤔', label: { en: 'Philosophy', no: 'Filosofi', sv: 'Filosofi', de: 'Philosophie' } },
  { id: 'food', emoji: '🍕', label: { en: 'Food', no: 'Mat', sv: 'Mat', de: 'Essen' } },
]

const UI_TEXT = {
  en: { settings: 'Settings', language: 'Language', topics: 'Your interests', selectAtLeast: 'Select at least 2', save: 'Save', saved: 'Saved!', selected: 'selected' },
  no: { settings: 'Innstillinger', language: 'Språk', topics: 'Dine interesser', selectAtLeast: 'Velg minst 2', save: 'Lagre', saved: 'Lagret!', selected: 'valgt' },
  sv: { settings: 'Inställningar', language: 'Språk', topics: 'Dina intressen', selectAtLeast: 'Välj minst 2', save: 'Spara', saved: 'Sparat!', selected: 'valda' },
  de: { settings: 'Einstellungen', language: 'Sprache', topics: 'Deine Interessen', selectAtLeast: 'Wähle mindestens 2', save: 'Speichern', saved: 'Gespeichert!', selected: 'ausgewählt' },
}

export default function Settings({ isOpen, onClose, onSave }) {
  const [selectedLang, setSelectedLang] = useState(getLanguage())
  const [selectedTopics, setSelectedTopics] = useState(getTopics())
  const [saved, setSaved] = useState(false)

  const t = UI_TEXT[selectedLang] || UI_TEXT.en

  function toggleTopic(id) {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function handleSave() {
    if (selectedTopics.length < 2) return
    setLanguage(selectedLang)
    setTopics(selectedTopics)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onSave()
      onClose()
    }, 800)
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 top-10 bg-gradient-to-br from-dark to-darker rounded-t-3xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <h2 className="text-lg font-bold text-white">
                {t.settings}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white font-bold text-xl flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Language */}
              <div>
                <label className="block text-white/70 text-sm mb-2 font-medium">
                  {t.language}
                </label>
                <div className="relative">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full appearance-none bg-white/10 border-2 border-white/20 text-white rounded-xl py-3 px-4 pr-10 text-base font-medium focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code} className="bg-dark text-white">
                        {l.flag} {l.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                    ▾
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="block text-white/70 text-sm mb-1 font-medium">
                  {t.topics}
                </label>
                <p className="text-white/40 text-xs mb-3">
                  {t.selectAtLeast} ({selectedTopics.length} {t.selected})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TOPICS.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`p-2.5 rounded-xl text-left transition-all border-2 ${
                        selectedTopics.includes(topic.id)
                          ? 'bg-white/20 border-secondary text-white'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      <span className="text-lg">{topic.emoji}</span>
                      <span className="font-medium ml-1.5 text-sm">
                        {topic.label[selectedLang] || topic.label.en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={selectedTopics.length < 2}
                className={`w-full font-semibold py-3 rounded-xl text-base transition-all ${
                  saved
                    ? 'bg-secondary text-white'
                    : selectedTopics.length >= 2
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white active:scale-[0.98]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {saved ? t.saved : t.save}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
