'use client'

import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'

export default function TermsOfService() {
  const t = useTranslations('terms')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('lastUpdated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('agreementToTerms.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('agreementToTerms.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('descriptionOfService.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('descriptionOfService.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('userAccounts.title')}</h2>
              <ul className="text-gray-700 space-y-2">
                {t.raw('userAccounts.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('acceptableUse.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t('acceptableUse.description')}</p>
              <ul className="text-gray-700 space-y-2">
                {t.raw('acceptableUse.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('subscriptionAndBilling.title')}</h2>
              <ul className="text-gray-700 space-y-2">
                {t.raw('subscriptionAndBilling.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('intellectualProperty.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('intellectualProperty.description')}
              </p>
              <ul className="text-gray-700 space-y-2">
                {t.raw('intellectualProperty.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyAndData.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacyAndData.description')}
              </p>
              <ul className="text-gray-700 space-y-2">
                {t.raw('privacyAndData.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('serviceAvailability.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('serviceAvailability.description')}
              </p>
              <ul className="text-gray-700 space-y-2">
                {t.raw('serviceAvailability.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('limitationOfLiability.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('limitationOfLiability.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termination.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('termination.description')}
              </p>
              <ul className="text-gray-700 space-y-2">
                {t.raw('termination.items').map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('governingLaw.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('governingLaw.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('changesToTerms.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('changesToTerms.description')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('contactInformation.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('contactInformation.description')}
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <ul className="text-gray-700 space-y-2">
                  <li><strong>{t('contactInformation.email')}:</strong> legal@chayo.ai</li>
                  <li><strong>{t('contactInformation.address')}:</strong> Chayo AI, Legal Department</li>
                  <li><strong>{t('contactInformation.website')}:</strong> <a href="https://chayo.ai" className="text-purple-600 hover:text-purple-700">https://chayo.ai</a></li>
                </ul>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <a 
                href="/" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                {t('backToHome')}
              </a>
              <p className="text-sm text-gray-500">
                {t('effectiveAsOf')} {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
