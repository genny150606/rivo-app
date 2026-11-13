/* eslint-disable @next/next/no-img-element */
import type { ReactElement } from 'react';

export interface CoBrandedOgCardProps {
  variant: 'card' | 'icon';
  businessName: string;
  city?: string | null;
  category?: string | null;
  rivoLogoDataUri: string | null;
  prospectLogoDataUri: string | null;
  initials: string;
}

function clampHeadlineName(businessName: string): string {
  const cleaned = (businessName || 'Anteprima RIVO').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Anteprima RIVO';
  if (cleaned.length <= 44) return cleaned;
  return `${cleaned.slice(0, 43).trimEnd()}…`;
}

function normalizeInitials(initials: string): string {
  const cleaned = (initials || 'RV').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return cleaned || 'RV';
}

/**
 * Renders a Satori-compatible JSX tree for Next.js `ImageResponse` (`next/og`).
 * Supports the 1200x630 co-branded Open Graph card (`card`) and the 256x256 app/link icon (`icon`).
 */
export function renderCoBrandedOgElement(props: CoBrandedOgCardProps): ReactElement {
  const {
    variant,
    businessName,
    city,
    category,
    rivoLogoDataUri,
    prospectLogoDataUri,
    initials,
  } = props;

  const displayName = clampHeadlineName(businessName);
  const safeInitials = normalizeInitials(initials);

  if (variant === 'icon') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090B',
          borderRadius: 48,
          border: '4px solid #27272A',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 180,
            height: 84,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {rivoLogoDataUri ? (
              <img
                src={rivoLogoDataUri}
                alt="RIVO"
                width={56}
                height={56}
                style={{ width: 56, height: 56, objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#09090B',
                }}
              >
                R
              </div>
            )}
          </div>

          {prospectLogoDataUri ? (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={prospectLogoDataUri}
                alt={displayName}
                width={60}
                height={60}
                style={{ width: 60, height: 60, objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 20,
                backgroundColor: '#18181B',
                border: '2px solid #BFFF00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BFFF00',
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: '1px',
              }}
            >
              {safeInitials}
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              left: 73,
              top: 25,
              width: 34,
              height: 34,
              borderRadius: 9999,
              backgroundColor: '#BFFF00',
              border: '3px solid #09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#09090B',
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            +
          </div>
        </div>
      </div>
    );
  }

  const cleanCity = city?.trim() || null;
  const cleanCategory = category?.trim() || null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090B',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(191, 255, 0, 0.16) 0%, rgba(191, 255, 0, 0.04) 40%, rgba(9, 9, 11, 0) 72%)',
        border: '2px solid #27272A',
        position: 'relative',
        padding: '44px 64px',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundImage:
            'linear-gradient(90deg, rgba(191, 255, 0, 0) 0%, #BFFF00 50%, rgba(191, 255, 0, 0) 100%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: '10px 22px',
          borderRadius: 9999,
          backgroundColor: 'rgba(191, 255, 0, 0.08)',
          border: '1px solid rgba(191, 255, 0, 0.28)',
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 8,
            height: 8,
            borderRadius: 9999,
            backgroundColor: '#BFFF00',
          }}
        />
        <div
          style={{
            display: 'flex',
            color: '#BFFF00',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          ANTEPRIMA INTERATTIVA RIVO
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            width: 172,
            height: 172,
            borderRadius: 34,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {rivoLogoDataUri ? (
            <img
              src={rivoLogoDataUri}
              alt="RIVO"
              width={116}
              height={116}
              style={{ width: 116, height: 116, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                fontWeight: 900,
                color: '#09090B',
                letterSpacing: '2px',
              }}
            >
              RIVO
            </div>
          )}
        </div>

        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 9999,
            backgroundColor: '#BFFF00',
            boxShadow: '0 0 36px rgba(191, 255, 0, 0.42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#09090B',
            fontSize: 42,
            fontWeight: 900,
          }}
        >
          +
        </div>

        {prospectLogoDataUri ? (
          <div
            style={{
              width: 172,
              height: 172,
              borderRadius: 34,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={prospectLogoDataUri}
              alt={displayName}
              width={128}
              height={128}
              style={{ width: 128, height: 128, objectFit: 'contain' }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 172,
              height: 172,
              borderRadius: 34,
              backgroundColor: '#18181B',
              border: '2px solid rgba(191, 255, 0, 0.45)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#BFFF00',
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: '2px',
            }}
          >
            {safeInitials}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 1040,
            fontSize: 46,
            fontWeight: 800,
            color: '#FAFAFA',
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {`RIVO + ${displayName}`}
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {cleanCity ? (
            <div style={{ display: 'flex', color: '#A1A1AA', fontSize: 22, fontWeight: 500 }}>
              {cleanCity}
            </div>
          ) : null}

          {cleanCity && cleanCategory ? (
            <div style={{ display: 'flex', color: '#52525B', fontSize: 22 }}>•</div>
          ) : null}

          {cleanCategory ? (
            <div style={{ display: 'flex', color: '#A1A1AA', fontSize: 22, fontWeight: 500 }}>
              {cleanCategory}
            </div>
          ) : null}

          {cleanCity || cleanCategory ? (
            <div style={{ display: 'flex', color: '#52525B', fontSize: 22 }}>•</div>
          ) : null}

          <div style={{ display: 'flex', color: '#BFFF00', fontSize: 22, fontWeight: 600 }}>
            Vista Cliente &amp; Vista Titolare Live
          </div>
        </div>
      </div>
    </div>
  );
}
