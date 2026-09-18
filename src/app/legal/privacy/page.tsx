import { LegalLayout, LegalSection } from '@/components/marketplace/LegalLayout';

export const metadata = {
  title: 'Privacy Policy - Quick-Konnect',
  description: 'How Quick-Konnect collects, uses, shares, and protects your personal data under the Nigeria Data Protection Act 2023.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="This policy explains what personal data we collect, why we collect it, how we protect it, and the rights you have under the Nigeria Data Protection Act 2023 (NDPA)."
      lastUpdated="16 September 2026"
    >
      <LegalSection title="1. Who is the data controller">
        <p>
          Quick-Konnect (the platform, we, our, us) is the data controller for
          personal data processed through the platform at quick-konnect.com.
        </p>
        <p>
          <strong className="text-white/85">Data controller contact:</strong>
          <br />
          Email: support@quick-konnect.com
          <br />
          Business address: available on request
        </p>
        <p>
          This policy is issued under Section 27 of the Nigeria Data Protection
          Act 2023. The NDPA is enforced by the Nigeria Data Protection
          Commission (NDPC).
        </p>
      </LegalSection>

      <LegalSection title="2. What personal data we collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Account data:</strong> name, email
            address, phone number, password hash (we never store your password
            in readable form).
          </li>
          <li>
            <strong className="text-white/85">Profile data (providers):</strong>{' '}
            business name, tagline, description, years of experience, service
            categories, service locations, profile photo, portfolio photos.
          </li>
          <li>
            <strong className="text-white/85">Verification data:</strong> photo
            of a government-issued ID (national identity card, driver&apos;s
            licence, passport, or voter&apos;s card) and a selfie holding that
            ID, submitted voluntarily by providers who choose to apply for Face
            Verified status.
          </li>
          <li>
            <strong className="text-white/85">Job and request data:</strong>{' '}
            titles, descriptions, addresses (kept private until you hire or are
            hired), preferred dates, budgets, and any files you upload.
          </li>
          <li>
            <strong className="text-white/85">Communication data:</strong>{' '}
            messages you send through our in-platform messaging system.
          </li>
          <li>
            <strong className="text-white/85">Technical data:</strong> IP
            address, browser type, device type, and timestamps recorded for
            security and audit purposes.
          </li>
        </ul>
        <p>
          We do not collect payment card details. Payments are arranged directly
          between customers and providers, outside the platform.
        </p>
      </LegalSection>

      <LegalSection title="3. Why we process your data (lawful basis)">
        <p>
          Under Section 25 of the NDPA, we process personal data on the
          following lawful bases:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Performance of a contract</strong>{' '}
            — to create your account, display your profile, deliver your
            messages, and process quotes and jobs.
          </li>
          <li>
            <strong className="text-white/85">Consent</strong> — for optional
            things like submitting verification documents, enabling browser
            notifications, and uploading portfolio work.
          </li>
          <li>
            <strong className="text-white/85">Legal obligation</strong> — for
            example, retaining records required by Nigerian tax and consumer
            protection law.
          </li>
          <li>
            <strong className="text-white/85">Legitimate interests</strong> —
            for security, fraud prevention, and keeping the platform safe. We
            weigh our interests against yours and only process data where our
            interests are proportionate.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How long we keep your data">
        <p>
          We keep your personal data only as long as we reasonably need it, and
          only as long as Nigerian law requires.
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Account and profile data:</strong>{' '}
            for as long as your account is active, and for 90 days after you
            close your account (to allow for disputes).
          </li>
          <li>
            <strong className="text-white/85">Job history, quotes, and
            reviews:</strong> retained while the account is active so that
            reputation is meaningful. Reviews are retained even after the
            customer who wrote them closes their account, but displayed
            without the customer&apos;s name.
          </li>
          <li>
            <strong className="text-white/85">Verification documents:</strong>{' '}
            retained for as long as the provider has a published profile.
            Deleted within 30 days of account closure.
          </li>
          <li>
            <strong className="text-white/85">Audit and security logs:</strong>{' '}
            retained for 2 years, as required by the Cybercrimes Act 2015.
          </li>
          <li>
            <strong className="text-white/85">Messages:</strong> retained while
            the related job or thread is active. Deleted when both parties
            close their accounts.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Who we share your data with">
        <p>We share personal data only in the following circumstances:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Between users of the platform:</strong>{' '}
            providers see the details of a request dispatched to them.
            Customers see a provider&apos;s public profile, which is what the
            provider chose to publish.
          </li>
          <li>
            <strong className="text-white/85">Service providers we use to
            operate the platform:</strong> hosting (Cloudflare), transactional
            email (when enabled), and customer support chat (Chatway). Each
            provider processes data on our instructions.
          </li>
          <li>
            <strong className="text-white/85">Law enforcement and regulators:</strong>{' '}
            when we are legally required to disclose information in response
            to a valid order or request, or when we believe disclosure is
            necessary to prevent harm.
          </li>
        </ul>
        <p>
          We do not sell your personal data. We do not share your data for
          advertising.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights under the NDPA">
        <p>
          Under Sections 34 to 38 of the NDPA, you have the right to:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Access</strong> the personal data
            we hold about you.
          </li>
          <li>
            <strong className="text-white/85">Correct</strong> personal data
            that is inaccurate or incomplete.
          </li>
          <li>
            <strong className="text-white/85">Delete</strong> personal data we
            no longer have a lawful basis to keep.
          </li>
          <li>
            <strong className="text-white/85">Restrict</strong> the processing
            of your data in specific circumstances.
          </li>
          <li>
            <strong className="text-white/85">Withdraw consent</strong> for
            consent-based processing at any time.
          </li>
          <li>
            <strong className="text-white/85">Object</strong> to processing
            based on legitimate interests.
          </li>
          <li>
            <strong className="text-white/85">Data portability</strong> — receive
            a copy of the data you provided in a structured, commonly used
            format.
          </li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <strong className="text-white/85">support@quick-konnect.com</strong>{' '}
          with the subject line &quot;Data Subject Request&quot;. We will
          respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We protect personal data with technical and organisational measures
          appropriate to the risk. These include: encrypted transport (HTTPS),
          hashed passwords (Argon2id), server-side session management with the
          ability to revoke sessions immediately, strict file upload validation,
          access controls on all admin operations, and audit logging of
          sensitive actions.
        </p>
        <p>
          No system is perfectly secure. If we ever become aware of a personal
          data breach that affects your rights, we will notify the NDPC within
          72 hours as required by Section 40 of the NDPA, and we will notify
          you directly where the breach is likely to result in a high risk to
          you.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies and local storage">
        <p>
          We use a single essential session cookie to keep you signed in.
          Without it, the platform cannot function.
        </p>
        <p>
          We use your browser&apos;s local storage to remember which
          notification prompts you have already dismissed. We do not use
          third-party advertising cookies, and we do not track you across other
          websites.
        </p>
        <p>
          If you choose to enable browser notifications, your browser will ask
          for permission. You can revoke this at any time in your browser
          settings.
        </p>
      </LegalSection>

      <LegalSection title="9. Cross-border transfers">
        <p>
          Some of our infrastructure providers process data outside Nigeria —
          for example, hosting (Cloudflare, which has a global network) and
          customer support (Chatway). Where we transfer personal data outside
          Nigeria, we do so only under a mechanism permitted by Sections 41
          to 43 of the NDPA. For now, that mechanism is your explicit consent
          given when you create an account, combined with contractual
          safeguards with each provider.
        </p>
        <p>
          We do not transfer verification documents outside Nigeria except as
          required to deliver the platform.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>
          Quick-Konnect is not intended for people under 18. We do not
          knowingly collect personal data from children. If you believe a
          child has created an account, contact us at
          support@quick-konnect.com and we will remove it.
        </p>
      </LegalSection>

      <LegalSection title="11. Automated decision-making">
        <p>
          We do not use fully automated decision-making that produces legal
          effects on you. Every verification decision (Phone, Face, Business,
          Address) is made by a human being on our team. Any future automation
          will be disclosed here with an explanation of the logic involved and
          the right to request human intervention.
        </p>
      </LegalSection>

      <LegalSection title="12. How to complain">
        <p>
          If you are not satisfied with how we have handled your personal data,
          you can contact the Nigeria Data Protection Commission directly:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            Website:{' '}
            <a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
              ndpc.gov.ng
            </a>
          </li>
          <li>
            The NDPC also accepts complaints through its online portal and its
            offices in Abuja and Lagos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="13. Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, we will
          change the &quot;last updated&quot; date at the top of this page. If
          a change is material, we will notify you by email or through the
          platform before it takes effect.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          Questions about this policy or how we handle your data? Email{' '}
          <strong className="text-white/85">support@quick-konnect.com</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
