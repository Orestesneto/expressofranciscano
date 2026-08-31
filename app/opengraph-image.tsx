import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Expresso Franciscano — Produtos personalizados e exclusivos';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#241006',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 440,
            height: 440,
            borderRadius: 999,
            right: -80,
            top: -110,
            background: '#c2410c',
            opacity: 0.72,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: 999,
            right: 190,
            bottom: -170,
            background: '#f59e0b',
            opacity: 0.9,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '72px 84px',
            width: 900,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 8,
              color: '#fbbf24',
              marginBottom: 26,
            }}
          >
            LOJA ONLINE
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 900, letterSpacing: -3 }}>
            EXPRESSO FRANCISCANO
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.25,
              color: '#ffedd5',
              maxWidth: 800,
            }}
          >
            Produtos personalizados e exclusivos para transformar suas ideias em realidade.
          </div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              marginTop: 42,
              padding: '15px 24px',
              borderRadius: 999,
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 23,
              fontWeight: 700,
            }}
          >
            Pagamento via Pix · Retirada presencial
          </div>
        </div>
      </div>
    ),
    size,
  );
}
