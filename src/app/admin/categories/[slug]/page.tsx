import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/server/db/client';
import { ImageUploadForm } from './ImageUploadForm';

export default async function AdminCategoryEditPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const cat = await db.serviceCategory.findUnique({ where: { slug } });
  if (!cat) notFound();

  return (
    <div>
      <div className="mb-8 text-sm text-white/40">
        <Link href="/admin/categories" className="hover:text-white">Categories</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{cat.name}</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{cat.name}</h1>
      <p className="mt-1 text-sm text-white/50">Category &middot; {cat.slug}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Preview */}
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">Current photo</div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#0b0f16]">
            {cat.imageUrl ? (
              <Image src={cat.imageUrl} alt={cat.name} fill sizes="50vw" className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">No image set</div>
            )}
          </div>
          {cat.imageUrl && (
            <div className="mt-3 break-all rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-white/40">
              {cat.imageUrl}
            </div>
          )}
        </div>

        {/* Upload */}
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">Replace photo</div>
          <ImageUploadForm slug={cat.slug} />
          <div className="mt-4 text-xs text-white/40 leading-relaxed">
            Best results: JPG or PNG, landscape orientation, at least 1200×900px.
            Max 5MB. The new photo goes live immediately.
          </div>
        </div>
      </div>
    </div>
  );
}
