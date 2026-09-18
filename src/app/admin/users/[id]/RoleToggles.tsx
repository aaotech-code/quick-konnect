'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { grantRole, revokeRole } from './actions';

export function RoleToggles(props: {
  userId: string;
  userEmail: string;
  allRoles: string[];
  currentRoles: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const router = useRouter();

  function toggle(role: string, has: boolean) {
    setError(null); setOk(null);
    startTransition(async () => {
      try {
        const res = has
          ? await revokeRole(props.userId, role)
          : await grantRole(props.userId, role);
        if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
        setOk((has ? 'Revoked ' : 'Granted ') + role + '.');
        router.refresh();
      } catch {
        setError('Network error.');
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-4">
        Roles
      </div>

      <div className="space-y-2">
        {props.allRoles.map((role) => {
          const has = props.currentRoles.includes(role);
          const dangerous = role === 'admin';
          return (
            <button
              key={role}
              type="button"
              disabled={pending}
              onClick={() => toggle(role, has)}
              className={
                'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition disabled:opacity-50 ' +
                (has
                  ? dangerous
                    ? 'border-red-400/30 bg-red-400/10 text-red-100 hover:bg-red-400/15'
                    : 'border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/15'
                  : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white')
              }
            >
              <span className="font-medium">{role}</span>
              <span className="text-xs">
                {pending ? '…' : has ? 'Revoke' : 'Grant'}
              </span>
            </button>
          );
        })}
      </div>

      {props.currentRoles.includes('admin') && (
        <p className="mt-4 text-[11px] leading-relaxed text-red-200/70">
          Revoking <strong>admin</strong> from <strong>{props.userEmail}</strong> will
          remove access to payment settings, commission configuration, and role
          management. Make sure at least one other admin exists.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          {ok}
        </div>
      )}
    </div>
  );
}
