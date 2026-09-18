import Link from 'next/link';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function LegalLayout(props: {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 border-b border-white/[0.06] pb-8">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">
            Legal
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {props.title}
          </h1>
          {props.subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
              {props.subtitle}
            </p>
          )}
          <div className="mt-4 text-xs text-white/40">
            Last updated: {props.lastUpdated}
          </div>
        </div>

        <article className="prose-legal space-y-8">
          {props.children}
        </article>

        <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-6 text-xs text-white/40">
          <span>Other policies:</span>
          <Link href="/legal/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/legal/disputes" className="hover:text-white">Dispute Policy</Link>
        </div>

        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 text-xs leading-relaxed text-amber-100/80">
          <div className="mb-1 font-medium text-amber-100">Important</div>
          These documents are provided in good faith and reflect how Quick-Konnect
          operates today. They are not a substitute for legal advice. If a
          question matters to you, consult a qualified Nigerian lawyer. For any
          legal enquiry, contact us at support@quick-konnect.com.
        </div>
      </div>

      <Footer />
    </div>
  );
}

export function LegalSection(props: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-white sm:text-xl">
        {props.title}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-white/65">
        {props.children}
      </div>
    </section>
  );
}
