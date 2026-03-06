import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  en: { welcome: 'Welcome to', subtitle: 'Discover knowledge, one swipe at a time', chooseLang: 'Choose your language', chooseTopics: 'What interests you?', selectAtLeast: 'Select at least 2 topics', next: 'Next', start: 'Start Exploring', selected: 'selected', selectLang: 'Select language...' },
  no: { welcome: 'Velkommen til', subtitle: 'Oppdag kunnskap, ett sveip om gangen', chooseLang: 'Velg ditt språk', chooseTopics: 'Hva interesserer deg?', selectAtLeast: 'Velg minst 2 temaer', next: 'Neste', start: 'Begynn å utforske', selected: 'valgt', selectLang: 'Velg språk...' },
  sv: { welcome: 'Välkommen till', subtitle: 'Upptäck kunskap, ett svep i taget', chooseLang: 'Välj ditt språk', chooseTopics: 'Vad intresserar dig?', selectAtLeast: 'Välj minst 2 ämnen', next: 'Nästa', start: 'Börja utforska', selected: 'valda', selectLang: 'Välj språk...' },
  de: { welcome: 'Willkommen bei', subtitle: 'Entdecke Wissen, ein Wisch nach dem anderen', chooseLang: 'Wähle deine Sprache', chooseTopics: 'Was interessiert dich?', selectAtLeast: 'Wähle mindestens 2 Themen', next: 'Weiter', start: 'Erkunden starten', selected: 'ausgewählt', selectLang: 'Sprache wählen...' },
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [selectedLang, setSelectedLang] = useState(null)
  const [selectedTopics, setSelectedTopics] = useState([])

  const lang = selectedLang || 'en'
  const t = UI_TEXT[lang] || UI_TEXT.en

  function toggleTopic(id) {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function handleComplete() {
    onComplete(selectedLang, selectedTopics)
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-start pt-[10vh] p-4 bg-gradient-to-br from-dark to-darker overflow-auto">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center max-w-md w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-5xl mb-3"
            >
              📚
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {t.welcome}
            </h1>
            <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Tindripedia
            </h2>
            <p className="text-white/60 text-sm mb-6">
              {t.subtitle}
            </p>

            {/* Language dropdown */}
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2 font-medium">
                {t.chooseLang}
              </label>
              <div className="relative max-w-xs mx-auto">
                <select
                  value={selectedLang || ''}
                  onChange={(e) => setSelectedLang(e.target.value || null)}
                  className="w-full appearance-none bg-white/10 border-2 border-white/20 text-white rounded-2xl py-3 px-4 pr-10 text-lg font-medium focus:outline-none focus:border-secondary transition-colors cursor-pointer"
                >
                  <option value="" disabled className="bg-dark text-white/50">
                    {t.selectLang}
                  </option>
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

            <button
              onClick={() => selectedLang && setStep(1)}
              disabled={!selectedLang}
              className={`font-semibold py-3 px-10 rounded-full text-lg transition-all ${
                selectedLang
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {t.next} →
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="text-center max-w-md w-full max-h-dvh overflow-y-auto py-6"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {t.chooseTopics}
            </h2>
            <p className="text-white/50 mb-5 text-sm">
              {t.selectAtLeast} ({selectedTopics.length} {t.selected})
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {TOPICS.map(topic => (
                <motion.button
                  key={topic.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleTopic(topic.id)}
                  className={`p-2.5 rounded-xl text-left transition-all border-2 ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-white/20 border-secondary text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{topic.emoji}</span>
                  <span className="font-medium ml-2 text-sm">
                    {topic.label[lang] || topic.label.en}
                  </span>
                </motion.button>
              ))}
            </div>
            <button
              onClick={handleComplete}
              disabled={selectedTopics.length < 2}
              className={`font-semibold py-3 px-10 rounded-full text-lg transition-all ${
                selectedTopics.length >= 2
                  ? 'bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-lg hover:shadow-xl active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {t.start} 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
