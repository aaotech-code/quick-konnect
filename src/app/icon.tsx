import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 55%, #10b981 100%)',
          borderRadius: 7,
          color: 'white',
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        Q
      </div>
    ),
    { ...size },
  );
}
