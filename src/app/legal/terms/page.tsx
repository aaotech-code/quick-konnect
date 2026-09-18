import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/marketplace/LegalLayout';

export const metadata = {
  title: 'Terms of Service - Quick-Konnect',
  description: 'The rules that govern your use of Quick-Konnect, Nigeria trust-focused marketplace for local services.',
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="These terms are a legal agreement between you and Quick-Konnect. By creating an account or using the platform, you agree to them."
      lastUpdated="16 September 2026"
    >
      <LegalSection title="1. Who we are">
        <p>
          Quick-Konnect (the platform, we, our, us) is a marketplace that
          connects people and businesses who need services with independent
          providers who offer those services. We operate at quick-konnect.com
          and are reachable at support@quick-konnect.com.
        </p>
        <p>
          We are a <strong className="text-white/85">marketplace only</strong>.
          We are not a party to any agreement between a customer and a provider.
          We do not perform the services ourselves. We do not employ providers.
          We do not act as an agent for either side.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          To use Quick-Konnect you must be at least 18 years old and legally
          able to enter into binding contracts. If you use the platform on
          behalf of a company or other legal entity, you confirm that you have
          authority to bind that entity to these terms.
        </p>
        <p>
          We may refuse, suspend, or terminate access at any time if we
          reasonably believe these terms are being breached, or if we are
          required to by law.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You are responsible for keeping your login credentials secure. Do not
          share your password. Do not let anyone else use your account. If you
          suspect unauthorised access, notify us immediately at
          support@quick-konnect.com.
        </p>
        <p>
          You agree that the information you provide is accurate and current.
          Impersonating another person, using a false identity, or creating
          accounts to evade suspension is prohibited.
        </p>
      </LegalSection>

      <LegalSection title="4. The role of Quick-Konnect">
        <p>
          When you post a job, we show it to providers who offer matching
          services in matching locations. When a provider sends a quote, we
          display it to you. When you accept a quote, we create a job record
          that both of you can see.
        </p>
        <p>
          <strong className="text-white/85">We do not guarantee</strong> the
          quality, safety, legality, or timeliness of any service. We do not
          guarantee that a provider will respond to your request, or that a
          customer will hire after receiving your quote. We do not guarantee
          that a specific provider will show up, though we do take specific
          steps (see our Face Verification process) to reduce the risk of
          misrepresentation.
        </p>
        <p>
          Verification badges (Phone Verified, Face Verified, Business Verified,
          Address Verified) describe what we checked, when we checked it, and
          nothing more. A badge is not an endorsement of quality, and it does
          not replace your own judgment.
        </p>
      </LegalSection>

      <LegalSection title="5. Payment">
        <p>
          Right now, all payment is arranged{' '}
          <strong className="text-white/85">directly between you and the
          provider</strong>. Cash, bank transfer, or whatever you agree is fine.
          Quick-Konnect does not process, hold, or release payment at this time.
        </p>
        <p>
          Quick-Konnect charges <strong className="text-white/85">no
          commission and no fee</strong> to use the platform. Posting jobs is
          free. Sending quotes is free. Hiring is free.
        </p>
        <p>
          If we ever introduce paid features, they will be optional, clearly
          labeled, and announced in advance. Nothing in these terms entitles us
          to a percentage of any payment made directly between you and a
          provider.
        </p>
        <p>
          Optional in-platform payment protection is planned. When it launches,
          it will be governed by a separate Payment and Escrow Terms document
          which will be published before activation. It will be optional.
        </p>
      </LegalSection>

      <LegalSection title="6. Reviews">
        <p>
          Only a customer who has completed a job with a provider may leave a
          review for that provider. We enforce this in code, not policy.
        </p>
        <p>
          You agree not to leave reviews that are false, defamatory, abusive,
          discriminatory, or unrelated to the service. We may remove reviews
          that breach this rule. We do not remove reviews merely because they
          are negative.
        </p>
        <p>
          Providers may respond to reviews once. Responses must follow the same
          rules.
        </p>
      </LegalSection>

      <LegalSection title="7. What you may not do">
        <p>While using Quick-Konnect you agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Post false information about yourself, your business, or your services.</li>
          <li>Impersonate another person or misrepresent your affiliation with anyone.</li>
          <li>Solicit payments from anyone in a way that could reasonably be considered fraud.</li>
          <li>Post content that is unlawful, defamatory, obscene, or that infringes the rights of others.</li>
          <li>Attempt to circumvent the platform to avoid good-faith reporting of problems.</li>
          <li>Use bots, scrapers, or automated tools to harvest data.</li>
          <li>Attempt to interfere with the security or operation of the platform.</li>
          <li>Use the platform to sell or offer illegal services.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Your content">
        <p>
          You keep ownership of content you upload (photos, descriptions,
          portfolio work, messages). By uploading it, you grant Quick-Konnect a
          non-exclusive, worldwide, royalty-free license to display, store,
          and reproduce that content <strong className="text-white/85">solely
          for the purpose of operating the platform</strong> — showing your
          profile to customers, showing portfolio photos on your profile,
          showing reviews on the relevant job page, and similar.
        </p>
        <p>
          You confirm that you have the right to upload what you upload, and
          that your content does not infringe anyone else&apos;s copyright,
          trademark, or privacy.
        </p>
      </LegalSection>

      <LegalSection title="9. Face Verified providers">
        <p>
          Providers who carry the Face Verified badge have submitted a photo of
          a government-issued ID and a selfie holding that ID. Our team has
          compared these against the provider photo on file to confirm they
          match.
        </p>
        <p>
          If you hire a Face Verified provider and someone else shows up to do
          the work, <strong className="text-white/85">open a dispute
          immediately</strong>. The provider loses the Face Verified badge
          permanently. This is written into the Provider Terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Quick-Konnect is not liable
          for indirect, incidental, special, consequential, or punitive
          damages arising from your use of the platform or from any services
          arranged through it. This includes, without limitation, lost profits,
          lost work, damage to property, or harm to reputation.
        </p>
        <p>
          Nothing in these terms excludes or limits our liability for fraud,
          death or personal injury caused by our negligence, or any liability
          that Nigerian law does not allow to be excluded or limited.
        </p>
      </LegalSection>

      <LegalSection title="11. Suspension and termination">
        <p>
          We may suspend or terminate an account for breach of these terms,
          for confirmed fraud, for repeated disputes, or for behaviour that
          endangers the trust of other users. Where reasonable, we will give
          notice and a chance to respond.
        </p>
        <p>
          You may close your account at any time by contacting
          support@quick-konnect.com. Closing your account does not cancel
          agreements you already made with a provider or customer through the
          platform.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          We may update these terms from time to time. When we make material
          changes, we will post the updated version here with a new &quot;last
          updated&quot; date, and where practical, notify you by email or
          through the platform before the changes take effect.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law and jurisdiction">
        <p>
          These terms are governed by the laws of the Federal Republic of
          Nigeria. Any dispute arising from these terms or from your use of
          the platform will be subject to the exclusive jurisdiction of the
          courts of the Federal Republic of Nigeria.
        </p>
      </LegalSection>

      <LegalSection title="14. Complaints and escalation">
        <p>
          If you have a complaint about how Quick-Konnect has handled something,
          start with our Dispute Policy. If we cannot resolve it, you may
          escalate to the Federal Competition and Consumer Protection
          Commission (FCCPC) through their complaint portal at{' '}
          <a href="https://fccpc.gov.ng" target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
            fccpc.gov.ng
          </a>.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>
          Questions about these terms? Email{' '}
          <strong className="text-white/85">support@quick-konnect.com</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
