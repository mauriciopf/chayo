'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function LanguageSelector() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    // Remove the current locale from the pathname and add the new one
    const pathWithoutLocale = (pathname || '').replace(`/${locale}`, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    
    router.push(newPath)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Language Selector */}
      <div 
        className="md:hidden backdrop-blur-md border-b px-4 py-2"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-secondary)'
        }}
      >
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Language / Idioma
          </div>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 border rounded-lg px-3 py-1.5 text-sm"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              <span className="text-base">{currentLanguage.flag}</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{currentLanguage.code.toUpperCase()}</span>
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-muted)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div 
                className="absolute top-full right-0 mt-1 border rounded-lg shadow-xl min-w-[110px] overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors duration-200 text-sm"
                    style={{
                      backgroundColor: language.code === locale ? 'var(--bg-hover)' : 'transparent',
                      color: language.code === locale ? 'var(--accent-primary)' : 'var(--text-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      if (language.code !== locale) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (language.code !== locale) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span className="text-base">{language.flag}</span>
                    <span className="font-medium">{language.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Language Selector */}
      <div className="hidden md:block absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 backdrop-blur-md border rounded-lg px-3 py-2 shadow-lg transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
          >
            <span className="text-lg">{currentLanguage.flag}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{currentLanguage.code.toUpperCase()}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-muted)' }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div 
              className="absolute top-full right-0 mt-2 border rounded-lg shadow-xl min-w-[130px] overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-200"
                  style={{
                    backgroundColor: language.code === locale ? 'var(--bg-hover)' : 'transparent',
                    color: language.code === locale ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (language.code !== locale) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language.code !== locale) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[50]" 
          onClick={() => setIsOpen(false)}
        />
      )}


    </>
  )
}
