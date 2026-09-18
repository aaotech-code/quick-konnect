import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthContext } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { Navbar } from '@/components/marketplace/Navbar';
import { RequestForm } from './RequestForm';

export const metadata = { title: 'Post a job — Quick-Konnect' };

export default async function NewRequestPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');

  const [categories, cities] = await Promise.all([
    db.serviceCategory.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    db.location.findMany({
      where: { type: 'city', isActive: true },
      orderBy: { name: 'asc' },
      include: { parent: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#05070b] text-white">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white">← Back</Link>
        </div>

        <div className="mb-10">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300/70">Post a job</div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Describe what needs doing.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
            Fill in the details once. Verified providers who offer this service
            in this location will send you quotes. You compare, then choose.
          </p>
        </div>

        <RequestForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            children: c.children.map((ch) => ({
              id: ch.id,
              name: ch.name,
              icon: ch.icon,
            })),
          }))}
          locations={cities.map((l) => ({
            id: l.id,
            name: l.name,
            stateName: l.parent?.name ?? '',
          }))}
        />
      </main>
    </div>
  );
}
