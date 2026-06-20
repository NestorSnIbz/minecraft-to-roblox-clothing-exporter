import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Upload, 
  RotateCw, 
  Grid, 
  Download, 
  Box, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { validateAndLoadSkin } from './modules/SkinParser';
import { extractFaces, type ExtractedFaces } from './modules/TextureExtractor';
import { build3DHead } from './modules/HeadBuilder';
import { ThreeViewer } from './modules/ThreeViewer';
import { exportToGLB } from './modules/GLBExporter';
import { exportToBBModel } from './modules/BBModelExporter';
import { exportToOBJ } from './modules/OBJExporter';
import { exportToFBX } from './modules/FBXExporter';
import { 
  exportRobloxShirt, 
  exportRobloxPants, 
  drawRobloxPreview,
  generateRobloxShirtCanvas,
  generateRobloxPantsCanvas
} from './modules/RobloxClothingExporter';
import { buildRobloxAvatar } from './modules/RobloxAvatarBuilder';
import { I18nProvider, useTranslation } from './modules/i18n';

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

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { t, language, setLanguage } = useTranslation();
  const [skinImage, setSkinImage] = useState<HTMLImageElement | null>(null);
  const [skinSrc, setSkinSrc] = useState<string>('');
  const [extractedFaces, setExtractedFaces] = useState<ExtractedFaces | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeModule, setActiveModule] = useState<'dashboard' | 'head3d' | 'roblox'>('dashboard');
  const [activeTab, setActiveTab] = useState<'head' | 'overlay'>('head');
  const [robloxView, setRobloxView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
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
    localStorage.setItem('app_stats', JSON.stringify(newStats));
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
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substring(2, 9),
      actionKey: 'act_visit',
      details: tool === 'head3d' ? t('module_3d_head') : t('module_roblox'),
      timestamp: Date.now()
    };
    saveStats({
      ...stats,
      headUsage: tool === 'head3d' ? stats.headUsage + 1 : stats.headUsage,
      robloxUsage: tool === 'roblox' ? stats.robloxUsage + 1 : stats.robloxUsage,
      activity: [newActivity, ...stats.activity].slice(0, 10)
    });
  };

  const navigateToModule = (module: 'dashboard' | 'head3d' | 'roblox') => {
    setActiveModule(module);
    if (module === 'head3d' || module === 'roblox') {
      logToolVisit(module);
    }
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ThreeViewer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const robloxShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const robloxPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const robloxContainerRef = useRef<HTMLDivElement | null>(null);
  const robloxViewerRef = useRef<ThreeViewer | null>(null);



  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // 1. Generate default Steve crown skin on mount
  useEffect(() => {
    const defaultSteve = generateSteveSkin();
    defaultSteve.onload = () => {
      setSkinImage(defaultSteve);
      setSkinSrc(defaultSteve.src);
      setExtractedFaces(extractFaces(defaultSteve));
    };
  }, []);

  // 2. Initialize and update the 3D Head viewer (for head3d module)
  useEffect(() => {
    if (activeModule === 'head3d') {
      if (containerRef.current && !viewerRef.current) {
        const viewer = new ThreeViewer(containerRef.current);
        viewerRef.current = viewer;
        viewer.setGridY(-5);
      }
      if (viewerRef.current) {
        viewerRef.current.autoRotate = autoRotate;
        viewerRef.current.setGridVisible(showGrid);
        if (skinImage) {
          const headGroup = build3DHead(skinImage);
          viewerRef.current.setHeadModel(headGroup);
        }
      }
    } else {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    }
  }, [activeModule, skinImage, autoRotate, showGrid]);

  // 3. Initialize and update the 3D Roblox Avatar viewer (for roblox module)
  useEffect(() => {
    if (activeModule === 'roblox') {
      if (robloxContainerRef.current && !robloxViewerRef.current) {
        const viewer = new ThreeViewer(robloxContainerRef.current);
        robloxViewerRef.current = viewer;
        viewer.setGridY(-2);
        // Default camera to frontal view looking at torso
        viewer.resetCamera(new THREE.Vector3(0, 1, 8), new THREE.Vector3(0, 1, 0));
      }
      if (robloxViewerRef.current) {
        robloxViewerRef.current.autoRotate = autoRotate;
        robloxViewerRef.current.setGridVisible(showGrid);
        if (skinImage) {
          const avatarGroup = buildRobloxAvatar(skinImage);
          robloxViewerRef.current.setHeadModel(avatarGroup);
        }
      }
    } else {
      if (robloxViewerRef.current) {
        robloxViewerRef.current.destroy();
        robloxViewerRef.current = null;
      }
    }
  }, [activeModule, skinImage, autoRotate, showGrid]);

  // 5. Draw Roblox clothing previews (character assembly and full flat templates)
  useEffect(() => {
    if (activeModule === 'roblox' && skinImage) {
      // Small timeout to ensure DOM elements are rendered and refs are set
      const timer = setTimeout(() => {
        // Character assembly previews (on left sidebar)
        if (robloxShirtCanvasRef.current) {
          drawRobloxPreview('shirt', robloxView, skinImage, robloxShirtCanvasRef.current);
        }
        if (robloxPantsCanvasRef.current) {
          drawRobloxPreview('pants', robloxView, skinImage, robloxPantsCanvasRef.current);
        }
        // Full templates (on right panel)
        if (fullShirtCanvasRef.current) {
          const tempCanvas = generateRobloxShirtCanvas(skinImage);
          const ctx = fullShirtCanvasRef.current.getContext('2d');
          if (ctx) {
            fullShirtCanvasRef.current.width = 585;
            fullShirtCanvasRef.current.height = 559;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0);
          }
        }
        if (fullPantsCanvasRef.current) {
          const tempCanvas = generateRobloxPantsCanvas(skinImage);
          const ctx = fullPantsCanvasRef.current.getContext('2d');
          if (ctx) {
            fullPantsCanvasRef.current.width = 585;
            fullPantsCanvasRef.current.height = 559;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeModule, robloxView, skinImage]);


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

  // Exporters
  const handleExportOBJ = async () => {
    if (!viewerRef.current) return;
    const headModel = viewerRef.current.getHeadModel();
    if (!headModel) {
      showToast('error', t('toast_no_3d_model'));
      return;
    }
    if (!skinImage) {
      showToast('error', t('toast_load_skin_first'));
      return;
    }
    try {
      await exportToOBJ(headModel, skinImage);
      showToast('success', t('toast_obj_success'));
      logExport('OBJ', 'cabeza.obj');
    } catch (err: any) {
      showToast('error', t('toast_obj_error', { error: err.message }));
    }
  };

  const handleExportFBX = async () => {
    if (!viewerRef.current) return;
    const headModel = viewerRef.current.getHeadModel();
    if (!headModel) {
      showToast('error', t('toast_no_3d_model'));
      return;
    }
    if (!skinImage) {
      showToast('error', t('toast_load_skin_first'));
      return;
    }
    try {
      await exportToFBX(headModel, skinImage);
      showToast('success', t('toast_fbx_success'));
      logExport('FBX', 'cabeza.fbx');
    } catch (err: any) {
      showToast('error', t('toast_fbx_error', { error: err.message }));
    }
  };

  const handleExportGLB = async () => {
    if (!viewerRef.current) return;
    const headModel = viewerRef.current.getHeadModel();
    if (!headModel) {
      showToast('error', t('toast_no_3d_model'));
      return;
    }

    try {
      await exportToGLB(headModel);
      showToast('success', t('toast_glb_success'));
      logExport('GLB', 'cabeza.glb');
    } catch (err: any) {
      showToast('error', t('toast_glb_error', { error: err.message }));
    }
  };

  const handleExportBBModel = () => {
    if (!skinImage) {
      showToast('error', t('toast_bbmodel_load_skin'));
      return;
    }

    try {
      exportToBBModel(skinImage);
      showToast('success', t('toast_bbmodel_success'));
      logExport('BBMODEL', 'cabeza.bbmodel');
    } catch (err: any) {
      showToast('error', t('toast_bbmodel_error', { error: err.message }));
    }
  };

  const handleExportRobloxShirt = async () => {
    if (!skinImage) {
      showToast('error', t('toast_load_skin_for_roblox'));
      return;
    }

    try {
      await exportRobloxShirt(skinImage);
      showToast('success', t('toast_shirt_success'));
      logExport('Shirt', 'shirt.png');
    } catch (err: any) {
      showToast('error', t('toast_shirt_error', { error: err.message }));
    }
  };

  const handleExportRobloxPants = async () => {
    if (!skinImage) {
      showToast('error', t('toast_load_skin_for_roblox'));
      return;
    }

    try {
      await exportRobloxPants(skinImage);
      showToast('success', t('toast_pants_success'));
      logExport('Pants', 'pants.png');
    } catch (err: any) {
      showToast('error', t('toast_pants_error', { error: err.message }));
    }
  };

  const handleResetRobloxCamera = () => {
    if (robloxViewerRef.current) {
      robloxViewerRef.current.resetCamera(new THREE.Vector3(0, 1, 8), new THREE.Vector3(0, 1, 0));
    }
  };


  const currentFaces = (activeTab === 'head' || activeTab === 'overlay') && extractedFaces ? extractedFaces[activeTab] : null;

  return (
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

      {/* Dashboard or Main Grid Workspace */}
      {activeModule === 'dashboard' ? (
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

            {stats.activity.length === 0 ? (
              <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                {t('dash_no_activity')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.activity.map((item) => {
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
      ) : (
        <main className="main-grid">
          {/* Left Side: Uploading and 2D Previews */}
          <section className="glass-panel sidebar-panel">
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700 }}>{t('upload_title')}</h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#a1a1aa' }}>{t('upload_desc')}</p>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".png" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerUploadClick}
              >
                <Upload size={36} style={{ color: '#818cf8', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600 }}>{t('upload_btn')}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>{t('upload_format_hint')}</p>
              </div>
            </div>

            {/* Skin Image Preview (Only for 3D Head Module to avoid showing head in clothing mode) */}
            {activeModule === 'head3d' && skinSrc && (
              <div className="skin-preview-section">
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{t('skin_original')}</h3>
                <div className="skin-canvas-container">
                  <img 
                    src={skinSrc} 
                    alt="Minecraft Skin Preview" 
                    className="skin-preview-img"
                  />
                </div>
              </div>
            )}

            {/* Extracted Faces grid for 3D Head Module */}
            {activeModule === 'head3d' && (
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600 }}>{t('extracted_faces')}</h3>
                
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

                {currentFaces && (
                  <div className="faces-grid">
                    {Object.entries(currentFaces).map(([key, face]) => (
                      <div key={key} className="face-card">
                        <div className="face-img-container">
                          <img src={face.dataUrl} alt={face.name} className="face-img" />
                        </div>
                        <span className="face-label">{face.name.split(' ')[0]}</span>
                        <span className="face-coords">x:{face.x} y:{face.y}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Roblox Clothing Preview sidebar panel for Roblox Module */}
            {activeModule === 'roblox' && (
              <div className="skin-preview-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>{t('avatar_view')}</h4>
                  <div className="tabs-container">
                    {(['front', 'back', 'left', 'right'] as const).map((view) => (
                      <button
                        key={view}
                        className={`tab-btn ${robloxView === view ? 'active' : ''}`}
                        onClick={() => setRobloxView(view)}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {view === 'front' ? t('view_front') : view === 'back' ? t('view_back') : view === 'left' ? t('view_left') : t('view_right')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>{t('preview_shirt')}</h3>
                  <div className="skin-canvas-container" style={{ minHeight: '160px' }}>
                    <canvas 
                      ref={robloxShirtCanvasRef} 
                      style={{ 
                        imageRendering: 'pixelated', 
                        maxWidth: '100%', 
                        maxHeight: '130px', 
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 600 }}>{t('preview_pants')}</h3>
                  <div className="skin-canvas-container" style={{ minHeight: '280px' }}>
                    <canvas 
                      ref={robloxPantsCanvasRef} 
                      style={{ 
                        imageRendering: 'pixelated', 
                        maxWidth: '100%', 
                        maxHeight: '250px', 
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                </div>

                {/* Sidebar Clothing Export Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <h3 style={{ margin: '0', fontSize: '1rem', fontWeight: 600 }}>{t('export_clothing')}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="glow-btn-roblox" style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem' }} onClick={handleExportRobloxShirt}>
                      <Download size={14} /> {t('btn_shirt')}
                    </button>
                    <button className="glow-btn-roblox" style={{ flex: 1, padding: '10px 5px', fontSize: '0.85rem' }} onClick={handleExportRobloxPants}>
                      <Download size={14} /> {t('btn_pants')}
                    </button>
                  </div>
                  <button className="glow-btn" style={{ padding: '10px', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', boxShadow: 'none' }} onClick={async () => {
                    await handleExportRobloxShirt();
                    await handleExportRobloxPants();
                  }}>
                    <Download size={16} /> {t('btn_download_both')}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Side: Interactive 3D Viewer & Exporters OR Roblox Templates Grid */}
          {activeModule === 'head3d' ? (
            <section className="glass-panel viewer-panel">
              {/* Three.js viewport */}
              <div ref={containerRef} className="viewer-canvas-container">
                {/* ThreeViewer canvas will be appended here */}
              </div>

              {/* Toolbar & Exporters */}
              <div className="viewer-toolbar">
                <div className="toolbar-controls">
                  {/* Toggle Grid */}
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span className="checkbox-custom"></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Grid size={16} /> {t('opt_grid')}
                    </span>
                  </label>

                  {/* Toggle Rotate */}
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span className="checkbox-custom"></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCw size={16} /> {t('opt_rotate')}
                    </span>
                  </label>
                </div>

                <div className="viewer-actions">
                  <button className="glow-btn-secondary" onClick={handleExportOBJ} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <Download size={18} /> OBJ
                  </button>
                  <button className="glow-btn-secondary" onClick={handleExportFBX} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <Download size={18} /> FBX
                  </button>
                  <button className="glow-btn-secondary" onClick={handleExportGLB}>
                    <Download size={18} /> GLB
                  </button>
                  <button className="glow-btn" onClick={handleExportBBModel}>
                    <Download size={18} /> BBMODEL
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="glass-panel viewer-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 3D Roblox Avatar viewport */}
              <div ref={robloxContainerRef} className="viewer-canvas-container" style={{ minHeight: '400px' }}>
                {/* ThreeViewer canvas for Roblox Avatar will be appended here */}
              </div>

              {/* Toolbar & Controls */}
              <div className="viewer-toolbar">
                <div className="toolbar-controls">
                  {/* Toggle Grid */}
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span className="checkbox-custom"></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Grid size={16} /> {t('opt_grid')}
                    </span>
                  </label>

                  {/* Toggle Rotate */}
                  <label className="toggle-container">
                    <input 
                      type="checkbox" 
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span className="checkbox-custom"></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCw size={16} /> {t('opt_rotate')}
                    </span>
                  </label>
                </div>

                <div className="viewer-actions">
                  <button className="glow-btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={handleResetRobloxCamera}>
                    {t('btn_front_view')}
                  </button>
                </div>
              </div>

              {/* 2D Templates grid */}
              <div className="roblox-templates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '0 24px 24px 24px' }}>
                <div className="template-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('template_shirt_title')}</h3>
                  <div className="template-canvas-container" style={{ width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
                    <canvas ref={fullShirtCanvasRef} className="full-template-canvas" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <button className="glow-btn-roblox" style={{ width: '100%', maxWidth: '240px', padding: '10px' }} onClick={handleExportRobloxShirt}>
                    <Download size={18} /> {t('btn_download_shirt')}
                  </button>
                </div>
                <div className="template-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('template_pants_title')}</h3>
                  <div className="template-canvas-container" style={{ width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
                    <canvas ref={fullPantsCanvasRef} className="full-template-canvas" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <button className="glow-btn-roblox" style={{ width: '100%', maxWidth: '240px', padding: '10px' }} onClick={handleExportRobloxPants}>
                    <Download size={18} /> {t('btn_download_pants')}
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

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
