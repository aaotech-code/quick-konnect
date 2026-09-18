import Link from 'next/link';
import Image from 'next/image';

type Provider = {
  id: string;
  slug: string;
  businessName: string;
  tagline: string | null;
  verificationStatus: string;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  yearsExperience: number | null;
  avatarUrl: string | null;
  categories: { id: string; name: string; icon: string | null }[];
  locations: { name: string; stateName: string | null }[];
};

export function ProviderCard(props: { provider: Provider }) {
  const p = props.provider;
  const verified = p.verificationStatus === 'verified';

  return (
    <Link
      href={'/provider/' + p.slug}
      className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/[0.2] hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white">
          {p.avatarUrl ? (
            <Image src={p.avatarUrl} alt={p.businessName} fill sizes="56px" className="object-cover" unoptimized />
          ) : (
            p.businessName.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-medium text-white group-hover:text-blue-200">{p.businessName}</span>
            {verified && (
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[9px] text-[#04100b]">&#10003;</span>
            )}
          </div>
          {p.tagline && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-white/50">{p.tagline}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/55">
        {p.ratingCount > 0 ? (
          <span className="flex items-center gap-1">
            <span className="text-amber-300">&#9733;</span>
            <span className="text-white/80">{p.ratingAvg.toFixed(1)}</span>
            <span className="text-white/40">({p.ratingCount})</span>
          </span>
        ) : (
          <span className="text-white/40">No reviews yet</span>
        )}
        {p.jobsCompleted > 0 && (
          <span>{p.jobsCompleted} job{p.jobsCompleted === 1 ? '' : 's'}</span>
        )}
        {p.yearsExperience && (
          <span>{p.yearsExperience} yr{p.yearsExperience === 1 ? '' : 's'} exp</span>
        )}
      </div>

      {p.categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.categories.slice(0, 3).map((c) => (
            <span key={c.id} className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/70">
              {c.icon ? c.icon + ' ' : ''}{c.name}
            </span>
          ))}
          {p.categories.length > 3 && (
            <span className="text-[10px] text-white/40">+{p.categories.length - 3}</span>
          )}
        </div>
      )}

      {p.locations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-white/40">
          {p.locations.slice(0, 2).map((l, i) => (
            <span key={i}>
              {l.name}
              {l.stateName && <span className="text-white/30"> · {l.stateName}</span>}
            </span>
          ))}
          {p.locations.length > 2 && (
            <span>+{p.locations.length - 2} more</span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="text-xs font-medium text-blue-300/70 transition group-hover:text-blue-200">
          View profile
        </span>
        <span className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-blue-300">&#8594;</span>
      </div>
    </Link>
  );
}
