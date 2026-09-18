import Link from 'next/link';
import Image from 'next/image';

type Props = {
  slug: string;
  name: string;
  icon?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  size?: 'default' | 'large';
};

export function CategoryCard(props: Props) {
  const large = props.size === 'large';

  return (
    <Link
      href={'/services/' + props.slug}
      className={
        'group relative block overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0f16] transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.2] ' +
        (large ? 'aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]' : 'aspect-[4/5]')
      }
    >
      {/* Photo */}
      {props.imageUrl ? (
        <Image
          src={props.imageUrl}
          alt={props.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
      )}

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Name + arrow */}
      <div className="relative flex h-full flex-col justify-end p-5 sm:p-6">
        <div
          className={
            'font-semibold tracking-tight text-white leading-tight drop-shadow-lg ' +
            (large ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl')
          }
        >
          {props.name}
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/80 transition group-hover:text-white">
          Browse providers
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </Link>
  );
}
