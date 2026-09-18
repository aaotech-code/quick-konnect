import Link from 'next/link';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';
import { FAQ } from '../FAQ';

export const metadata = {
  title: 'How Quick-Konnect works',
  description: 'Learn how customers and providers use Quick-Konnect: post a job, compare quotes, hire confidently, build a reputation.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[26rem] w-[26rem] rounded-full bg-emerald-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">How it works</div>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            The trust layer<br />
            <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              Nigeria has been missing.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Finding a good welder, plumber, designer or cleaner should not depend on luck or a friend of a friend.
            Quick-Konnect gives both sides what they need to work together with confidence.
          </p>
        </div>
      </section>

      {/* Two paths */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          {/* For customers */}
          <div>
            <div className="mb-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              If you need something done
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">You are a customer.</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Whether it is fixing a pipe, building a website, or catering an event, here is how you get it done.
            </p>

            <ol className="mt-10 space-y-8">
              {[
                { n: '01', t: 'Describe the job', d: 'Tell us what you need and where you are. Add details, photos, your budget and timeline. Takes about a minute.' },
                { n: '02', t: 'Receive quotes', d: 'Verified providers who offer that service in your city send you their price, timing and conditions. You can chat with them before deciding.' },
                { n: '03', t: 'Compare and choose', d: 'See each provider side by side — rating, completed jobs, verification badges, and their actual message to you. Pick the one you trust.' },
                { n: '04', t: 'Track the job', d: 'Once you accept a quote, the job is created. Both of you see the same status. You can message each other in-app any time.' },
                { n: '05', t: 'Confirm and review', d: 'When the provider marks the work complete, you confirm it. Then you leave a review — one that other customers can trust because it comes from a completed job.' },
              ].map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/[0.06] font-mono text-xs font-semibold text-blue-200">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-base font-medium text-white">{s.t}</div>
                    <p className="mt-1 text-sm leading-6 text-white/55">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
              >
                Post your first job
              </Link>
              <Link
                href="/providers"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
              >
                Browse providers
              </Link>
            </div>
          </div>

          {/* For providers */}
          <div>
            <div className="mb-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              If you do this work
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">You are a provider.</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Electrician, tailor, cleaner, designer, welder, mechanic, photographer, developer — if you do good work, you deserve to be found.
            </p>

            <ol className="mt-10 space-y-8">
              {[
                { n: '01', t: 'Build your profile', d: 'Add your services, service areas, description, and photos of work you have done. The more you show, the more customers trust you.' },
                { n: '02', t: 'Get verified', d: 'Submit your phone, and optionally your ID and business details. Our team reviews it. Verified providers get the strongest badges and rank higher.' },
                { n: '03', t: 'Receive requests', d: 'When customers in your area post jobs matching your services, you receive them. You will get a notification and see them in your dashboard.' },
                { n: '04', t: 'Send your quote', d: 'Give the customer a clear price, timeline and message. No fees, no commission at launch. Whatever you quote, you keep.' },
                { n: '05', t: 'Do the work, build your reputation', d: 'Complete the job, mark it done, and when the customer confirms, your rating updates. Every completed job makes you more visible.' },
              ].map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] font-mono text-xs font-semibold text-emerald-200">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-base font-medium text-white">{s.t}</div>
                    <p className="mt-1 text-sm leading-6 text-white/55">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/pro/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#04100b] transition hover:bg-emerald-300"
              >
                Create your provider profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust system */}
      <section className="border-y border-white/[0.06] bg-[#080b11] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">The trust system</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Trust is earned step by step.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/55">
              Every badge on Quick-Konnect means something specific. We show you exactly what our team checked.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Phone Verified', desc: 'We confirmed the phone number on file. Baseline signal that the provider is reachable.' },
              { title: 'Face Verified', desc: 'Our team compared the provider photo against a government ID and a live selfie. The strongest trust badge on the platform.' },
              { title: 'Business Verified', desc: 'For registered businesses — we confirmed the CAC registration number with the provider.' },
              { title: 'Address Verified', desc: 'We checked proof of address. Helpful for customers who want a fixed place to visit.' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="text-sm font-medium text-white">{b.title}</div>
                <p className="mt-2 text-xs leading-relaxed text-white/50">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 text-center">
            <div className="text-sm leading-relaxed text-emerald-100/90">
              <strong className="text-emerald-100">Reviews come from real jobs.</strong> Only a customer
              who has completed a job with a provider can leave a review. No fake five stars. No paid
              placements pretending to be quality.
            </div>
          </div>
        </div>
      </section>

      {/* Payment & disputes */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Payment</div>
            <h3 className="text-2xl font-semibold tracking-[-0.02em]">How money works today.</h3>
            <p className="mt-4 text-sm leading-7 text-white/55">
              Right now, payment is arranged <strong className="text-white/80">directly between you and the provider</strong> —
              the same way it works when a friend recommends someone. Cash, bank transfer, whatever you both agree.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/55">
              What Quick-Konnect adds is everything around it: you found them here, you saw their real reviews,
              you have the job trail on record, and you have our dispute policy behind you.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/55">
              <strong className="text-white/80">Optional in-platform payment protection is coming.</strong> When it
              launches, it will be optional — you will always be able to arrange payment directly if you prefer.
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">Disputes</div>
            <h3 className="text-2xl font-semibold tracking-[-0.02em]">If something goes wrong.</h3>
            <p className="mt-4 text-sm leading-7 text-white/55">
              Open a dispute from the job page. Our team reviews what happened, looks at evidence from
              both sides, and makes a fair call. Both parties get a written record of the decision.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/55">
              We take the Face Verified promise seriously: if a verified provider sends someone else to do
              the work, they lose their badge permanently. That is written into their terms.
            </p>
            <Link href="/legal/disputes" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-300 transition hover:text-amber-200">
              Read the dispute policy
              <span>&#8594;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.06] bg-[#080b11] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Questions</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Everything you are<br />probably wondering.
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">
            Post a job, or create a provider profile. Either way, it is free.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
              Find a service
            </Link>
            <Link href="/pro/onboarding" className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]">
              Offer your skill
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
