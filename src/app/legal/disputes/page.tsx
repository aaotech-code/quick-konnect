import { LegalLayout, LegalSection } from '@/components/marketplace/LegalLayout';

export const metadata = {
  title: 'Dispute Policy - Quick-Konnect',
  description: 'How Quick-Konnect handles disputes between customers and providers, and how to escalate to the FCCPC.',
};

export default function DisputesPage() {
  return (
    <LegalLayout
      title="Dispute Policy"
      subtitle="What happens when something goes wrong between a customer and a provider on Quick-Konnect."
      lastUpdated="16 September 2026"
    >
      <LegalSection title="1. What this policy covers">
        <p>
          This policy applies to disputes between a customer and a provider
          that arise from a job arranged through Quick-Konnect. It describes
          the steps you should take, what Quick-Konnect can and cannot do, and
          how to escalate a matter further.
        </p>
        <p>
          Quick-Konnect is a marketplace. We are not a party to the agreement
          between a customer and a provider. We cannot force either side to do
          anything. What we can do is facilitate, investigate in good faith,
          and apply the platform-level consequences within our control
          (verification status, account suspension, review moderation).
        </p>
      </LegalSection>

      <LegalSection title="2. Step 1 - Talk to each other first">
        <p>
          Most disagreements get resolved by talking. Before opening a formal
          dispute, use the in-platform messaging on the job page to explain
          the problem clearly to the other party. Give them a reasonable
          chance to fix it. Keep the conversation on-platform — that way there
          is a written record if the matter escalates.
        </p>
        <p>
          We strongly recommend keeping all communication through the platform
          until a job is completed. If a problem arises after both sides have
          moved to other channels, we have less evidence to work with.
        </p>
      </LegalSection>

      <LegalSection title="3. Step 2 - Open a dispute on the job page">
        <p>
          If talking has not resolved the issue, open a dispute from the job
          page. You can open a dispute during these windows:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Customer:</strong> any time
            after the provider has marked the work complete, or after the job
            has been marked completed, up to 30 days from that point.
          </li>
          <li>
            <strong className="text-white/85">Provider:</strong> if a customer
            makes demands that were not part of the agreed quote, or refuses to
            confirm a job that was, in the provider&apos;s honest view,
            completed.
          </li>
        </ul>
        <p>
          When you open a dispute, you will be asked for:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>A short reason category (not what was agreed, quality issue, wrong person arrived, no-show, other).</li>
          <li>A clear written description of what happened.</li>
          <li>What resolution you are asking for.</li>
          <li>Any evidence you already have (photos, messages, receipts) — evidence can be added later.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Step 3 - Quick-Konnect investigates">
        <p>
          When a dispute is opened, the job is marked as disputed. Both parties
          are notified. A member of our team reviews the case and may:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Request more information from either party.</li>
          <li>Look at the job history, the messages on the platform, the quote, and any evidence uploaded.</li>
          <li>Contact you directly for clarification.</li>
        </ul>
        <p>
          We aim to give an initial response within 3 working days and a
          decision within 10 working days. Complex cases may take longer, and
          we will tell you if they do.
        </p>
      </LegalSection>

      <LegalSection title="5. What Quick-Konnect can do">
        <p>
          Depending on what we find, we may take one or more of the following
          actions:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong className="text-white/85">Confirm the dispute as
            unfounded</strong> and close it. The job remains in its current
            state.
          </li>
          <li>
            <strong className="text-white/85">Confirm the dispute</strong> and
            record the resolution on the job. This includes a written summary
            of what we decided and why.
          </li>
          <li>
            <strong className="text-white/85">Remove verification badges</strong>{' '}
            from a provider whose verified identity was misused — for example,
            if a Face Verified provider sent someone else to do the work.
          </li>
          <li>
            <strong className="text-white/85">Suspend or ban an account</strong>{' '}
            for fraud, repeated breach of terms, or conduct that puts other
            users at risk.
          </li>
          <li>
            <strong className="text-white/85">Moderate reviews</strong> that
            breach our review policy.
          </li>
          <li>
            <strong className="text-white/85">Report to law enforcement</strong>{' '}
            where we reasonably believe a criminal offence has occurred.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. What Quick-Konnect cannot do">
        <p>
          Because we do not process payments, we cannot issue refunds. If money
          changed hands directly between you and the other party, only a court,
          a regulator, or the parties themselves can compel its return.
        </p>
        <p>
          We cannot force a provider to return to finish a job. We cannot
          force a customer to confirm a job they believe was not completed.
          We cannot award damages. What we can do is document what happened
          and take platform-level actions within our control.
        </p>
      </LegalSection>

      <LegalSection title="7. Face Verified - special rule">
        <p>
          If you hired a Face Verified provider and someone else showed up to
          do the work, this is the strongest case we handle. Open the dispute
          immediately with the reason category &quot;wrong person arrived&quot;.
          Provide whatever evidence you have — photos of the person who
          arrived, screenshots of the conversation, anything relevant.
        </p>
        <p>
          Verified providers who send someone else to do the work lose the
          Face Verified badge permanently. This is written into the Provider
          Terms and is enforced without exception.
        </p>
      </LegalSection>

      <LegalSection title="8. Step 4 - Escalation to the FCCPC">
        <p>
          If you are not satisfied with how Quick-Konnect handled your dispute,
          you can escalate to the Federal Competition and Consumer Protection
          Commission (FCCPC).
        </p>
        <p>
          The FCCPC expects consumers to first attempt to resolve the matter
          directly with the business before filing a formal complaint. Because
          you have already gone through our dispute process, you have
          satisfied that step.
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            File a complaint through the FCCPC portal at{' '}
            <a href="https://fccpc.gov.ng" target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
              fccpc.gov.ng
            </a>.
          </li>
          <li>
            The FCCPC also has zonal offices, including in Lagos, where
            in-person complaints can be filed.
          </li>
          <li>
            Include the Quick-Konnect job reference, our dispute resolution
            summary, and any evidence you uploaded.
          </li>
        </ul>
        <p>
          We cooperate fully with FCCPC investigations and will respond to
          every request made through official channels.
        </p>
      </LegalSection>

      <LegalSection title="9. Good faith">
        <p>
          We expect both parties to engage with disputes in good faith. Using
          the dispute system to harass, extort, or unfairly damage another
          person&apos;s reputation is a breach of our Terms of Service. We
          will investigate and act on abuse of the system the same way we
          investigate abuse of the platform.
        </p>
      </LegalSection>

      <LegalSection title="10. Records">
        <p>
          Every dispute is retained as part of the job record. The written
          summary of the outcome is visible to both parties. If a matter
          later goes to a court or regulator, we can provide a copy of the
          dispute record to the parties on request.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          To open a dispute, use the button on the job page. If you cannot
          find it or you have a question about this policy, email{' '}
          <strong className="text-white/85">support@quick-konnect.com</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
