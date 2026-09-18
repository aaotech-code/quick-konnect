'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type Latest = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

const SEEN_KEY = 'qk_seen_notification_ids';

function getSeenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setSeenIds(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-100)));
  } catch {
    // ignore
  }
}

export function NotificationListener() {
  const pathname = usePathname();

  // Do not show the prompt on auth pages
  const hiddenPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = hiddenPaths.some((p) => pathname?.startsWith(p));
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as any);
    if (window.sessionStorage.getItem('qk_notif_prompt_dismissed') === '1') {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const seen = new Set<string>(getSeenIds());

    async function tick() {
      try {
        const res = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const latest: Latest[] = data.latest ?? [];

        for (const n of latest) {
          if (seen.has(n.id)) continue;
          seen.add(n.id);

          const age = Date.now() - new Date(n.createdAt).getTime();
          if (age > 120000) continue;

          fireNotification(n);
        }

        setSeenIds(Array.from(seen));
      } catch {
        // ignore
      }
    }

    function fireNotification(n: Latest) {
      try {
        const osNotif = new Notification(n.title, {
          body: n.body,
          icon: '/apple-icon',
          badge: '/apple-icon',
          tag: n.id,
          requireInteraction: false,
          silent: false,
        });
        osNotif.onclick = () => {
          window.focus();
          if (n.href) window.location.href = n.href;
          osNotif.close();
        };
      } catch {
        // ignore
      }
      playChime();
    }

    function playChime() {
      try {
        const AC = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AC) return;
        const ctx = new AC();
        const now = ctx.currentTime;

        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + duration + 0.05);
        };

        playTone(880, 0, 0.2);
        playTone(1320, 0.12, 0.35);

        setTimeout(() => ctx.close(), 1000);
      } catch {
        // ignore
      }
    }

    const initial = setTimeout(tick, 5000);
    const interval = setInterval(tick, 20000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [permission]);

  async function requestPermission() {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as any);
      if (result === 'granted') {
        try {
          new Notification('Quick-Konnect', {
            body: 'Notifications enabled. You will be alerted when something happens.',
            icon: '/apple-icon',
          });
        } catch {}
      }
    } catch {}
  }

  function dismiss() {
    setDismissed(true);
    try { window.sessionStorage.setItem('qk_notif_prompt_dismissed', '1'); } catch {}
  }

  if (isAuthPage) return null;
  if (permission === 'granted' || permission === 'denied' || permission === 'unsupported' || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-2xl border border-white/10 bg-[#0b0f16] p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-lg">
          🔔
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white">Turn on notifications?</div>
          <p className="mt-0.5 text-xs leading-relaxed text-white/55">
            Get a soft sound and a badge when a customer replies, a job updates, or a quote arrives.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={requestPermission}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#05070b] transition hover:bg-blue-50"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
