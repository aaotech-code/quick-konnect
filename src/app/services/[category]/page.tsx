import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { Navbar } from '@/components/marketplace/Navbar';
import { Footer } from '@/components/marketplace/Footer';

export default async function CategoryPage(props: { params: Promise<{ category: string }> }) {
  const { category: slug } = await props.params;

  const cat = await db.serviceCategory.findUnique({ where: { slug } });
  if (!cat) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="text-sm text-gray-500 mb-3">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{cat.name}</span>
        </div>

        <h1 className="text-3xl font-semibold text-gray-900">{cat.name}</h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          {cat.description ?? 'Find trusted local providers for ' + cat.name.toLowerCase() + '.'}
        </p>

        <div className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="font-medium text-gray-900 mb-2">Provider listings coming next</div>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            This is where verified providers offering {cat.name.toLowerCase()} will appear,
            with profiles, ratings, and the ability to request quotes. We are onboarding the
            first providers in our launch cities now.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Request a service
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
