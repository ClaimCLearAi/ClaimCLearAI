'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark'
  }, [])

  const toggleTheme = () => {
    const nextDark = !dark
    setDark(nextDark)
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light'
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}>
      <span className="theme-toggle-track" aria-hidden="true"><span className="theme-toggle-thumb" /></span>
      <span>{dark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
