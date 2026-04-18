import Header from './components/Header'
import Footer from './components/Footer'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <div className="text-sm leading-7 text-slate-600 space-y-2">{children}</div>
  </div>
)

export default function PrivacyApp() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 divide-y divide-slate-100">
          <Section title="1. Information We Collect">
            <p>When you use PrompTool, we collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> email address, display name, username, and profile photo (if provided).</li>
              <li><strong>Usage data:</strong> prompts submitted, scores obtained, timestamps, and game mode.</li>
              <li><strong>Authentication data:</strong> managed securely by Supabase Auth (Google OAuth or email/password).</li>
            </ul>
            <p>We do not collect payment information, location data, or any sensitive personal data.</p>
          </Section>

          <div className="pt-10">
            <Section title="2. How We Use Your Information">
              <p>We use collected data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and improve the Service.</li>
                <li>Calculate and display scores, statistics, and rankings.</li>
                <li>Maintain your profile and activity history.</li>
                <li>Detect and prevent abuse or fraudulent activity.</li>
              </ul>
              <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="3. Data Storage">
              <p>Your data is stored securely using <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Supabase</a>, which provides encrypted storage and Row Level Security (RLS) to ensure only you can access your private data.</p>
              <p>Profile photos are stored in Supabase Storage with public read access limited to your avatar URL.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="4. Public Information">
              <p>The following information is publicly visible on your profile:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Display name and username.</li>
                <li>Profile photo and bio.</li>
                <li>Aggregate statistics (average score, best score, total attempts, streak).</li>
                <li>Medals earned.</li>
              </ul>
              <p>Your email address is private by default. You can choose to make it visible in your profile settings.</p>
              <p>The specific prompts you submitted are only visible to you and platform administrators.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="5. Third-Party Services">
              <p>PrompTool uses the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
                <li><strong>Groq API</strong> — AI-powered prompt analysis (prompts are sent to Groq for scoring; they are not stored by Groq beyond the request).</li>
                <li><strong>Google OAuth</strong> — optional sign-in method.</li>
              </ul>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="6. Data Retention">
              <p>Your data is retained for as long as your account is active. You may request deletion of your account and associated data by contacting us directly.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="7. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access the personal data we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your account and data.</li>
                <li>Export your data (available through your profile).</li>
              </ul>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="8. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="9. Contact">
              <p>For privacy-related questions or data requests, contact us via LinkedIn:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><a href="https://www.linkedin.com/in/theotrosman/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Theo Trosman</a></li>
                <li><a href="https://www.linkedin.com/in/felipe-beckford/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Felipe Beckford</a></li>
              </ul>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
