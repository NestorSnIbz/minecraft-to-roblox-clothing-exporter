import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../modules/i18n';
import { Box, Download, ArrowLeft, ExternalLink } from 'lucide-react';

interface RobloxShareData {
  slug: string;
  skin_url: string;
  shirt_url: string;
  pants_url: string;
  preview_url: string | null;
  arm_type: 'steve' | 'alex';
  creator_name: string | null;
  description: string | null;
  created_at: string;
}

export default function ShareRobloxPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<RobloxShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingShirt, setDownloadingShirt] = useState(false);
  const [downloadingPants, setDownloadingPants] = useState(false);

  useEffect(() => {
    async function fetchShare() {
      if (!slug) return;
      try {
        const { data: shareData, error: fetchErr } = await supabase
          .from('shares_roblox')
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

  const handleDownload = async (url: string, filename: string, setDownloading: (val: boolean) => void) => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('Failed to download file:', e);
    } finally {
      setDownloading(false);
    }
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

  return (
    <div className="layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="app-container" style={{ flexGrow: 1, padding: '24px 0', maxWidth: '1200px', margin: '0 auto', width: '90%' }}>
        
        {/* Header */}
        <header className="glass-panel app-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Box className="logo-icon" size={32} style={{ color: '#818cf8' }} />
            <div>
              <h1 className="logo-text" style={{ margin: 0 }}>SkinBridge</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>{t('share_title_roblox')}</p>
            </div>
          </div>
          <button className="glow-btn-secondary" onClick={() => navigate('/roblox')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <ArrowLeft size={16} /> {t('nav_dashboard')}
          </button>
        </header>

        {/* Main Grid */}
        <main className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Left Panel: Preview & Actions */}
          <section className="glass-panel sidebar-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="badge" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
                {t('dash_share_creator')}: {data.creator_name || 'Anonymous'}
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 800 }}>
                {data.creator_name ? `${data.creator_name}'s Outfit` : 'Shared Outfit'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.5' }}>
                {data.description || 'No description provided.'}
              </p>
            </div>

            {/* Preview Canvas / Image */}
            <div className="viewer-canvas-container" style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0c0c0e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
              {data.preview_url ? (
                <img 
                  src={data.preview_url} 
                  alt="R6 Avatar Render" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
                />
              ) : (
                <div style={{ color: '#52525b', fontSize: '0.9rem', textAlign: 'center' }}>No 3D Preview Available</div>
              )}
            </div>

            {/* Arm Type info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>{t('arm_type')}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#818cf8', textTransform: 'capitalize' }}>
                {data.arm_type === 'alex' ? t('arm_slim') : t('arm_classic')}
              </span>
            </div>

            {/* Open Editor Button */}
            <button 
              className="glow-btn" 
              onClick={() => {
                if (data.skin_url) {
                  navigate(`/roblox?skinUrl=${encodeURIComponent(data.skin_url)}`);
                } else {
                  navigate('/roblox');
                }
              }} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }}
            >
              <ExternalLink size={18} /> {t('share_open_app')} → /roblox
            </button>
          </section>

          {/* Right Panel: Template Outputs */}
          <section className="glass-panel viewer-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 700 }}>Roblox Classic Templates</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>
                Upload these templates to Roblox to publish your classic clothing assets.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {/* Shirt Card */}
              <div className="template-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>{t('template_shirt_title')}</h3>
                <div style={{ width: '100%', height: '180px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <img src={data.shirt_url} alt="Shirt Template" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <button 
                  className="glow-btn-roblox" 
                  style={{ width: '100%', padding: '10px' }} 
                  onClick={() => handleDownload(data.shirt_url, 'shirt.png', setDownloadingShirt)}
                  disabled={downloadingShirt}
                >
                  <Download size={16} /> {downloadingShirt ? 'Downloading...' : t('btn_download_shirt')}
                </button>
              </div>

              {/* Pants Card */}
              <div className="template-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>{t('template_pants_title')}</h3>
                <div style={{ width: '100%', height: '180px', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <img src={data.pants_url} alt="Pants Template" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <button 
                  className="glow-btn-roblox" 
                  style={{ width: '100%', padding: '10px' }} 
                  onClick={() => handleDownload(data.pants_url, 'pants.png', setDownloadingPants)}
                  disabled={downloadingPants}
                >
                  <Download size={16} /> {downloadingPants ? 'Downloading...' : t('btn_download_pants')}
                </button>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
