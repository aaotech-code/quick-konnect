'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#05070b', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600 }}>Application error</h1>
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 420, lineHeight: 1.6 }}>
            Something went wrong at the top level. Reload the page to try again.
          </p>
          {error.digest && (
            <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ marginTop: 32, padding: '12px 20px', background: '#fff', color: '#05070b', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
