import Link from 'next/link';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';

export const metadata = {
  title: 'About Quick-Konnect',
  description: 'Quick-Konnect is a Nigerian-built marketplace connecting customers with verified local service providers. Here is why we exist, and what we are building.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[26rem] w-[26rem] rounded-full bg-emerald-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">
            About
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            We are building the trust
            <span className="block bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
              Nigeria has been missing.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
            Quick-Konnect is a Nigerian-built marketplace for local services.
            Our job is simple: make it easy to find a real professional, and
            make it worth being one.
          </p>
        </div>
      </section>

      {/* Why we exist */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300/70">
          Why we started
        </div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Hiring a stranger in Nigeria is harder than it should be.
        </h2>
        <div className="mt-6 space-y-5 text-base leading-8 text-white/65">
          <p>
            You have probably been here. Someone was recommended. You called.
            They promised to come. They did not come. Or they sent a boy. Or
            the work was bad and there was nothing you could do about it.
          </p>
          <p>
            On the other side: you are a welder, a tailor, a designer, an
            electrician. You do good work. But nobody can find you unless
            someone who already knows you happens to mention your name to
            someone else. You have no way to build a reputation that travels
            ahead of you.
          </p>
          <p>
            Quick-Konnect exists to fix both problems at the same time. We give
            customers a way to find and vet real professionals. We give
            providers a way to be found, be verified, and build a reputation
            that means something.
          </p>
        </div>
      </section>

      {/* How we think about trust */}
      <section className="border-y border-white/[0.06] bg-[#080b11] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
            Our stance on trust
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            We will not sell trust.
          </h2>
          <div className="mt-6 space-y-5 text-base leading-8 text-white/65">
            <p>
              Some marketplaces sell verification badges. We do not. A
              verification badge on Quick-Konnect means we checked something
              specific. If we sold it, it would mean nothing — and the day the
              badge stops meaning something is the day customers stop trusting
              the platform.
            </p>
            <p>
              This is why we do not allow paid placement to falsely imply
              verification or quality. When we introduce sponsored listings
              later, they will be clearly labeled as sponsored, and only
              available to providers who have already proven themselves
              through our checks.
            </p>
            <p>
              Our economic model is simple: the platform grows when real jobs
              get completed. Every choice we make is measured against that.
            </p>
          </div>
        </div>
      </section>

      {/* What we are building */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">
          What we are building
        </div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          A marketplace that actually works.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { t: 'Verification that means something', d: 'Multiple verification types — phone, face, business, address — each checked by a human being and each explained in plain language.' },
            { t: 'Reviews from real jobs', d: 'Only a customer who has completed a job with a provider can leave a review. This is enforced in the code, not just in policy.' },
            { t: 'Quote comparison', d: 'Describe your job once and receive quotes from matching providers. Compare on price, experience, and message — not just on who is loudest.' },
            { t: 'In-platform messaging', d: 'Talk to providers before you hire. Keep the conversation on the platform so there is a written record if anything goes wrong.' },
            { t: 'Complete job tracking', d: 'From request to completion to review — every step of the job has a status, a timeline, and both sides can see it.' },
            { t: 'Reputation that travels', d: 'Providers who do good work build a rating and a review history that means something in the market. Good work compounds.' },
          ].map((item) => (
            <div key={item.t} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="text-sm font-medium text-white">{item.t}</div>
              <p className="mt-2 text-xs leading-6 text-white/50">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where we are */}
      <section className="border-y border-white/[0.06] bg-[#080b11] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">
            Where we are
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Growing city by city. On purpose.
          </h2>
          <div className="mx-auto mt-6 max-w-2xl space-y-5 text-base leading-8 text-white/65">
            <p>
              We could launch everywhere at once and show you a thousand
              names. We would rather have real, verified, working providers in
              the cities we open. That is what makes a badge mean something.
            </p>
            <p>
              We are starting in Enugu, Abuja, Makurdi, Jos and nearby cities.
              As we grow, we open new states. Wherever we open, we recruit
              real people first.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-20 text-center">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
          Talk to us
        </div>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          We read every message.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65">
          Whether you are a customer with a question, a provider who wants to
          join, or someone who just has an idea for how we could do this
          better — we want to hear it.
        </p>
        <p className="mt-6 text-base leading-8 text-white/65">
          Email us at{' '}
          <strong className="text-white/90">support@quick-konnect.com</strong>
        </p>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
            Find a service
          </Link>
          <Link href="/pro/onboarding" className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]">
            Offer your skill
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
