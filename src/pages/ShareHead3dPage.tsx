import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../modules/i18n';
import { Box, Download, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';

interface Head3dShareData {
  slug: string;
  preview_url: string;
  skin_url: string;
  face_urls: {
    head: Record<string, string>;
    overlay: Record<string, string>;
  };
  creator_name: string | null;
  description: string | null;
  created_at: string;
}

const FACE_METADATA: Record<'head' | 'overlay', Record<string, { nameKey: string; nameDefault: string; x: number; y: number }>> = {
  head: {
    top: { nameKey: 'face_top', nameDefault: 'Superior (Top)', x: 8, y: 0 },
    bottom: { nameKey: 'face_bottom', nameDefault: 'Inferior (Bottom)', x: 16, y: 0 },
    left: { nameKey: 'face_left', nameDefault: 'Izquierda (Left)', x: 0, y: 8 },
    front: { nameKey: 'face_front', nameDefault: 'Frente (Front)', x: 8, y: 8 },
    right: { nameKey: 'face_right', nameDefault: 'Derecha (Right)', x: 16, y: 8 },
    back: { nameKey: 'face_back', nameDefault: 'Detrás (Back)', x: 24, y: 8 },
  },
  overlay: {
    top: { nameKey: 'face_top', nameDefault: 'Superior (Top)', x: 40, y: 0 },
    bottom: { nameKey: 'face_bottom', nameDefault: 'Inferior (Bottom)', x: 48, y: 0 },
    left: { nameKey: 'face_left', nameDefault: 'Izquierda (Left)', x: 32, y: 8 },
    front: { nameKey: 'face_front', nameDefault: 'Frente (Front)', x: 40, y: 8 },
    right: { nameKey: 'face_right', nameDefault: 'Derecha (Right)', x: 48, y: 8 },
    back: { nameKey: 'face_back', nameDefault: 'Detrás (Back)', x: 56, y: 8 },
  }
};

export default function ShareHead3dPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<Head3dShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'head' | 'overlay'>('head');
  const [downloadingSkin, setDownloadingSkin] = useState(false);

  useEffect(() => {
    async function fetchShare() {
      if (!slug) return;
      try {
        const { data: shareData, error: fetchErr } = await supabase
          .from('shares_head3d')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchErr || !shareData) {
          throw new Error('Share link not found or invalid.');
        }

        setData(shareData);
      } catch (err: any) {
        setError(err.message || 'Failed to load share data.');
      } finally {
        setLoading(false);
      }
    }
    fetchShare();
  }, [slug]);

  const handleDownloadSkin = async () => {
    if (!data?.skin_url) return;
    setDownloadingSkin(true);
    try {
      const res = await fetch(data.skin_url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'shared_minecraft_skin.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Failed to download skin:', e);
    } finally {
      setDownloadingSkin(false);
    }
  };

  const handleOpenInApp = () => {
    if (!data?.skin_url) return;
    // Redirect to the head3d module and pass the skin_url parameter
    navigate(`/head3d?skinUrl=${encodeURIComponent(data.skin_url)}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(129, 140, 248, 0.2)',
          borderTopColor: '#818cf8',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Loading shared assets...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ margin: 0, color: '#f87171', fontSize: '1.5rem', fontWeight: 700 }}>Link Expired or Invalid</h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {error || "The shared conversion doesn't exist."}
          </p>
          <button className="glow-btn" onClick={() => navigate('/')} style={{ padding: '12px' }}>
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const currentFaces = data.face_urls[activeTab] || {};

  return (
    <div className="layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="app-container" style={{ flexGrow: 1, padding: '24px 0', maxWidth: '1200px', margin: '0 auto', width: '90%' }}>
        
        {/* Header */}
        <header className="glass-panel app-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Box className="logo-icon" size={32} style={{ color: '#818cf8' }} />
            <div>
              <h1 className="logo-text" style={{ margin: 0 }}>SkinBridge</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>{t('share_title_head3d')}</p>
            </div>
          </div>
          <button className="glow-btn-secondary" onClick={() => navigate('/head3d')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <ArrowLeft size={16} /> {t('nav_dashboard')}
          </button>
        </header>

        {/* Main Grid */}
        <main className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left Panel: Preview screenshot & actions */}
          <section className="glass-panel sidebar-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="badge" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                {t('dash_share_creator')}: {data.creator_name || 'Anonymous'}
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 800 }}>
                {data.creator_name ? `${data.creator_name}'s 3D Head` : 'Shared 3D Head'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.5' }}>
                {data.description || 'No description provided.'}
              </p>
            </div>

            {/* Preview image */}
            <div className="viewer-canvas-container" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0c0c0e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              <img 
                src={data.preview_url} 
                alt="3D Head Render Screenshot" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
              />
            </div>

            {/* Info Box about 3D exporters */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontSize: '0.85rem', lineHeight: '1.5' }}>
              <HelpCircle size={24} style={{ flexShrink: 0, color: '#818cf8' }} />
              <p style={{ margin: 0 }}>{t('share_model_info')}</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="glow-btn" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }}
                onClick={handleOpenInApp}
              >
                <ExternalLink size={18} /> {t('share_open_app')} → /head3d
              </button>
              
              <button 
                className="glow-btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                onClick={handleDownloadSkin}
                disabled={downloadingSkin}
              >
                <Download size={18} /> {downloadingSkin ? 'Downloading...' : t('share_download_skin')}
              </button>
            </div>
          </section>

          {/* Right Panel: Extracted Faces */}
          <section className="glass-panel viewer-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700 }}>{t('extracted_faces')}</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>
                All 6 textures cropped at official Minecraft skin mapping boundaries.
              </p>
            </div>

            {/* Layer tabs */}
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'head' ? 'active' : ''}`}
                onClick={() => setActiveTab('head')}
              >
                {t('tab_base_layer')}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'overlay' ? 'active' : ''}`}
                onClick={() => setActiveTab('overlay')}
              >
                {t('tab_outer_layer')}
              </button>
            </div>

            {/* Grid of faces */}
            <div className="faces-grid">
              {Object.entries(currentFaces).map(([key, url]) => {
                const meta = FACE_METADATA[activeTab][key] || { nameDefault: key, x: 0, y: 0 };
                return (
                  <div key={key} className="face-card">
                    <div className="face-img-container">
                      <img src={url} alt={meta.nameDefault} className="face-img" />
                    </div>
                    <span className="face-label">{meta.nameDefault.split(' ')[0]}</span>
                    <span className="face-coords">x:{meta.x} y:{meta.y}</span>
                  </div>
                );
              })}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
