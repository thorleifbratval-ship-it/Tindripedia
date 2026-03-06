import { useState } from 'react'
import Onboarding from './components/Onboarding'
import SwipeDeck from './components/SwipeDeck'
import { isOnboarded, setOnboarded, setLanguage, setTopics } from './utils/storage'

export default function App() {
  const [onboarded, setOnboardedState] = useState(isOnboarded())

  function handleOnboardingComplete(language, topics) {
    setLanguage(language)
    setTopics(topics)
    setOnboarded(true)
    setOnboardedState(true)
  }

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return <SwipeDeck />
}
