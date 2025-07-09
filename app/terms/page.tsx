import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Chayo AI',
  description: 'Terms of Service for Chayo AI - Read our terms and conditions for using our AI business automation platform.',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using Chayo AI ("the Service"), you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Chayo AI is an AI-powered business automation platform that provides intelligent chatbots, customer service 
                automation, and business process management tools. Our service helps businesses automate customer interactions 
                across multiple channels including WhatsApp, Instagram, Facebook, and websites.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
              <ul className="text-gray-700 space-y-2">
                <li>• You must be at least 18 years old to use this service</li>
                <li>• You are responsible for maintaining the security of your account</li>
                <li>• You must provide accurate and complete information when creating an account</li>
                <li>• You are responsible for all activities that occur under your account</li>
                <li>• You must notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to use the Service to:</p>
              <ul className="text-gray-700 space-y-2">
                <li>• Violate any laws or regulations</li>
                <li>• Harass, abuse, or harm others</li>
                <li>• Send spam or unsolicited communications</li>
                <li>• Distribute malware or harmful code</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Attempt to gain unauthorized access to our systems</li>
                <li>• Use the service for illegal or fraudulent activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription and Billing</h2>
              <ul className="text-gray-700 space-y-2">
                <li>• Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>• All fees are non-refundable except as required by law</li>
                <li>• We may change our pricing with 30 days notice</li>
                <li>• Your subscription will automatically renew unless cancelled</li>
                <li>• You may cancel your subscription at any time from your account settings</li>
                <li>• Payment processing is handled securely through Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by Chayo AI and are protected 
                by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• You retain ownership of content you create using our platform</li>
                <li>• You grant us a license to use your content to provide the service</li>
                <li>• You may not copy, modify, or distribute our proprietary technology</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy and Data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices regarding your personal data.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• We collect and process data as described in our Privacy Policy</li>
                <li>• You are responsible for ensuring compliance with data protection laws</li>
                <li>• We implement security measures to protect your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to maintain high service availability but cannot guarantee 100% uptime. We may:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• Perform scheduled maintenance with advance notice</li>
                <li>• Experience temporary outages due to technical issues</li>
                <li>• Update or modify features to improve the service</li>
                <li>• Suspend access for maintenance or security reasons</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, Chayo AI shall not be liable for any indirect, incidental, special, 
                or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service at our sole discretion, without prior 
                notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• You may terminate your account at any time</li>
                <li>• Upon termination, your access to the Service will cease</li>
                <li>• We may retain certain data as required by law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where 
                Chayo AI is incorporated, without regard to its conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. We will provide notice of material changes by 
                posting the updated terms on our website and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Email:</strong> legal@chayo.ai</li>
                  <li><strong>Address:</strong> Chayo AI, Legal Department</li>
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
