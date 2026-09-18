import Link from 'next/link';
import { db } from '@/server/db/client';
import { VerificationQueue } from './VerificationQueue';

export const metadata = { title: 'Admin — Verifications' };

export default async function AdminVerificationsPage() {
  const pending = await db.providerVerification.findMany({
    where: { status: 'pending' },
    orderBy: { submittedAt: 'asc' },
    include: {
      provider: {
        include: { user: { select: { email: true } } },
      },
    },
  });

  const recent = await db.providerVerification.findMany({
    where: { status: { in: ['approved', 'rejected'] } },
    orderBy: { reviewedAt: 'desc' },
    take: 20,
    include: {
      provider: {
        include: { user: { select: { email: true } } },
      },
    },
  });

  // Load avatar media for every provider referenced above
  const allProviderIds = Array.from(
    new Set([...pending.map((v) => v.provider.id), ...recent.map((v) => v.provider.id)]),
  );
  const profiles = allProviderIds.length
    ? await db.providerProfile.findMany({
        where: { id: { in: allProviderIds } },
        select: { id: true, logoMediaId: true },
      })
    : [];
  const logoIds = profiles.map((p) => p.logoMediaId).filter((x): x is string => !!x);
  const logoMedia = logoIds.length
    ? await db.media.findMany({ where: { id: { in: logoIds } } })
    : [];
  const logoMap = new Map(logoMedia.map((m) => [m.id, '/uploads/' + m.storageKey]));
  const avatarByProvider = new Map(
    profiles.map((p) => [p.id, p.logoMediaId ? logoMap.get(p.logoMediaId) ?? null : null]),
  );

  // Load verification document media (ID + selfie) for every verification above
  const allVerifIds = [...pending.map((v) => v.id), ...recent.map((v) => v.id)];
  const verifDocs = allVerifIds.length
    ? await db.providerVerification.findMany({
        where: { id: { in: allVerifIds } },
        select: { id: true, documentMediaId: true, selfieMediaId: true },
      })
    : [];
  const docMediaIds = verifDocs.flatMap((v) =>
    [v.documentMediaId, v.selfieMediaId].filter((x): x is string => !!x),
  );
  const docMedia = docMediaIds.length
    ? await db.media.findMany({ where: { id: { in: docMediaIds } } })
    : [];
  const docMap = new Map(docMedia.map((m) => [m.id, '/uploads/' + m.storageKey]));
  const docByVerif = new Map(
    verifDocs.map((v) => [
      v.id,
      {
        idPhotoUrl: v.documentMediaId ? docMap.get(v.documentMediaId) ?? null : null,
        selfiePhotoUrl: v.selfieMediaId ? docMap.get(v.selfieMediaId) ?? null : null,
      },
    ]),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verifications</h1>
          <p className="mt-1 text-sm text-white/50">
            {pending.length} pending &middot; review each submission and approve or reject
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
          Pending review
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <div className="mb-3 text-4xl">✓</div>
            <div className="font-medium text-white">Nothing to review</div>
            <p className="mt-1 text-sm text-white/50">
              Provider verification submissions will appear here.
            </p>
          </div>
        ) : (
          <VerificationQueue
            items={pending.map((v) => ({
              id: v.id,
              type: v.type,
              detail: v.notes ?? '',
              submittedAt: v.submittedAt.toISOString(),
              providerName: v.provider.businessName,
              providerSlug: v.provider.slug,
              providerEmail: v.provider.user.email,
              avatarUrl: avatarByProvider.get(v.provider.id) ?? null,
              idPhotoUrl: docByVerif.get(v.id)?.idPhotoUrl ?? null,
              selfiePhotoUrl: docByVerif.get(v.id)?.selfiePhotoUrl ?? null,
            }))}
          />
        )}
      </div>

      {recent.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
            Recently reviewed
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-left text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 text-right font-medium">Reviewed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {recent.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3">
                      <Link
                        href={'/provider/' + v.provider.slug}
                        target="_blank"
                        className="text-white hover:text-blue-300"
                      >
                        {v.provider.businessName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white/70">{v.type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          'rounded-md border px-2 py-0.5 text-[10px] font-medium ' +
                          (v.status === 'approved'
                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                            : 'border-red-400/30 bg-red-400/10 text-red-200')
                        }
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-white/50">
                      {v.reviewedAt ? new Date(v.reviewedAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
