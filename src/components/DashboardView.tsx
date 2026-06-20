import { Box } from 'lucide-react';
import { useTranslation } from '../modules/i18n';

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

export default function DashboardView({ stats, navigateToModule }: DashboardViewProps) {
  const { t } = useTranslation();
  const filteredActivity = stats.activity.filter(item => item.actionKey !== 'act_visit');

  return (
    <section className="dashboard-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Welcome Area */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(129, 140, 248, 0.05) 100%)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
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
        <div className="glass-panel workspace-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'transform 0.3s ease, border-color 0.3s ease' }}>
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
        <div className="glass-panel workspace-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', transition: 'transform 0.3s ease, border-color 0.3s ease' }}>
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
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_stat_conversions')}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.conversions}</span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_stat_exports')}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.exports}</span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_stat_favorite')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(() => {
                const sorted = Object.entries(stats.formats).sort((a, b) => b[1] - a[1]);
                return sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : 'N/A';
              })()}
            </span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('dash_stat_favorite_tool')}</span>
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
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>{t('dash_stat_favorite_tool')}</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
              {(() => {
                const total = stats.headUsage + stats.robloxUsage;
                const headPct = total > 0 ? Math.round((stats.headUsage / total) * 100) : 50;
                const robloxPct = total > 0 ? Math.round((stats.robloxUsage / total) * 100) : 50;
                const radius = 40;
                const circ = 2 * Math.PI * radius;
                const headStroke = (headPct / 100) * circ;
                const robloxStroke = circ - headStroke;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="#6366f1" strokeWidth="10" strokeDasharray={`${headStroke} ${circ}`} strokeLinecap="round" />
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray={`${robloxStroke} ${circ}`} strokeDashoffset={-headStroke} strokeLinecap="round" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#6366f1', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{t('module_3d_head')}: <strong>{headPct}%</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>{t('module_roblox')}: <strong>{robloxPct}%</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Format Popularity Bar Chart */}
          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>{t('dash_stat_favorite')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', height: '140px' }}>
              {(() => {
                const formats = ['GLB', 'BBMODEL', 'Shirt', 'Pants'];
                const maxVal = Math.max(...formats.map(f => stats.formats[f] || 0), 1);
                return formats.map(f => {
                  const val = stats.formats[f] || 0;
                  const pct = Math.max((val / maxVal) * 100, 2);
                  const barColor = (f === 'Shirt' || f === 'Pants') ? '#ef4444' : '#6366f1';
                  return (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '70px', fontSize: '0.8rem', textAlign: 'right', color: '#71717a' }}>{f}</span>
                      <div style={{ flexGrow: 1, height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                      </div>
                      <span style={{ width: '25px', fontSize: '0.8rem', fontWeight: 600 }}>{val}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.02)', borderRadius: '8px', gap: '12px' }}>
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
    </section>
  );
}
