import Image from 'next/image';
import { db } from '@/server/db/client';
import { BrandForm } from './BrandForm';
import { ChatwayForm } from './ChatwayForm';

export default async function AdminSettingsPage() {
  const rows = await db.platformSetting.findMany({
    where: { key: { in: ['site_name', 'site_logo_url', 'chatway_widget_code'] } },
  });
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.value;

  const siteName = typeof map.site_name === 'string' ? map.site_name : 'Quick-Konnect';
  const siteLogo = typeof map.site_logo_url === 'string' ? map.site_logo_url : '';
  const chatwayCode = typeof map.chatway_widget_code === 'string' ? map.chatway_widget_code : '';

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Site settings</h1>
      <p className="mt-1 text-sm text-white/50">
        Brand name, logo, and integrations. Changes apply across the site immediately.
      </p>

      <div className="mt-10 space-y-8">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">Preview</div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 ring-1 ring-white/10">
              {siteLogo ? (
                <Image src={siteLogo} alt={siteName} fill sizes="40px" className="object-contain" unoptimized />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              )}
            </span>
            <span className="text-xl font-semibold tracking-tight">{siteName}</span>
          </div>
        </div>

        <BrandForm initialName={siteName} initialLogo={siteLogo} />
        <ChatwayForm initialCode={chatwayCode} />
      </div>
    </div>
  );
}
