import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Chayo AI',
  description: 'Privacy Policy for Chayo AI - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Chayo AI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our AI business automation platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• Name and email address when you create an account</li>
                <li>• Profile information and business details</li>
                <li>• Payment information (processed securely through Stripe)</li>
                <li>• Communication preferences and settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Data</h3>
              <ul className="text-gray-700 space-y-2 mb-4">
                <li>• How you interact with our platform and AI agents</li>
                <li>• Conversation logs and chat history for service improvement</li>
                <li>• Technical data like IP address, browser type, and device information</li>
                <li>• Analytics data to improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="text-gray-700 space-y-2">
                <li>• Provide and maintain our AI automation services</li>
                <li>• Process payments and manage your subscription</li>
                <li>• Improve and personalize your experience</li>
                <li>• Send important updates and service notifications</li>
                <li>• Provide customer support and respond to inquiries</li>
                <li>• Ensure platform security and prevent fraud</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your data only in the following circumstances:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• With trusted service providers who help us operate our platform (like Stripe for payments)</li>
                <li>• When required by law or to protect our rights and safety</li>
                <li>• In connection with a business transfer or acquisition</li>
                <li>• With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Encryption of data in transit and at rest</li>
                <li>• Secure authentication and access controls</li>
                <li>• Regular security audits and monitoring</li>
                <li>• Compliance with SOC 2 and other security standards</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Access your personal information</li>
                <li>• Correct inaccurate or incomplete data</li>
                <li>• Delete your account and associated data</li>
                <li>• Export your data in a portable format</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Object to certain data processing activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience and analyze platform usage. 
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your data may be processed in countries other than your residence. We ensure appropriate safeguards 
                are in place to protect your information in accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our services are not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If you believe a child has provided us with personal 
                information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this privacy policy from time to time. We will notify you of any material 
                changes by posting the new policy on our website and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Email:</strong> privacy@chayo.ai</li>
                  <li><strong>Address:</strong> Chayo AI, Privacy Team</li>
                  <li><strong>Website:</strong> <a href="https://chayo.ai" className="text-purple-600 hover:text-purple-700">https://chayo.ai</a></li>
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
                ← Back to Home
              </a>
              <p className="text-sm text-gray-500">
                Effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
