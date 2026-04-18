import Header from './components/Header'
import Footer from './components/Footer'

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    <div className="text-sm leading-7 text-slate-600 space-y-2">{children}</div>
  </div>
)

export default function TermsApp() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: April 2026</p>
        </div>

        <div className="space-y-10 divide-y divide-slate-100">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using PrompTool ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </Section>

          <div className="pt-10">
            <Section title="2. Description of Service">
              <p>PrompTool is an educational platform designed to help users improve their AI prompt-writing skills. Users are presented with AI-generated images and challenged to reconstruct the original prompt as accurately as possible.</p>
              <p>The Service includes user profiles, a global leaderboard, daily and random challenges, and AI-powered feedback.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="3. Acceptable Use">
              <p>You agree to use the Service only for its intended educational purpose. You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use automated tools, bots, or scripts to submit prompts or manipulate scores.</li>
                <li>Attempt to reverse-engineer, scrape, or extract data from the Service.</li>
                <li>Submit prompts containing offensive, harmful, or illegal content.</li>
                <li>Impersonate other users or create misleading profiles.</li>
                <li>Interfere with the integrity of the leaderboard or scoring system.</li>
              </ul>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="4. User Accounts">
              <p>You are responsible for maintaining the confidentiality of your account credentials. You are solely responsible for all activity that occurs under your account.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms without prior notice.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="5. Intellectual Property">
              <p>All content on PrompTool — including images, UI design, and code — is the property of the PrompTool Team unless otherwise stated. You may not reproduce or distribute any part of the Service without explicit written permission.</p>
              <p>Prompts submitted by users remain the property of the user, but by submitting them you grant PrompTool a non-exclusive license to store and display them within the platform.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="6. Scores and Rankings">
              <p>Scores are calculated algorithmically based on prompt similarity and timing. The PrompTool Team reserves the right to adjust scoring algorithms at any time.</p>
              <p>Any attempt to artificially inflate scores or manipulate rankings will result in immediate account suspension.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="7. Disclaimer of Warranties">
              <p>The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted availability, accuracy of AI feedback, or fitness for any particular purpose.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="8. Limitation of Liability">
              <p>To the fullest extent permitted by law, the PrompTool Team shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="9. Changes to Terms">
              <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
            </Section>
          </div>

          <div className="pt-10">
            <Section title="10. Contact">
              <p>For questions about these Terms, reach out to the team via LinkedIn:</p>
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
