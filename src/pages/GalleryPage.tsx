import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../modules/i18n';
import { Box, ArrowLeft, ExternalLink } from 'lucide-react';
import { Head } from 'vite-react-ssg';

interface ShareItem {
  slug: string;
  creator_name: string | null;
  description: string | null;
  preview_url: string | null;
  skin_url: string;
  type: 'roblox' | 'head3d';
  created_at: string;
}

export default function GalleryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: fetchResult, error: fetchErr } = await supabase
          .from('shares_all')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (fetchErr) {
          throw fetchErr;
        }

        setItems(fetchResult || []);
      } catch (err: any) {
        console.error('Failed to fetch gallery shares:', err);
        setError(err.message || 'Failed to load gallery items.');
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  return (
    <div className="layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Community Gallery | SkinBridge</title>
        <meta name="description" content="Browse 3D heads, Roblox outfit templates, and character skins shared by the SkinBridge community in the last 7 days." />
        <meta property="og:title" content="Community Gallery | SkinBridge" />
        <meta property="og:description" content="Browse 3D heads, Roblox outfit templates, and character skins shared by the SkinBridge community in the last 7 days." />
        <link rel="canonical" href="https://minecraft-to-roblox-clothing-export.vercel.app/gallery" />
      </Head>

      <div className="app-container" style={{ flexGrow: 1, padding: '24px 0', maxWidth: '1200px', margin: '0 auto', width: '90%' }}>
        
        {/* Header */}
        <header className="glass-panel app-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <Box className="logo-icon" size={32} style={{ color: '#818cf8' }} />
            <div>
              <h1 className="logo-text" style={{ margin: 0 }}>SkinBridge</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>Community Gallery</p>
            </div>
          </div>
          <button className="glow-btn-secondary" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            <ArrowLeft size={16} /> {t('nav_dashboard')}
          </button>
        </header>

        {loading ? (
          /* Loading State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(129, 140, 248, 0.2)',
              borderTopColor: '#818cf8',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Loading gallery...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, color: '#f87171', fontSize: '1.25rem', fontWeight: 700 }}>Error Loading Gallery</h3>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem' }}>
                {error || 'Failed to load gallery items.'}
              </p>
              <button className="glow-btn" onClick={() => window.location.reload()} style={{ padding: '10px' }}>
                Retry
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' }}>
            <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>No shared conversions yet</h3>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Be the first to share!
              </p>
              <button className="glow-btn" onClick={() => navigate('/dashboard')} style={{ padding: '12px' }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Populated State */
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Community Gallery
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '1rem' }}>
                  Conversions shared in the last 7 days
                </p>
              </div>
              <span className="badge" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                {items.length} items
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {items.map((item) => (
                <div key={item.slug} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', padding: '16px', gap: '16px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                  
                  {/* Preview Image */}
                  <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0e', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={item.preview_url || item.skin_url} 
                      alt={item.creator_name || 'Shared skin'} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
                    />
                    
                    {/* Badge */}
                    <span className="badge" style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: item.type === 'roblox' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)', borderColor: item.type === 'roblox' ? '#818cf8' : '#34d399', color: item.type === 'roblox' ? '#818cf8' : '#34d399', fontSize: '0.7rem', padding: '4px 8px' }}>
                      {item.type === 'roblox' ? 'Roblox Outfit' : '3D Head'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>
                        @{item.creator_name || 'Anonymous'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                    
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#e4e4e7', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.9em' }}>
                      {item.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* View button */}
                  <button className="glow-btn" onClick={() => navigate(item.type === 'roblox' ? `/share/roblox/${item.slug}` : `/share/head3d/${item.slug}`)} style={{ width: '100%', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    View <ExternalLink size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
