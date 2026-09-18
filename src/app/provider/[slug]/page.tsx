import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { getProviderBySlug } from '@/server/services/providers';
import { listProviderReviews } from '@/server/services/jobs';
import { getAuthContext } from '@/server/auth/session';
import { MessageButton } from '@/components/marketplace/MessageButton';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const p = await db.providerProfile.findUnique({ where: { slug } });
  if (!p) return { title: 'Provider not found' };
  return {
    title: p.businessName + ' — Quick-Konnect',
    description: p.tagline ?? p.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProviderPublicPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const provider = await getProviderBySlug(slug);
  if (!provider) notFound();

  const viewer = await getAuthContext();
  const viewerOwnsThis = viewer?.userId === provider.user.id;

  // Load avatar media URL
  let avatarUrl: string | null = null;
  if (provider.logoMediaId) {
    const m = await db.media.findUnique({ where: { id: provider.logoMediaId } });
    if (m) avatarUrl = '/uploads/' + m.storageKey;
  }

  // Load portfolio media URLs
  const portfolioMediaIds = provider.portfolio.map((p) => p.mediaId);
  const portfolioMedia = portfolioMediaIds.length
    ? await db.media.findMany({ where: { id: { in: portfolioMediaIds } } })
    : [];
  const portfolioMap = new Map(portfolioMedia.map((m) => [m.id, '/uploads/' + m.storageKey]));
  const portfolioItems = provider.portfolio.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    publicUrl: portfolioMap.get(p.mediaId) ?? '',
  })).filter((p) => p.publicUrl);

  // Load verification state
  const verifications = await db.providerVerification.findMany({
    where: { providerId: provider.id, status: 'approved' },
  });
  const approvedTypes = new Set(verifications.map((v) => v.type));
  const faceVerified = approvedTypes.has('identity');
  const phoneVerified = approvedTypes.has('phone');
  const businessVerified = approvedTypes.has('business');
  const addressVerified = approvedTypes.has('address');

  // Group services by parent category
  const servicesByParent = new Map<
    string,
    {
      parentName: string;
      parentIcon: string | null;
      items: { id: string; name: string; icon: string | null }[];
    }
  >();
  for (const pc of provider.categories) {
    const parent = pc.category.parent;
    const key = parent?.id ?? 'root';
    if (!servicesByParent.has(key)) {
      servicesByParent.set(key, {
        parentName: parent?.name ?? 'Services',
        parentIcon: parent?.icon ?? null,
        items: [],
      });
    }
    servicesByParent.get(key)!.items.push({
      id: pc.category.id,
      name: pc.category.name,
      icon: pc.category.icon,
    });
  }

  // Group locations by state
  const citiesByState = new Map<string, { stateName: string; cities: string[] }>();
  for (const pl of provider.locations) {
    const stateName = pl.location.parent?.name ?? 'Other';
    if (!citiesByState.has(stateName)) {
      citiesByState.set(stateName, { stateName, cities: [] });
    }
    citiesByState.get(stateName)!.cities.push(pl.location.name);
  }

  const initial = provider.businessName.charAt(0).toUpperCase();
  const reviews = await listProviderReviews(provider.id, 10);
  const rating = Number(provider.ratingAvg);
  const rounded = Math.round(rating);
  const stars = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="pointer-events-none absolute -top-20 right-0 h-[26rem] w-[26rem] rounded-full bg-emerald-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-4xl font-bold text-white shadow-xl">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={provider.businessName} fill sizes="96px" className="object-cover" unoptimized />
              ) : (
                initial
              )}
            </div>

            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">{provider.businessName}</h1>
                {faceVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-100">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[9px] text-[#04100b]">
                      ✓
                    </span>
                    Face Verified
                  </span>
                )}
                {!faceVerified && phoneVerified && (
                  <span className="rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                    Phone verified
                  </span>
                )}
                {businessVerified && (
                  <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                    Business verified
                  </span>
                )}
                {addressVerified && (
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                    Address verified
                  </span>
                )}
              </div>

              {provider.tagline && (
                <p className="text-base text-white/60">{provider.tagline}</p>
              )}

              {faceVerified && (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-[11px] leading-relaxed text-emerald-100/90">
                  <div className="mb-1 font-semibold text-emerald-100">
                    This provider&apos;s face has been verified
                  </div>
                  Our team has confirmed that the photo on this profile matches a government-issued
                  ID and a live selfie. <strong>If a different person shows up to do your job,
                  open a dispute immediately</strong> — you&apos;re protected.
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/50">
                {provider.ratingCount > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-300">{stars}</span>
                    <span className="text-white/70">{rating.toFixed(1)}</span>
                    <span className="text-white/40">({provider.ratingCount})</span>
                  </span>
                ) : (
                  <span className="text-white/40">No reviews yet</span>
                )}
                <span>{provider.jobsCompleted} jobs completed</span>
                {provider.yearsExperience !== null && (
                  <span>{provider.yearsExperience} years experience</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {/* About */}
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">About</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">
                {provider.description ?? 'No description provided.'}
              </p>
            </div>

            {/* Portfolio */}
            {portfolioItems.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">
                  Past work
                  <span className="ml-2 text-sm font-normal text-white/40">
                    ({portfolioItems.length})
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {portfolioItems.map((p) => (
                    <div
                      key={p.id}
                      className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0f16]"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={p.publicUrl}
                          alt={p.title ?? 'Work photo'}
                          fill
                          sizes="(min-width:640px) 33vw, 50vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      </div>
                      {p.title && (
                        <div className="p-2.5">
                          <div className="truncate text-xs font-medium text-white/90">{p.title}</div>
                          {p.description && (
                            <div className="mt-0.5 line-clamp-2 text-[10px] text-white/50">
                              {p.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Services offered</h2>
              <div className="space-y-4">
                {Array.from(servicesByParent.values()).map((group) => (
                  <div key={group.parentName}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white/50">
                      {group.parentIcon && <span>{group.parentIcon}</span>}
                      <span>{group.parentName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((it) => (
                        <span
                          key={it.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80"
                        >
                          {it.icon && <span>{it.icon}</span>}
                          {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold tracking-tight">
                  Reviews
                  <span className="ml-2 text-sm font-normal text-white/40">({provider.ratingCount})</span>
                </h2>
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">{'★'.repeat(r.ratingOverall)}<span className="text-white/20">{'★'.repeat(5 - r.ratingOverall)}</span></span>
                          <span className="text-xs text-white/40">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.06] px-2 py-0.5 text-[10px] text-emerald-200">
                          ✓ Verified job
                        </span>
                      </div>
                      {r.body && (
                        <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{r.body}</p>
                      )}
                      <div className="mt-2 text-[11px] text-white/40">
                        {r.job.request.category.name} · {r.job.request.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service areas */}
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Service areas</h2>
              <div className="space-y-3">
                {Array.from(citiesByState.values()).map((group) => (
                  <div key={group.stateName}>
                    <div className="mb-1.5 text-xs text-white/50">{group.stateName}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.cities.map((c) => (
                        <span
                          key={c}
                          className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar CTA */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 space-y-3">
              <div className="mb-1 text-sm font-medium">
                {viewerOwnsThis ? 'This is your profile' : 'Contact this provider'}
              </div>
              <p className="text-xs text-white/50">
                {viewerOwnsThis
                  ? 'Manage your profile from the provider dashboard.'
                  : 'Send a message to ask about availability, pricing, or to scope the job.'}
              </p>

              {viewerOwnsThis ? (
                <a
                  href="/pro"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
                >
                  Provider dashboard →
                </a>
              ) : viewer ? (
                <>
                  <MessageButton providerId={provider.id} />
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-[11px] leading-relaxed text-white/50">
                    Phone numbers and direct call options become available
                    after you and the provider agree on a job.
                  </div>
                </>
              ) : (
                <a
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-blue-50"
                >
                  Sign in to message
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}
