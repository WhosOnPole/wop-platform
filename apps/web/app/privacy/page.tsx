import { Metadata } from 'next'
import { PageBackButton } from '@/components/page-back-button'

export const metadata: Metadata = {
  title: 'Privacy Policy | Who\'s on Pole?',
  description: 'Privacy Policy for Whosonpole, LLC.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <PageBackButton variant="dark" />
      </div>
      <h1 className="text-4xl font-bold mb-2 text-center">Whosonpole, LLC – Privacy Policy</h1>
      <p className="text-sm text-gray-500 text-center mb-12">Last Updated: March 1, 2026</p>

      <div className="max-w-4xl mx-auto prose prose-lg prose-invert">
        <p className="mb-6">
          Whosonpole, LLC (&quot;Whosonpole,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy.
        </p>
        <p className="mb-6">
          This Privacy Policy explains how we collect, use, and protect information when you use the Whosonpole website and platform (the &quot;Platform&quot;).
        </p>
        <p className="mb-8">
          If you do not agree with this Policy, please do not use the Platform.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">1. Who We Are</h2>
        <p className="mb-2">Whosonpole, LLC</p>
        <p className="mb-2">Atlanta, Georgia, United States</p>
        <p className="mb-4">Email: <a href="mailto:team@whosonpole.org" className="text-blue-400 hover:underline">team@whosonpole.org</a></p>
        <p className="mb-8">
          Who&apos;s on Pole is an independent motorsport fan platform and is not affiliated with Formula One Management Ltd., the FIA, or any motorsport teams or sponsors.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">2. Eligibility</h2>
        <p className="mb-4">The Platform is intended for users 13 years of age or older.</p>
        <ul className="list-disc list-inside mb-4">
          <li>We do not knowingly collect personal information from children under 13.</li>
          <li>If we learn that a user under 13 has created an account, we will delete the account.</li>
          <li>If you are under 18, you should use the Platform with parental or guardian involvement, particularly for any payments.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">3. Information We Collect</h2>
        <p className="mb-6">We collect only the information necessary to operate the Platform.</p>

        <h3 className="text-xl font-semibold mb-2">A. Information You Provide</h3>
        <p className="mb-2">When creating a profile, we collect:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Username</li>
          <li>Date of birth</li>
          <li>Optional: City, State, Country</li>
          <li>Optional: Links to your social media accounts</li>
        </ul>
        <p className="mb-4">We do not require email address registration.</p>
        <p className="mb-6">If you contact us directly, we collect the information you include in your message.</p>

        <h3 className="text-xl font-semibold mb-2">B. Authentication Information</h3>
        <p className="mb-2">You log in using third-party authentication providers (such as Google, Apple, TikTok, or Instagram).</p>
        <ul className="list-disc list-inside mb-4">
          <li>We receive basic profile information from those providers as permitted by their policies.</li>
          <li>We do not collect or store your third-party account passwords.</li>
        </ul>

        <h3 className="text-xl font-semibold mb-2">C. Payment Information</h3>
        <p className="mb-2">Community Support Contributions are processed by third-party providers such as Stripe or PayPal.</p>
        <p className="mb-2">We:</p>
        <ul className="list-disc list-inside mb-4">
          <li>do not collect credit card numbers;</li>
          <li>do not store financial account information;</li>
          <li>do not control third-party payment processing practices.</li>
        </ul>
        <p className="mb-6">Payment providers may collect personal and financial information directly from you according to their own privacy policies.</p>

        <h3 className="text-xl font-semibold mb-2">D. Technical Information</h3>
        <p className="mb-2">For security and platform protection, we collect:</p>
        <ul className="list-disc list-inside mb-4">
          <li>IP address (stored only in a limited rate-limiting table for authentication protection)</li>
          <li>Browser type</li>
          <li>Device information</li>
          <li>Basic usage data</li>
        </ul>
        <p className="mb-6">IP addresses are not used for tracking or marketing and are not stored beyond security necessity.</p>

        <h3 className="text-xl font-semibold mb-2">E. Cookies</h3>
        <p className="mb-2">We use cookies and similar technologies to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>maintain login sessions;</li>
          <li>support security;</li>
          <li>improve performance;</li>
          <li>analyze platform functionality.</li>
        </ul>
        <p className="mb-4">We do not use cookies to sell data or track users across unrelated websites.</p>
        <p className="mb-6">You may control cookies through your browser settings.</p>

        <h3 className="text-xl font-semibold mb-2">F. Analytics</h3>
        <p className="mb-2">We use limited performance analytics (such as Vercel analytics) to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>monitor speed;</li>
          <li>improve technical performance;</li>
          <li>understand general usage trends.</li>
        </ul>
        <p className="mb-8">We do not use invasive behavioral profiling.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">4. How We Use Information</h2>
        <p className="mb-2">We use collected information to:</p>
        <ul className="list-disc list-inside mb-8">
          <li>operate and maintain the Platform;</li>
          <li>authenticate users;</li>
          <li>process Community Support Contributions;</li>
          <li>improve platform features;</li>
          <li>moderate content;</li>
          <li>enforce our Terms of Service;</li>
          <li>communicate with users when necessary;</li>
          <li>promote User Content as permitted under our Terms.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">5. User Content</h2>
        <p className="mb-4">Content you post on the Platform may be publicly visible.</p>
        <p className="mb-8">
          As outlined in our Terms of Service, by submitting content you grant Whosonpole a license to use that content in connection with operating and promoting the Platform, including on social media channels.
        </p>

        <h2 className="text-2xl font-bold mb-4 mt-8">6. Data Sharing</h2>
        <p className="mb-4">We do not sell your personal information.</p>
        <p className="mb-2">We may share information with:</p>
        <ul className="list-disc list-inside mb-4">
          <li>payment processors (Stripe, PayPal);</li>
          <li>authentication providers;</li>
          <li>hosting providers;</li>
          <li>analytics services;</li>
          <li>legal authorities if required by law;</li>
          <li>service providers assisting with platform operation.</li>
        </ul>
        <p className="mb-8">All third-party providers are responsible for their own privacy practices.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">7. International Users</h2>
        <p className="mb-4">The Platform is operated from the United States.</p>
        <p className="mb-4">If you access the Platform from outside the United States, your information may be transferred to and processed in the United States.</p>
        <p className="mb-4">By using the Platform, you consent to this transfer.</p>
        <p className="mb-2">Where required by applicable law (including GDPR), users may have rights to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>access their personal information;</li>
          <li>request correction;</li>
          <li>request deletion;</li>
          <li>restrict processing;</li>
          <li>object to certain uses.</li>
        </ul>
        <p className="mb-8">To exercise these rights, contact: <a href="mailto:team@whosonpole.org" className="text-blue-400 hover:underline">team@whosonpole.org</a></p>

        <h2 className="text-2xl font-bold mb-4 mt-8">8. Data Retention</h2>
        <p className="mb-2">We retain information only as long as necessary to:</p>
        <ul className="list-disc list-inside mb-4">
          <li>maintain user accounts;</li>
          <li>comply with legal obligations;</li>
          <li>resolve disputes;</li>
          <li>enforce agreements.</li>
        </ul>
        <p className="mb-8">Users may request account deletion by contacting <a href="mailto:team@whosonpole.org" className="text-blue-400 hover:underline">team@whosonpole.org</a>.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">9. Security</h2>
        <p className="mb-4">We implement reasonable administrative and technical safeguards to protect information.</p>
        <p className="mb-4">However, no system can guarantee absolute security.</p>
        <p className="mb-8">Users are responsible for maintaining the security of their third-party authentication accounts.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">10. Advertising (Future Use)</h2>
        <p className="mb-2">We may introduce advertising features in the future.</p>
        <p className="mb-2">If advertising is implemented:</p>
        <ul className="list-disc list-inside mb-8">
          <li>we will update this Privacy Policy accordingly;</li>
          <li>we will not sell personal information;</li>
          <li>we will disclose material changes to data use.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-4 mt-8">11. Third-Party Links</h2>
        <p className="mb-4">The Platform may contain links to external websites.</p>
        <p className="mb-8">We are not responsible for the privacy practices of third-party sites.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">12. Changes to This Policy</h2>
        <p className="mb-4">We may update this Privacy Policy periodically.</p>
        <p className="mb-4">Changes will be posted with an updated &quot;Last Updated&quot; date.</p>
        <p className="mb-8">Continued use of the Platform after changes constitutes acceptance.</p>

        <h2 className="text-2xl font-bold mb-4 mt-8">13. Contact Us</h2>
        <p className="mb-2">Whosonpole, LLC</p>
        <p className="mb-2">Atlanta, Georgia, United States</p>
        <p className="mb-8">Email: <a href="mailto:team@whosonpole.org" className="text-blue-400 hover:underline">team@whosonpole.org</a></p>
      </div>
    </div>
  )
}
