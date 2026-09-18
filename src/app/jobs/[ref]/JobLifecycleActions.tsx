'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { startJobAction, markCompleteAction, confirmCompletionAction } from './actions';

export function JobLifecycleActions(props: {
  publicRef: string;
  status: string;
  isProvider: boolean;
  isCustomer: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const router = useRouter();

  function run(action: 'start' | 'complete' | 'confirm') {
    setError(null);
    startTransition(async () => {
      let res;
      if (action === 'start') res = await startJobAction(props.publicRef);
      else if (action === 'complete') res = await markCompleteAction(props.publicRef);
      else res = await confirmCompletionAction(props.publicRef);

      if (!res.ok) { setError(res.error ?? 'Failed.'); return; }
      setConfirming(null);
      router.refresh();
    });
  }

  const s = props.status;

  // Provider can start
  if (props.isProvider && s === 'provider_selected') {
    return (
      <ActionCard
        tone="blue"
        title="Ready to start this job?"
        body="Tap below when you begin the work. The customer will see the update immediately."
        actionLabel="Start work"
        pending={pending}
        onAction={() => run('start')}
        error={error}
      />
    );
  }

  // Provider can mark complete
  if (props.isProvider && s === 'in_progress') {
    return (
      <ActionCard
        tone="emerald"
        title="Finished the work?"
        body="Mark this job as complete. The customer will then confirm and leave a review."
        actionLabel="Mark as complete"
        pending={pending}
        onAction={() => run('complete')}
        error={error}
      />
    );
  }

  // Customer can confirm completion
  if (props.isCustomer && s === 'provider_marked_complete') {
    if (confirming === 'confirm') {
      return (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.08] p-5">
          <div className="mb-3 text-sm leading-relaxed text-emerald-100">
            Confirm that the work is done to your satisfaction?
            <div className="mt-2 text-xs text-emerald-100/70">
              Once confirmed, the job is marked complete and you can leave a review.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run('confirm')}
              disabled={pending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {pending ? 'Confirming…' : 'Yes, confirm completion'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={pending}
              className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.1] hover:text-white"
            >
              Not yet
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
              {error}
            </div>
          )}
        </div>
      );
    }

    return (
      <ActionCard
        tone="violet"
        title="Provider marked this job as complete"
        body="Confirm the work is done to your satisfaction. Once confirmed, you can leave a review."
        actionLabel="Confirm completion"
        pending={false}
        onAction={() => setConfirming('confirm')}
        error={error}
      />
    );
  }

  // Waiting state — no action available
  if (s === 'provider_selected') {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-xs leading-relaxed text-amber-100/85">
        <div className="mb-1 font-medium text-amber-100">Waiting for the provider to start</div>
        The provider will mark the job as in-progress when they begin. You will see the update here.
      </div>
    );
  }
  if (s === 'in_progress') {
    return (
      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/[0.05] p-5 text-xs leading-relaxed text-blue-100/85">
        <div className="mb-1 font-medium text-blue-100">Job is in progress</div>
        The provider is working on this now.
      </div>
    );
  }
  if (s === 'completed') {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5 text-xs leading-relaxed text-emerald-100/85">
        <div className="mb-1 font-medium text-emerald-100">This job is complete</div>
        Thank you for using Quick-Konnect.
      </div>
    );
  }

  return null;
}

function ActionCard(props: {
  tone: 'blue' | 'emerald' | 'violet';
  title: string;
  body: string;
  actionLabel: string;
  pending: boolean;
  onAction: () => void;
  error: string | null;
}) {
  const styles = {
    blue: {
      border: 'border-blue-400/30',
      bg: 'bg-blue-400/[0.06]',
      title: 'text-blue-100',
      body: 'text-blue-100/75',
      button: 'bg-blue-500 hover:bg-blue-400',
    },
    emerald: {
      border: 'border-emerald-400/30',
      bg: 'bg-emerald-400/[0.06]',
      title: 'text-emerald-100',
      body: 'text-emerald-100/75',
      button: 'bg-emerald-500 hover:bg-emerald-400',
    },
    violet: {
      border: 'border-violet-400/30',
      bg: 'bg-violet-400/[0.06]',
      title: 'text-violet-100',
      body: 'text-violet-100/75',
      button: 'bg-violet-500 hover:bg-violet-400',
    },
  }[props.tone];

  return (
    <div className={'rounded-2xl border p-5 ' + styles.border + ' ' + styles.bg}>
      <div className={'mb-1 text-sm font-medium ' + styles.title}>{props.title}</div>
      <p className={'mb-4 text-xs leading-relaxed ' + styles.body}>{props.body}</p>
      <button
        type="button"
        onClick={props.onAction}
        disabled={props.pending}
        className={'rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ' + styles.button}
      >
        {props.pending ? 'Please wait…' : props.actionLabel}
      </button>
      {props.error && (
        <div className="mt-3 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
          {props.error}
        </div>
      )}
    </div>
  );
}
