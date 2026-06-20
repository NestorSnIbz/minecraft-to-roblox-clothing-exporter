import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from '../modules/i18n';

interface AdColumnProps {
  position: 'left' | 'right';
}

export default function AdColumn({ position }: AdColumnProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <aside 
      className={`side-ad-column ${position}`}
      style={{
        width: '160px',
        height: '600px',
        position: 'sticky',
        top: '24px',
        zIndex: 50,
      }}
    >
      <div className="glass-panel ad-container-inner" style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 12px',
        position: 'relative',
        background: 'rgba(15, 15, 20, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {/* Header with Close Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          paddingBottom: '8px',
          marginBottom: '12px',
        }}>
          <span style={{
            fontSize: '0.65rem',
            color: '#71717a',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 700,
          }}>
            {t('ad_advertisement')}
          </span>
          <button 
            onClick={() => setVisible(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            className="ad-close-btn"
            title="Dismiss Ad"
          >
            <X size={14} />
          </button>
        </div>

        {/* Sponsor Content (Mock Ad) */}
        <a 
          href="https://github.com/NestorSnIbz/minecraft-to-roblox-clothing-exporter"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
          }}
          className="ad-sponsor-link"
        >
          {/* Logo or Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }} className="ad-icon-container">
            <Sparkles size={28} style={{ color: '#818cf8' }} className="ad-icon-svg" />
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '16px',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
              animation: 'pulse 2s infinite alternate',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <h4 style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              margin: 0,
              color: '#e4e4e7',
            }}>
              {t('ad_sponsor_title')}
            </h4>
            <p style={{
              fontSize: '0.72rem',
              color: '#a1a1aa',
              margin: 0,
              lineHeight: '1.4',
              padding: '0 4px',
            }}>
              {t('ad_sponsor_desc')}
            </p>
          </div>

          {/* Call to action badge */}
          <div className="badge ad-cta-badge" style={{
            fontSize: '0.65rem',
            padding: '4px 10px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            marginTop: '8px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
          }}>
            GitHub Project
          </div>
        </a>

        {/* Footer info */}
        <div style={{
          width: '100%',
          textAlign: 'center',
          fontSize: '0.55rem',
          color: '#3f3f46',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '8px',
          marginTop: '12px',
        }}>
          SkinBridge Ads
        </div>
      </div>
    </aside>
  );
}
