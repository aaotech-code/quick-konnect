import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/server/db/client';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';
import { FAQ } from './FAQ';

export default async function HomePage() {
  const [topCategories, cities, providerCount, categoryCount] = await Promise.all([
    db.serviceCategory.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    }),
    (async () => {
      // Prefer admin-featured cities; fall back to any active city if none are featured.
      const featured = await db.location.findMany({
        where: { type: 'city', isActive: true, isFeatured: true },
        orderBy: { name: 'asc' },
        take: 12,
      });
      if (featured.length > 0) return featured;
      return db.location.findMany({
        where: { type: 'city', isActive: true },
        orderBy: { name: 'asc' },
        take: 12,
      });
    })(),
    db.providerProfile.count(),
    db.serviceCategory.count({ where: { isActive: true, parentId: { not: null } } }),
  ]);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -left-48 -top-48 h-[40rem] w-[40rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="pointer-events-none absolute -right-48 top-20 h-[36rem] w-[36rem] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[-16rem] left-[35%] h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#05070b_78%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pt-28">
          <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white/70 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Launching in Enugu, Abuja, Jos, Makurdi &amp; nearby
              </div>

              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl lg:text-[5.5rem]">
                Find someone who will
                <span className="block bg-gradient-to-r from-blue-300 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                  actually show up.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                Nigeria&apos;s trusted marketplace for local services. Verified providers,
                real reviews from completed jobs, and quotes you can compare — so you
                can hire with confidence, not hope.
              </p>

              {/* Search */}
              <form
                action="/services"
                className="group relative mt-9 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-[0_25px_80px_-25px_rgba(37,99,235,0.35)] backdrop-blur-2xl transition-all duration-300 hover:border-white/20"
              >
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-black/20 px-4">
                    <svg className="h-5 w-5 shrink-0 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                    <input
                      name="q"
                      placeholder="What do you need? Welder, cleaner, designer..."
                      className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-black/20 px-4 md:w-48">
                    <svg className="h-5 w-5 shrink-0 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <input
                      name="location"
                      placeholder="City"
                      className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-14 rounded-xl bg-white px-7 text-sm font-semibold text-[#05070b] shadow-xl transition-all duration-300 hover:scale-[1.01] hover:bg-blue-50 active:scale-[0.99]"
                  >
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
                <span>Popular:</span>
                {['Electrician', 'Plumber', 'Cleaner', 'Welder', 'Designer'].map((item) => (
                  <Link
                    key={item}
                    href={'/services?q=' + encodeURIComponent(item)}
                    className="transition hover:text-white/80"
                  >
                    {item}
                  </Link>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold shadow-[0_15px_45px_-15px_rgba(59,130,246,0.7)] transition-all hover:-translate-y-0.5"
                >
                  Find a Service
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/pro/onboarding"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  I do this work
                </Link>
              </div>
            </div>

            {/* Right visual — floating cards */}
            <div className="relative hidden min-h-[560px] lg:col-span-5 lg:block">
              <div className="absolute right-0 top-8 w-[390px] rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_35px_100px_-35px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Recommended</div>
                    <div className="mt-1 text-sm font-semibold">Verified providers</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">Live</div>
                </div>

                <div className="space-y-3">
                  {[
                    { letter: 'C', name: 'Chinedu Electrical', service: 'Electrical · Generator', rating: '4.9', jobs: '128 jobs', color: 'from-blue-500 to-indigo-500', verified: true },
                    { letter: 'A', name: 'Ada Home Repairs', service: 'Plumbing · Repairs', rating: '4.8', jobs: '94 jobs', color: 'from-emerald-500 to-teal-500', verified: true },
                    { letter: 'M', name: 'Musa Creative Studio', service: 'Branding · Design', rating: '5.0', jobs: '67 jobs', color: 'from-violet-500 to-fuchsia-500', verified: false },
                  ].map((provider) => (
                    <div key={provider.name} className="rounded-2xl border border-white/8 bg-black/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ' + provider.color + ' text-sm font-bold shadow-lg'}>
                          {provider.letter}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <div className="truncate text-sm font-medium">{provider.name}</div>
                            {provider.verified && (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px]">✓</span>
                            )}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-white/40">{provider.service}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold">★ {provider.rating}</div>
                          <div className="mt-1 text-[10px] text-white/35">{provider.jobs}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/services" className="mt-4 flex items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] py-3 text-xs font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white">
                  Explore all providers →
                </Link>
              </div>

              <div className="absolute -left-5 top-[245px] w-[225px] rotate-[-3deg] rounded-2xl border border-white/10 bg-[#0b0f16]/90 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:rotate-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Quotes received</div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2.5">
                    <div>
                      <div className="text-[11px] font-medium">Provider A</div>
                      <div className="mt-0.5 text-[9px] text-white/35">8 yrs experience</div>
                    </div>
                    <div className="text-xs font-bold">₦20k</div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div>
                      <div className="text-[11px] font-medium">Provider B</div>
                      <div className="mt-0.5 text-[9px] text-white/35">5 yrs experience</div>
                    </div>
                    <div className="text-xs font-bold">₦25k</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-2 right-7 w-[260px] rotate-[2deg] rounded-2xl border border-white/10 bg-[#0b0f16]/95 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-white/35">JOB #J-1042</div>
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-1 text-[9px] text-blue-300">In progress</span>
                </div>
                <div className="mt-3 text-sm font-medium">Kitchen sink repair</div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-white/35">
                  <span>Provider on the way</span>
                  <span>78%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUTH STRIP — real numbers, honest
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/[0.07] sm:grid-cols-4">
          {[
            { label: 'Providers on platform', value: String(providerCount) },
            { label: 'Services offered', value: String(categoryCount) },
            { label: 'Cities served', value: String(cities.length) },
            { label: 'City-by-city launch', value: 'Deliberate' },
          ].map((s) => (
            <div key={s.label} className="px-5 py-8 sm:px-8 sm:py-10">
              <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.value}</div>
              <div className="mt-1.5 text-xs text-white/35 sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          THE PROBLEM
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-300/70">The problem</div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Hiring a stranger shouldn&apos;t
              <span className="block text-white/45">be this stressful.</span>
            </h2>
            <p className="mt-5 text-base leading-7 text-white/50 sm:text-lg">
              You&apos;ve been here before. Someone was recommended. You called. They promised
              to come. They didn&apos;t come. Or they sent a boy. Or the work was bad and
              there was nothing you could do.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'You can&apos;t tell who is real',
                text: 'Facebook groups, classifieds, WhatsApp recommendations — every name could be a real professional or a phone number that stops working after one job.',
              },
              {
                title: 'The wrong person shows up',
                text: 'You hired the welder you saw in the photo. A stranger arrived at your gate instead. Now what?',
              },
              {
                title: 'There is no recourse',
                text: 'Bad work, no receipts, no platform to complain to, no way to warn the next customer. Just lost money and a broken sink.',
              },
            ].map((it) => (
              <div key={it.title} className="rounded-3xl border border-red-400/[0.12] bg-red-400/[0.025] p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/[0.08] text-red-300">
                  <span className="text-lg">!</span>
                </div>
                <h3 className="mt-6 text-base font-semibold" dangerouslySetInnerHTML={{ __html: it.title }} />
                <p className="mt-2 text-sm leading-6 text-white/45">{it.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW QUICK-KONNECT SOLVES IT — three pillars
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.07] bg-[#080b11] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">The fix</div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Three things nobody else does.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/50 sm:text-lg">
              Everything on Quick-Konnect is built around one question: does this
              actually protect the person hiring — and reward the person working?
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Face Verified',
                sub: 'The person on the profile is the person who shows up',
                text: 'Our team compares each provider&apos;s photo against a government-issued ID and a live selfie. The ones who pass get the Face Verified badge — and they lose it forever if they ever send someone else to do the job.',
                color: 'emerald',
              },
              {
                num: '02',
                title: 'Reviews from real jobs',
                sub: 'Not testimonials. Not paid placements.',
                text: 'Only a customer who actually completed a job with a provider can leave a review. That means every rating you see is real. No fake five stars, no self-promotion, no guessing who is honest.',
                color: 'blue',
              },
              {
                num: '03',
                title: 'Quotes you compare',
                sub: 'Never take the first price. Ever.',
                text: 'Describe your job once. Multiple providers send you their price, timing, and conditions. You compare — like a person who knows what they are doing. Then you choose.',
                color: 'violet',
              },
            ].map((p) => (
              <div key={p.num} className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-8 transition hover:border-white/[0.18] hover:bg-white/[0.045]">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-white/30">{p.num}</div>
                  <span className="text-2xl text-white/15 transition group-hover:text-white/40">→</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{p.title}</h3>
                <div className="mt-2 text-xs font-medium uppercase tracking-wider text-emerald-300/70">{p.sub}</div>
                <p className="mt-5 text-sm leading-7 text-white/50" dangerouslySetInnerHTML={{ __html: p.text }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TWO PATHS — customer and provider
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Two sides. One platform.</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Whether you hire
                <span className="block text-white/40">or get hired.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/45 sm:text-base">
                Quick-Konnect works both ways. Same account. Same trust system.
                Whether you need someone today or you are the someone who does the
                work — you belong here.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
                  I need someone →
                </Link>
                <Link href="/pro/onboarding" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08]">
                  I do the work
                </Link>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Customer track */}
                <div className="relative rounded-3xl border border-blue-400/[0.15] bg-blue-400/[0.02] p-8">
                  <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    For customers
                  </div>
                  <ol className="space-y-6">
                    {[
                      'Describe the job in a minute.',
                      'See quotes from verified providers.',
                      'Message them before you commit.',
                      'Hire the one you trust. Confirm when done.',
                      'Leave a review that helps the next person.',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/[0.06] text-[11px] font-semibold text-blue-200">{i + 1}</span>
                        <span className="pt-1 text-sm leading-6 text-white/70">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Provider track */}
                <div className="relative rounded-3xl border border-emerald-400/[0.15] bg-emerald-400/[0.02] p-8">
                  <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    For providers
                  </div>
                  <ol className="space-y-6">
                    {[
                      'Build your profile with photos of your work.',
                      'Get verified — earn the badge.',
                      'Receive job requests in your area.',
                      'Send your price. Win the job.',
                      'Every completed job builds your reputation.',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.06] text-[11px] font-semibold text-emerald-200">{i + 1}</span>
                        <span className="pt-1 text-sm leading-6 text-white/70">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUST BADGES EXPLAINED
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.07] bg-[#080b11] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">The trust system</div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Every badge means something specific.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/50 sm:text-lg">
              We do not use vague language. When you see a badge on a profile,
              you know exactly what our team checked, and what they did not.
            </p>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: 'Face Verified', color: 'emerald', check: 'Photo matches government ID + live selfie.', strength: 'Strongest' },
              { name: 'Phone Verified', color: 'blue', check: 'We confirmed the phone number on file.', strength: 'Basic' },
              { name: 'Business Verified', color: 'violet', check: 'CAC registration number confirmed.', strength: 'Business' },
              { name: 'Address Verified', color: 'amber', check: 'Proof of address checked.', strength: 'Business' },
              { name: 'Complete Profile', color: 'slate', check: 'Photo, description, services and areas filled in.', strength: 'Basic' },
            ].map((b) => (
              <div key={b.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className={'inline-flex rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ' + (
                  b.color === 'emerald' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' :
                  b.color === 'blue' ? 'border-blue-400/30 bg-blue-400/10 text-blue-200' :
                  b.color === 'violet' ? 'border-violet-400/30 bg-violet-400/10 text-violet-200' :
                  b.color === 'amber' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' :
                  'border-white/15 bg-white/[0.05] text-white/60'
                )}>
                  {b.name}
                </div>
                <p className="mt-4 text-xs leading-5 text-white/50">{b.check}</p>
                <div className="mt-4 text-[10px] uppercase tracking-wider text-white/30">{b.strength}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Explore services</div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Whatever needs doing,
                <span className="block text-white/45">there is someone who can do it.</span>
              </h2>
            </div>
            <Link href="/services" className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
              View all services
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {topCategories.map((category, index) => {
              const featured = index === 0;
              return (
                <Link
                  key={category.id}
                  href={'/services/' + category.slug}
                  className={'group relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.18] hover:bg-white/[0.05] ' + (featured ? 'col-span-2 min-h-[280px] lg:col-span-2 lg:row-span-2 lg:min-h-[380px]' : 'min-h-[210px]')}
                >
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(min-width:1024px) 40vw, 100vw"
                      className="object-cover opacity-55 transition duration-700 group-hover:scale-105 group-hover:opacity-75"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                  <div className={'relative z-10 flex h-full flex-col ' + (featured ? 'p-8 lg:p-10' : 'p-5 sm:p-7')}>
                    <div className="flex items-center justify-between">
                      <div className={'flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md ' + (featured ? 'h-12 w-12 text-2xl' : 'h-10 w-10 text-xl')}>
                        {category.icon ?? '•'}
                      </div>
                      <span className={'text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/80 ' + (featured ? 'text-2xl' : 'text-lg')}>→</span>
                    </div>
                    <div className="mt-auto pt-12">
                      <h3 className={'font-semibold tracking-tight text-white ' + (featured ? 'text-2xl sm:text-3xl' : 'text-lg')}>
                        {category.name}
                      </h3>
                      {featured && (
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
                          {category.description ?? 'Trusted, verified local professionals.'}
                        </p>
                      )}
                      <div className="mt-5 text-xs font-medium text-blue-300 transition group-hover:text-blue-200">
                        Browse providers →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CITIES — honest launch positioning
      ═══════════════════════════════════════════════════════════ */}
      {cities.length > 0 && (
        <section className="border-t border-white/[0.07] bg-[#080b11] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Where we are</div>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  Growing city
                  <span className="block text-white/40">by city. On purpose.</span>
                </h2>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/45 sm:text-base">
                  We could launch everywhere at once and show you a thousand
                  names. We would rather have real, verified, working providers
                  in the cities we open. That is what makes the badge mean something.
                </p>
                <Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-blue-200">
                  Request service in your city
                  <span>→</span>
                </Link>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="text-xs font-medium text-white/60">Available cities</div>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-300/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {cities.map((city) => (
                      <Link
                        key={city.id}
                        href={'/services?location=' + encodeURIComponent(city.name)}
                        className="group flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-black/10 px-4 py-3.5 text-sm text-white/60 transition hover:border-blue-400/20 hover:bg-blue-400/[0.05] hover:text-white"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70 transition group-hover:scale-125" />
                        <span className="truncate">{city.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PROVIDER PITCH
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.09] via-white/[0.025] to-blue-500/[0.06] p-7 sm:rounded-[2.5rem] sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px]" />

            <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">For professionals</div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">
                  Your skill is your business.
                  <span className="block text-white/40">We make sure people find it.</span>
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                  Welder, carpenter, electrician, tailor, designer, photographer, cleaner,
                  mechanic — if you do good work, you deserve to be found. Build a free
                  profile. Get verified. Get paid. Build a reputation that travels ahead
                  of you.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/pro/onboarding" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-[#04100b] shadow-[0_15px_45px_-15px_rgba(52,211,153,0.6)] transition hover:-translate-y-0.5 hover:bg-emerald-300">
                    Create your provider profile
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                  <Link href="/how-it-works" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
                    See how it works
                  </Link>
                </div>

                <div className="mt-6 text-xs text-white/40">
                  Free to join. No listing fees. No commission at launch.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '✦', title: 'Your own page', text: 'A shareable profile at a clean URL — put it on WhatsApp, business cards, anywhere.' },
                  { icon: '✓', title: 'Get verified', text: 'Earn the Face Verified badge. It is the strongest trust signal on the platform.' },
                  { icon: '→', title: 'Receive requests', text: 'Customers in your cities send you job requests. You send your price.' },
                  { icon: '★', title: 'Build reputation', text: 'Every completed job adds a real review that keeps working for you.' },
                ].map((b) => (
                  <div key={b.title} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 transition hover:border-white/[0.15] hover:bg-white/[0.04]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] text-sm text-emerald-300">{b.icon}</div>
                    <h3 className="mt-5 text-sm font-semibold">{b.title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-white/40">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] bg-[#080b11] py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Questions</div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Everything you are<br />probably wondering.
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Your next job starts here.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/40 sm:text-base">
            Whether you need something fixed, built, designed or delivered — or
            you are the person who does that work — this is where it begins.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50">
              Find a service
            </Link>
            <Link href="/pro/onboarding" className="rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">
              Offer your skill
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
