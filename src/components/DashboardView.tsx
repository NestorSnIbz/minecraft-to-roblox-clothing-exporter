import { useState, useEffect } from 'react';
import { Box, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ActivityItem {
  id: string;
  actionKey: string;
  details: string;
  timestamp: number;
}

interface AppStats {
  conversions: number;
  exports: number;
  headUsage: number;
  robloxUsage: number;
  formats: Record<string, number>;
  activity: ActivityItem[];
}

interface DashboardViewProps {
  stats: AppStats;
  navigateToModule: (module: 'dashboard' | 'head3d' | 'roblox') => void;
}

const getBlockBar = (pct: number, length: number = 20) => {
  const filledCount = Math.round((pct / 100) * length);
  const emptyCount = Math.max(0, length - filledCount);
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
};

export default function DashboardView({ stats, navigateToModule }: DashboardViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const filteredActivity = stats.activity.filter(item => item.actionKey !== 'act_visit');

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  const fetchSharedHistory = async (page: number) => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE - 1;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error: fetchErr, count } = await supabase
        .from('shares_all')
        .select('*', { count: 'exact' })
        .gte('created_at', oneWeekAgo)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (fetchErr) throw fetchErr;

      const mapped = (data || []).map((row: any) => ({
        slug: row.slug,
        type: row.type,
        creatorName: row.creator_name || 'Anonymous',
        description: row.description,
        previewUrl: row.preview_url,
        skinUrl: row.skin_url,
        createdAt: row.created_at
      }));

      setHistory(mapped);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching shared history:', err);
      setHistoryError(err.message || 'Failed to load shared history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSharedHistory(currentPage);
  }, [currentPage]);

  const handleCopyLink = (type: string, slug: string) => {
    const url = `${window.location.origin}/share/${type}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleLoadSkin = (type: 'roblox' | 'head3d', skinUrl: string) => {
    navigate(`/${type}?skinUrl=${encodeURIComponent(skinUrl)}`);
  };

  return (
    <section className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', boxSizing: 'border-box' }}>
      {/* Welcome Area */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(129, 140, 248, 0.05) 100%)' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t('dash_welcome')}
        </h2>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '700px' }}>
          {t('dash_subtitle')}
        </p>
      </div>

      {/* Tool Launch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Card 1: Head3D */}
        <div className="glass-panel workspace-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={24} style={{ color: '#818cf8' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('dash_head3d_title')}</h3>
          </div>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem', lineHeight: '1.5', flexGrow: 1 }}>
            {t('dash_head3d_desc')}
          </p>
          <button className="glow-btn" onClick={() => navigateToModule('head3d')} style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
            {t('dash_launch_workspace')}
          </button>
        </div>

        {/* Card 2: Roblox */}
        <div className="glass-panel workspace-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="#f87171" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M20.37 8.91l-8.17-4.08a1 1 0 0 0-.9 0L3.13 8.91a1 1 0 0 0 0 1.78l8.17 4.08a1 1 0 0 0 .9 0l8.17-4.08a1 1 0 0 0 0-1.78z" />
                <path d="M12 14.88V21" />
                <path d="M3.13 14.91L12 19.34l8.87-4.43" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{t('dash_roblox_title')}</h3>
          </div>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem', lineHeight: '1.5', flexGrow: 1 }}>
            {t('dash_roblox_desc')}
          </p>
          <button className="glow-btn-roblox" onClick={() => navigateToModule('roblox')} style={{ padding: '10px 16px', fontSize: '0.9rem' }}>
            {t('dash_launch_workspace')}
          </button>
        </div>
      </div>

      {/* Analytics & Stats Section */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {t('dash_stats_title')}
        </h3>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="kpi-card">
            <span className="voxel-caption">{t('dash_stat_conversions')}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.conversions}</span>
          </div>
          <div className="kpi-card">
            <span className="voxel-caption">{t('dash_stat_exports')}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.exports}</span>
          </div>
          <div className="kpi-card">
            <span className="voxel-caption">{t('dash_stat_favorite')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(() => {
                const sorted = Object.entries(stats.formats).sort((a, b) => b[1] - a[1]);
                return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : 'N/A';
              })()}
            </span>
          </div>
          <div className="kpi-card">
            <span className="voxel-caption">{t('dash_stat_favorite_tool')}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stats.headUsage === 0 && stats.robloxUsage === 0
                ? 'N/A'
                : stats.headUsage >= stats.robloxUsage
                  ? t('module_3d_head')
                  : t('module_roblox')
              }
            </span>
          </div>
        </div>

        {/* Graphs / Charts Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '12px' }}>
          {/* Distribution Chart (Workspace Usage) */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 className="voxel-caption" style={{ margin: 0 }}>{t('dash_stat_favorite_tool')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', height: '140px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {(() => {
                const total = stats.headUsage + stats.robloxUsage;
                const headPct = total > 0 ? Math.round((stats.headUsage / total) * 100) : 0;
                const robloxPct = total > 0 ? Math.round((stats.robloxUsage / total) * 100) : 0;
                
                return (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f4f4f5' }}>
                        <span>{t('module_3d_head')}</span>
                        <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{headPct}% ({stats.headUsage})</span>
                      </div>
                      <div style={{ color: '#8b5cf6', letterSpacing: '2px', fontSize: '1rem', userSelect: 'none' }}>
                        [{getBlockBar(headPct, 20)}]
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f4f4f5' }}>
                        <span>{t('module_roblox')}</span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{robloxPct}% ({stats.robloxUsage})</span>
                      </div>
                      <div style={{ color: '#ef4444', letterSpacing: '2px', fontSize: '1rem', userSelect: 'none' }}>
                        [{getBlockBar(robloxPct, 20)}]
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Format Popularity Bar Chart */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 className="voxel-caption" style={{ margin: 0 }}>{t('dash_stat_favorite')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center', height: '140px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {(() => {
                const formats = ['GLB', 'BBMODEL', 'Shirt', 'Pants'];
                const maxVal = Math.max(...formats.map(f => stats.formats[f] || 0), 1);
                const sum = formats.reduce((s, f) => s + (stats.formats[f] || 0), 0);
                
                if (sum === 0) {
                  return <p style={{ color: '#71717a', textAlign: 'center', margin: 0 }}>NO DATA RECORDED</p>;
                }
                
                return formats.map(f => {
                  const val = stats.formats[f] || 0;
                  const pct = Math.round((val / maxVal) * 100);
                  const color = (f === 'Shirt' || f === 'Pants') ? '#ef4444' : '#8b5cf6';
                  return (
                    <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f4f4f5' }}>
                        <span>{f}</span>
                        <span style={{ color, fontWeight: 'bold' }}>{val} units ({pct}%)</span>
                      </div>
                      <div style={{ color, letterSpacing: '1px', userSelect: 'none' }}>
                        [{getBlockBar(pct, 24)}]
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {t('dash_recent_activity')}
        </h3>

        {filteredActivity.length === 0 ? (
          <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
            {t('dash_no_activity')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredActivity.map((item) => {
              let badgeBg = 'rgba(99, 102, 241, 0.1)';
              let badgeText = '#818cf8';
              let iconStr = '⚡';

              if (item.actionKey === 'act_export') {
                badgeBg = 'rgba(16, 185, 129, 0.1)';
                badgeText = '#34d399';
                iconStr = '⬇️';
              } else if (item.actionKey === 'act_visit') {
                badgeBg = 'rgba(245, 158, 11, 0.1)';
                badgeText = '#fbbf24';
                iconStr = '📂';
              }

              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={item.id} className="activity-item">
                  <div style={{ background: badgeBg, color: badgeText, padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <span>{iconStr}</span>
                    <span>
                      {item.actionKey === 'act_upload'
                        ? t('act_upload', { name: item.details })
                        : item.actionKey === 'act_export'
                          ? t('act_export', { format: item.details.split('.').pop()?.toUpperCase() || 'FILE', name: item.details })
                          : t('act_visit', { tool: item.details })}
                    </span>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#71717a' }}>{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shared Conversions History */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {t('dash_shared_history')}
          </h3>
          <button 
            className="glow-btn-secondary" 
            onClick={() => fetchSharedHistory(currentPage)}
            disabled={loadingHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} style={{ animation: loadingHistory ? 'spin 1.5s linear infinite' : 'none' }} />
            {t('dash_btn_refresh')}
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid rgba(129, 140, 248, 0.2)',
              borderTopColor: '#818cf8',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{t('dash_loading_shared')}</p>
          </div>
        ) : historyError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '12px', color: '#f87171' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('dash_error_shared').replace('{error}', historyError)}</p>
            <button className="glow-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => fetchSharedHistory(currentPage)}>
              {t('dash_btn_refresh')}
            </button>
          </div>
        ) : history.length === 0 ? (
          <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
            {t('dash_no_shared')}
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {history.map((item) => (
                <div 
                  key={item.slug} 
                  className="glass-panel" 
                  style={{ 
                    padding: '16px', 
                    display: 'flex', 
                    gap: '12px', 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    alignItems: 'center'
                  }}
                >
                  {/* 3D Preview Thumbnail */}
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '6px', 
                    background: '#0c0c0e', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0
                  }}>
                    {item.previewUrl ? (
                      <img 
                        src={item.previewUrl} 
                        alt="Thumbnail" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
                      />
                    ) : (
                      <Box size={24} style={{ color: '#52525b' }} />
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: item.type === 'roblox' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)', color: item.type === 'roblox' ? '#f87171' : '#818cf8' }}>
                        {item.type === 'roblox' ? 'Roblox' : '3D Head'}
                      </span>
                    </div>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.creatorName}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description || 'No description'}
                    </p>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <a 
                        href={`/share/${item.type}/${item.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#818cf8', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                      >
                        {t('dash_btn_view')}
                      </a>
                      <button 
                        onClick={() => handleCopyLink(item.type, item.slug)}
                        style={{ background: 'transparent', border: 'none', padding: 0, color: '#34d399', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                      >
                        {copiedSlug === item.slug ? t('share_copied') : t('dash_btn_copy')}
                      </button>
                      {item.skinUrl && (
                        <button 
                          onClick={() => handleLoadSkin(item.type, item.skinUrl)}
                          style={{ background: 'transparent', border: 'none', padding: 0, color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                        >
                          {t('dash_btn_load')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalCount > ITEMS_PER_PAGE && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <button 
                  className="glow-btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <ChevronLeft size={14} />
                  {t('dash_pagination_prev')}
                </button>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>
                  {t('dash_pagination_page')
                    .replace('{current}', currentPage.toString())
                    .replace('{total}', Math.ceil(totalCount / ITEMS_PER_PAGE).toString())}
                </span>
                <button 
                  className="glow-btn-secondary" 
                  disabled={currentPage >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {t('dash_pagination_next')}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
