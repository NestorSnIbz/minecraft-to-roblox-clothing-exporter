import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Box, CheckCircle, AlertTriangle, LayoutGrid } from 'lucide-react';
import { validateAndLoadSkin } from './modules/SkinParser';
import { extractFaces, type ExtractedFaces } from './modules/TextureExtractor';
import { I18nProvider, useTranslation } from './modules/i18n';
import AdColumn from './components/AdColumn';
import DashboardView from './components/DashboardView';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorBoundary from './components/ErrorBoundary';
import type { RouteRecord } from 'vite-react-ssg';

// Lazy-load heavy workspaces and pages
const Head3DWorkspace = lazy(() => import('./components/Head3DWorkspace'));
const RobloxWorkspace = lazy(() => import('./components/RobloxWorkspace'));
const BlockbenchWorkspace = lazy(() => import('./components/BlockbenchWorkspace'));
const ShareRobloxPage = lazy(() => import('./pages/ShareRobloxPage'));
const ShareHead3dPage = lazy(() => import('./pages/ShareHead3dPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));

// Programmatic generator for a default Steve skin with a 3D Gold Crown Overlay
function generateSteveSkin(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Image();

  ctx.clearRect(0, 0, 64, 64);

  const fillRect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  const hair = '#563e26';
  const skin = '#e4a07a';
  const darkSkin = '#c68461';
  const eyeWhite = '#ffffff';
  const eyeBlue = '#4646b5';
  const nose = '#b6724d';
  const mouth = '#5c2214';

  // 1. TOP face (8,0 to 16,8) -> Hair
  fillRect(8, 0, 8, 8, hair);

  // 2. BOTTOM face (16,0 to 24,8) -> Neck
  fillRect(16, 0, 8, 8, darkSkin);

  // 3. LEFT face (0,8 to 8,16) -> Hair/Skin
  fillRect(0, 8, 8, 3, hair);
  fillRect(0, 11, 8, 5, skin);
  fillRect(0, 11, 2, 2, hair);
  fillRect(6, 11, 2, 2, hair);

  // 4. FRONT face (8,8 to 16,16) -> Face
  fillRect(8, 8, 8, 8, skin);
  fillRect(8, 8, 8, 2, hair);
  fillRect(8, 10, 1, 1, hair);
  fillRect(15, 10, 1, 1, hair);
  
  // Eyes
  fillRect(9, 12, 1, 1, eyeWhite);
  fillRect(10, 12, 1, 1, eyeBlue);
  fillRect(13, 12, 1, 1, eyeBlue);
  fillRect(14, 12, 1, 1, eyeWhite);

  // Nose
  fillRect(11, 13, 2, 1, nose);

  // Mouth/Beard
  fillRect(10, 14, 4, 1, mouth);

  // 5. RIGHT face (16,8 to 24,16) -> Hair/Skin
  fillRect(16, 8, 8, 3, hair);
  fillRect(16, 11, 8, 5, skin);
  fillRect(16, 11, 2, 2, hair);
  fillRect(22, 11, 2, 2, hair);

  // 6. BACK face (24,8 to 32,16) -> Hair
  fillRect(24, 8, 8, 8, hair);

  // --- CROWN OVERLAY LAYER ---
  const gold = '#eeb609';
  const goldLight = '#ffd54f';
  const ruby = '#e11d48';
  
  // Front: x:40..47, y:8..15
  fillRect(40, 13, 8, 3, gold);
  fillRect(40, 12, 1, 1, gold);
  fillRect(42, 12, 1, 1, gold);
  fillRect(43, 11, 2, 1, gold); // peak
  fillRect(43, 12, 2, 1, ruby); // ruby center
  fillRect(45, 12, 1, 1, gold);
  fillRect(47, 12, 1, 1, gold);
  // Add some highlights
  fillRect(41, 13, 1, 1, goldLight);
  fillRect(46, 13, 1, 1, goldLight);

  // Right: x:48..55, y:8..15
  fillRect(48, 13, 8, 3, gold);
  fillRect(48, 12, 1, 1, gold);
  fillRect(51, 12, 2, 1, gold);
  fillRect(55, 12, 1, 1, gold);

  // Left: x:32..39, y:8..15
  fillRect(32, 13, 8, 3, gold);
  fillRect(32, 12, 1, 1, gold);
  fillRect(35, 12, 2, 1, gold);
  fillRect(39, 12, 1, 1, gold);

  // Back: x:56..63, y:8..15
  fillRect(56, 13, 8, 3, gold);

  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  return img;
}

export function AppLayout() {
  return (
    <I18nProvider>
      <Outlet />
    </I18nProvider>
  );
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: '', element: <AppContent activeTab="dashboard" /> },
      { path: 'dashboard', element: <AppContent activeTab="dashboard" /> },
      { path: 'head3d', element: <AppContent activeTab="head3d" /> },
      { path: 'roblox', element: <AppContent activeTab="roblox" /> },
      { path: 'blockbench', element: <AppContent activeTab="blockbench" /> },
      {
        path: 'gallery',
        element: (
          <Suspense fallback={<LoadingSkeleton />}>
            <GalleryPage />
          </Suspense>
        ),
      },
      {
        path: 'share/roblox/:slug',
        element: (
          <Suspense fallback={<LoadingSkeleton />}>
            <ShareRobloxPage />
          </Suspense>
        ),
      },
      {
        path: 'share/head3d/:slug',
        element: (
          <Suspense fallback={<LoadingSkeleton />}>
            <ShareHead3dPage />
          </Suspense>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

function AppContent({ activeTab }: { activeTab: 'dashboard' | 'head3d' | 'roblox' | 'blockbench' }) {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [skinImage, setSkinImage] = useState<HTMLImageElement | null>(null);
  const [skinSrc, setSkinSrc] = useState<string>('');
  const [extractedFaces, setExtractedFaces] = useState<ExtractedFaces | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeModule, setActiveModule] = useState<'dashboard' | 'head3d' | 'roblox' | 'blockbench'>(activeTab);

  useEffect(() => {
    setActiveModule(activeTab);
  }, [activeTab]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Statistics & Dashboard State
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

  const [stats, setStats] = useState<AppStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_stats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.conversions === 'number' && Array.isArray(parsed.activity)) {
            return parsed;
          }
        } catch (e) {
          // Fallback
        }
      }
    }
    return {
      conversions: 0,
      exports: 0,
      headUsage: 0,
      robloxUsage: 0,
      formats: { GLB: 0, BBMODEL: 0, Shirt: 0, Pants: 0, OBJ: 0, FBX: 0 },
      activity: []
    };
  });

  const saveStats = (newStats: AppStats) => {
    setStats(newStats);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_stats', JSON.stringify(newStats));
    }
  };

  const logConversion = (skinName: string) => {
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substring(2, 9),
      actionKey: 'act_upload',
      details: skinName,
      timestamp: Date.now()
    };
    saveStats({
      ...stats,
      conversions: stats.conversions + 1,
      activity: [newActivity, ...stats.activity].slice(0, 10)
    });
  };

  const logExport = (format: string, filename: string) => {
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substring(2, 9),
      actionKey: 'act_export',
      details: filename,
      timestamp: Date.now()
    };
    const updatedFormats = { ...stats.formats };
    updatedFormats[format] = (updatedFormats[format] || 0) + 1;
    saveStats({
      ...stats,
      exports: stats.exports + 1,
      formats: updatedFormats,
      activity: [newActivity, ...stats.activity].slice(0, 10)
    });
  };

  const logToolVisit = (tool: 'head3d' | 'roblox') => {
    saveStats({
      ...stats,
      headUsage: tool === 'head3d' ? stats.headUsage + 1 : stats.headUsage,
      robloxUsage: tool === 'roblox' ? stats.robloxUsage + 1 : stats.robloxUsage
    });
  };

  const navigateToModule = (module: 'dashboard' | 'head3d' | 'roblox' | 'blockbench') => {
    navigate(`/${module}`);
    if (module === 'head3d' || module === 'roblox') {
      logToolVisit(module);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 1. Generate default Steve crown skin on mount (or load from URL if provided)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('skinUrl');

    if (urlParam) {
      const loadSharedSkin = async () => {
        try {
          const res = await fetch(urlParam);
          const blob = await res.blob();
          const file = new File([blob], 'shared_skin.png', { type: 'image/png' });
          await handleFile(file);
          
          // Clear query params so we don't reload it on every mount
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error('Failed to pre-load shared skin:', e);
          loadDefaultSteve();
        }
      };
      loadSharedSkin();
    } else {
      loadDefaultSteve();
    }

    function loadDefaultSteve() {
      const defaultSteve = generateSteveSkin();
      defaultSteve.onload = () => {
        setSkinImage(defaultSteve);
        setSkinSrc(defaultSteve.src);
        setExtractedFaces(extractFaces(defaultSteve));
      };
    }
  }, []);

  // File uploading logic
  const handleFile = async (file: File) => {
    const result = await validateAndLoadSkin(file);
    if (result.isValid && result.image) {
      setSkinImage(result.image);
      setSkinSrc(result.image.src);
      setExtractedFaces(extractFaces(result.image));
      showToast('success', t('toast_skin_success'));
      logConversion(file.name);
    } else {
      const errorMsg = result.errorKey ? t(result.errorKey, result.errorParams) : t('err_generic');
      showToast('error', errorMsg);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="layout-wrapper">
      <AdColumn position="left" />
      <div className="app-container">
        {/* Sleek Header */}
        <header className="glass-panel app-header">
          <div className="logo-container" onClick={() => navigateToModule('dashboard')} style={{ cursor: 'pointer' }}>
            <Box className="logo-icon" size={32} style={{ color: '#818cf8' }} />
            <div>
              <h1 className="logo-text" style={{ margin: 0 }}>{t('app_title')}</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>{t('app_subtitle')}</p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="nav-container">
            <button 
              className={`nav-btn ${activeModule === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigateToModule('dashboard')}
            >
              {t('nav_dashboard')}
            </button>
            <button 
              className={`nav-btn ${activeModule === 'head3d' ? 'active' : ''}`}
              onClick={() => navigateToModule('head3d')}
            >
              {t('module_3d_head')}
            </button>
            <button 
              className={`nav-btn ${activeModule === 'roblox' ? 'active' : ''}`}
              onClick={() => navigateToModule('roblox')}
            >
              {t('module_roblox')}
            </button>
            <button 
              className={`nav-btn ${activeModule === 'blockbench' ? 'active' : ''}`}
              onClick={() => navigateToModule('blockbench')}
            >
              {t('nav_blockbench')}
            </button>
            <button 
              className="nav-btn"
              onClick={() => navigate('/gallery')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutGrid size={16} />
              {t('nav_gallery')}
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="i18n-selector-container" style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button 
                className={`tab-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: '32px', flex: 'none' }}
              >
                EN
              </button>
              <button 
                className={`tab-btn ${language === 'es' ? 'active' : ''}`}
                onClick={() => setLanguage('es')}
                style={{ padding: '4px 8px', fontSize: '0.75rem', minWidth: '32px', flex: 'none' }}
              >
                ES
              </button>
            </div>
            <span className="badge">v1.1</span>
          </div>
        </header>

        {/* Lazy loadable modules inside Suspense */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingSkeleton />}>
            {activeModule === 'dashboard' && (
              <DashboardView 
                stats={stats} 
                navigateToModule={navigateToModule} 
              />
            )}

            {activeModule === 'head3d' && (
              <Head3DWorkspace 
                skinImage={skinImage}
                skinSrc={skinSrc}
                extractedFaces={extractedFaces}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                dragActive={dragActive}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                triggerUploadClick={triggerUploadClick}
                showToast={showToast}
                logExport={logExport}
              />
            )}

            {activeModule === 'roblox' && (
              <RobloxWorkspace 
                skinImage={skinImage}
                setSkinImage={setSkinImage}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                dragActive={dragActive}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                triggerUploadClick={triggerUploadClick}
                showToast={showToast}
                logExport={logExport}
              />
            )}

            {activeModule === 'blockbench' && (
              <BlockbenchWorkspace 
                showToast={showToast}
                logExport={logExport}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
      <AdColumn position="right" />

      {/* Floating Status Notification Toasts */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
