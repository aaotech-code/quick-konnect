'use client';

import { useState } from 'react';

const ITEMS: { q: string; a: string }[] = [
  {
    q: 'Do I have to pay to use Quick-Konnect?',
    a: 'No. Using the platform is free — for customers and for providers. Creating an account, searching for providers, sending messages, requesting quotes and hiring are all free. If we ever introduce paid features (like promoted listings), they will be optional and clearly labeled. Nothing you see today costs money.',
  },
  {
    q: 'How do I know the provider is real?',
    a: 'Every provider profile shows exactly which verification steps they have completed. The strongest is Face Verified — our team has compared their photo against a government-issued ID and a live selfie. Not every provider is Face Verified yet, but the ones who are carry a badge you can trust. Look for it.',
  },
  {
    q: 'What if a different person shows up to do the job?',
    a: 'That is exactly what Face Verified protects against. If someone else arrives, refuse the job immediately and report it. We take this seriously — verified providers who send someone else lose their badge permanently. The person on the profile is the person who works.',
  },
  {
    q: 'Can I pay through Quick-Konnect?',
    a: 'Not yet. Right now, payment is arranged directly between you and the provider — the same way it works when someone recommends a good welder to you. What changes is everything around it: you found them here, you saw their real reviews, and you have our dispute policy on your side. Protected in-platform payment is coming.',
  },
  {
    q: 'Is Quick-Konnect available in my city?',
    a: 'We are launching city by city, on purpose. We would rather have ten verified, working providers in Enugu than a thousand unverified names scattered across the country. Available cities are shown on this page. If yours is not there yet, you can still create an account — you will be first to know when we arrive.',
  },
  {
    q: 'I am a provider. How do I join?',
    a: 'Create a free account, then choose "Become a provider" and build your profile in about five minutes. Add photos of your work, list your services, pick the areas you cover. The more complete your profile, the more customers will reach out. No fees, no commission at launch.',
  },
  {
    q: 'How do reviews work?',
    a: 'Only customers who have completed a real job with a provider can leave a review. That means no fake five-star reviews, no self-promotion, no paid placements pretending to be quality. If a review exists, it came from a real customer after real work.',
  },
  {
    q: 'What areas of Nigeria do you cover?',
    a: 'We are starting with Enugu, Abuja, Benue, Nasarawa, Plateau and Kogi — the cities where we can personally recruit and verify providers. As we grow, we open new states. Wherever we open, we recruit real people first.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left transition hover:text-white"
            >
              <span className="text-base font-medium text-white/90">{it.q}</span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/60 transition ${isOpen ? 'rotate-45 border-white/30 text-white' : ''}`}>
                +
              </span>
            </button>
            {isOpen && (
              <div className="pb-6 pr-12 text-sm leading-7 text-white/55">
                {it.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
