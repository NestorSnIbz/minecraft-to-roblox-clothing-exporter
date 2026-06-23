import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Upload, RotateCw, Grid, Download } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { Head } from 'vite-react-ssg';
import { ThreeViewer } from '../modules/ThreeViewer';
import { buildRobloxAvatar } from '../modules/RobloxAvatarBuilder';
import { 
  exportRobloxShirt, 
  exportRobloxPants, 
  drawRobloxPreview,
  generateRobloxShirtCanvas,
  generateRobloxPantsCanvas,
  isSlimSkin
} from '../modules/RobloxClothingExporter';
import { useShareRoblox } from '../hooks/useShareRoblox';

interface RobloxWorkspaceProps {
  skinImage: HTMLImageElement | null;
  setSkinImage?: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  triggerUploadClick: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  logExport: (format: string, filename: string) => void;
}

export default function RobloxWorkspace({
  skinImage,
  fileInputRef,
  handleFileChange,
  dragActive,
  handleDrag,
  handleDrop,
  triggerUploadClick,
  showToast,
  logExport,
}: RobloxWorkspaceProps) {
  const { t } = useTranslation();
  const [robloxView, setRobloxView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [armType, setArmType] = useState<'classic' | 'slim'>('classic');
  const [animMode, setAnimMode] = useState<'none' | 'idle' | 'walk'>('none');

  const { share: shareRoblox, minutesLeft } = useShareRoblox();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Anti-bot & Form States
  const [creatorName, setCreatorName] = useState('');
  const [description, setDescription] = useState('');
  const [puzzleA, setPuzzleA] = useState(0);
  const [puzzleB, setPuzzleB] = useState(0);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);


  const generatePuzzle = () => {
    setPuzzleA(Math.floor(Math.random() * 8) + 2); // 2 to 9
    setPuzzleB(Math.floor(Math.random() * 8) + 2); // 2 to 9
    setPuzzleAnswer('');
  };

  const handleShareClick = () => {
    setShowShareModal(true);
    setShareUrl(null);
    setShareError(null);
    setShareLoading(false);
    setCreatorName('');
    setDescription('');
    setCaptchaError(false);
    generatePuzzle();
  };

  const handleConfirmShare = async () => {
    const expected = puzzleA + puzzleB;
    if (parseInt(puzzleAnswer, 10) !== expected) {
      setCaptchaError(true);
      generatePuzzle();
      return;
    }
    setCaptchaError(false);

    setShareLoading(true);
    setShareError(null);
    try {
      let previewCanvas: HTMLCanvasElement | null = null;
      if (robloxViewerRef.current) {
        robloxViewerRef.current.renderOnce();
        previewCanvas = robloxViewerRef.current.getCanvas();
      }
      const url = await shareRoblox(
        fullShirtCanvasRef.current,
        fullPantsCanvasRef.current,
        previewCanvas,
        skinImage ? skinImage.src : '',
        armType,
        creatorName,
        description
      );
      setShareUrl(url);



      // Save to shared history in localStorage
      const historyStr = localStorage.getItem('shared_history') || '[]';
      const history = JSON.parse(historyStr);
      
      let previewUrl = '';
      if (previewCanvas) {
        previewUrl = previewCanvas.toDataURL('image/png');
      }

      const slugFromUrl = url.split('/').pop() || '';

      const newHistoryItem = {
        slug: slugFromUrl,
        type: 'roblox',
        creatorName: creatorName.trim() || 'Anonymous',
        description: description.trim() || '',
        previewUrl: previewUrl,
        createdAt: Date.now(),
        skinUrl: skinImage?.src || ''
      };

      localStorage.setItem('shared_history', JSON.stringify([newHistoryItem, ...history]));
      window.dispatchEvent(new Event('storage'));

    } catch (err: any) {
      setShareError(err.message || 'Error occurred while sharing');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const robloxContainerRef = useRef<HTMLDivElement | null>(null);
  const robloxViewerRef = useRef<ThreeViewer | null>(null);
  const robloxShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const robloxPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Automatically detect arm type when a new skin is uploaded
  useEffect(() => {
    if (skinImage) {
      const detectedIsSlim = isSlimSkin(skinImage);
      setArmType(detectedIsSlim ? 'slim' : 'classic');
    }
  }, [skinImage]);

  // 1. Initialize and clean up 3D Roblox Avatar viewer
  useEffect(() => {
    if (robloxContainerRef.current && !robloxViewerRef.current) {
      const viewer = new ThreeViewer(robloxContainerRef.current);
      robloxViewerRef.current = viewer;
      viewer.setGridY(-2);
      // Default camera to frontal view looking at torso
      viewer.resetCamera(new THREE.Vector3(0, 1, 8), new THREE.Vector3(0, 1, 0));
    }
    return () => {
      if (robloxViewerRef.current) {
        robloxViewerRef.current.destroy();
        robloxViewerRef.current = null;
      }
    };
  }, []);

  // 2. Load avatar group model only when skinImage or armType updates (prevent redraw flashes)
  useEffect(() => {
    if (robloxViewerRef.current && skinImage) {
      const avatarGroup = buildRobloxAvatar(skinImage, armType === 'slim');
      avatarGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData?.meshName === 'head') {
          child.visible = false;
        }
      });
      robloxViewerRef.current.setHeadModel(avatarGroup);
    }
  }, [skinImage, armType]);

  // 3. Update view options and animation state dynamically (instant changes)
  useEffect(() => {
    if (robloxViewerRef.current) {
      robloxViewerRef.current.autoRotate = autoRotate;
      robloxViewerRef.current.setGridVisible(showGrid);
      robloxViewerRef.current.animationMode = animMode;
    }
  }, [autoRotate, showGrid, animMode]);

  // Draw Roblox clothing previews
  useEffect(() => {
    if (skinImage) {
      const timer = setTimeout(() => {
        // Character assembly previews (on left sidebar)
        if (robloxShirtCanvasRef.current) {
          drawRobloxPreview('shirt', robloxView, skinImage, robloxShirtCanvasRef.current, armType === 'slim');
        }
        if (robloxPantsCanvasRef.current) {
          drawRobloxPreview('pants', robloxView, skinImage, robloxPantsCanvasRef.current);
        }
        // Full templates (on right panel)
        if (fullShirtCanvasRef.current) {
          const tempCanvas = generateRobloxShirtCanvas(skinImage, armType === 'slim');
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
  }, [robloxView, skinImage, armType]);

  const handleExportRobloxShirt = async () => {
    if (!skinImage) {
      showToast('error', t('toast_load_skin_for_roblox'));
      return;
    }

    try {
      await exportRobloxShirt(skinImage, armType === 'slim');
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

  return (
    <main className="main-grid">
      <Head>
        <title>Minecraft Skin to Roblox Shirt Converter | Classic Clothing Template</title>
        <meta name="description" content="Convert Minecraft skins to Roblox clothing templates online. Generate classic Roblox shirts and pants with an interactive 3D R6 dummy preview." />
        <meta property="og:title" content="Minecraft Skin to Roblox Shirt Converter" />
        <meta property="og:description" content="Convert Minecraft skins to classic Roblox shirt and pants templates online." />
        <link rel="canonical" href="https://minecraft-to-roblox-clothing-export.vercel.app/roblox" />
      </Head>
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
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>{t('arm_type')}</h4>
            <div className="tabs-container">
              <button
                className={`tab-btn ${armType === 'classic' ? 'active' : ''}`}
                onClick={() => setArmType('classic')}
              >
                {t('arm_classic')}
              </button>
              <button
                className={`tab-btn ${armType === 'slim' ? 'active' : ''}`}
                onClick={() => setArmType('slim')}
              >
                {t('arm_slim')}
              </button>
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
            {skinImage && (
              <button 
                className="glow-btn-secondary" 
                style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                onClick={handleShareClick}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {t('btn_share_workspace')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Right Side: Interactive 3D Viewer & Roblox Templates Grid */}
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
            <label className="toggle-container" style={{ opacity: skinImage ? 1 : 0.5, cursor: skinImage ? 'pointer' : 'not-allowed' }}>
              <input 
                type="checkbox" 
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                disabled={!skinImage}
                style={{ display: 'none' }}
              />
              <span className="checkbox-custom"></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <RotateCw size={16} /> {t('opt_rotate')}
              </span>
            </label>

            {/* Animation Selector Group */}
            <div className="i18n-selector-container" style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.03)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', marginLeft: '12px', opacity: skinImage ? 1 : 0.5 }}>
              <button 
                className={`tab-btn ${animMode === 'none' ? 'active' : ''}`}
                onClick={() => setAnimMode('none')}
                disabled={!skinImage}
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  minWidth: '45px', 
                  flex: 'none', 
                  cursor: skinImage ? 'pointer' : 'not-allowed',
                  backgroundColor: animMode === 'none' ? 'var(--primary)' : 'transparent',
                  color: animMode === 'none' ? '#ffffff' : undefined,
                  border: animMode === 'none' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                None
              </button>
              <button 
                className={`tab-btn ${animMode === 'idle' ? 'active' : ''}`}
                onClick={() => setAnimMode('idle')}
                disabled={!skinImage}
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  minWidth: '45px', 
                  flex: 'none', 
                  cursor: skinImage ? 'pointer' : 'not-allowed',
                  backgroundColor: animMode === 'idle' ? 'var(--primary)' : 'transparent',
                  color: animMode === 'idle' ? '#ffffff' : undefined,
                  border: animMode === 'idle' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                Idle
              </button>
              <button 
                className={`tab-btn ${animMode === 'walk' ? 'active' : ''}`}
                onClick={() => setAnimMode('walk')}
                disabled={!skinImage}
                style={{ 
                  padding: '4px 10px', 
                  fontSize: '0.75rem', 
                  minWidth: '45px', 
                  flex: 'none', 
                  cursor: skinImage ? 'pointer' : 'not-allowed',
                  backgroundColor: animMode === 'walk' ? 'var(--primary)' : 'transparent',
                  color: animMode === 'walk' ? '#ffffff' : undefined,
                  border: animMode === 'walk' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
                }}
              >
                Walk
              </button>
            </div>
          </div>

          <div className="viewer-actions">
            <button className="glow-btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }} onClick={handleResetRobloxCamera}>
              {t('btn_front_view')}
            </button>
          </div>
        </div>

        {/* 2D Templates grid */}
        <div className="roblox-templates-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '0 24px 24px 24px' }}>
          <div className="template-card">
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('template_shirt_title')}</h3>
            <div className="template-canvas-container" style={{ width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
              <canvas ref={fullShirtCanvasRef} className="full-template-canvas" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>
            <button className="glow-btn-roblox" style={{ width: '100%', maxWidth: '240px', padding: '10px' }} onClick={handleExportRobloxShirt}>
              <Download size={18} /> {t('btn_download_shirt')}
            </button>
          </div>
          <div className="template-card">
            <h3 style={{ fontSize: '1rem', margin: 0 }}>{t('template_pants_title')}</h3>
            <div className="template-canvas-container" style={{ width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
              <canvas ref={fullPantsCanvasRef} className="full-template-canvas" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>
            <button className="glow-btn-roblox" style={{ width: '100%', maxWidth: '240px', padding: '10px' }} onClick={handleExportRobloxPants}>
              <Download size={18} /> {t('btn_download_pants')}
            </button>
          </div>
        </div>
      </section>

      {showShareModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="glass-panel" style={{
            padding: '28px',
            maxWidth: '450px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            border: '2px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>
              {t('share_title')}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af', lineHeight: '1.5' }}>
              {t('share_desc')}
            </p>
            <div style={{
              fontSize: '0.8rem',
              color: '#fca5a5',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              padding: '10px 12px',
              borderRadius: '8px',
              lineHeight: '1.4'
            }}>
              ⚠️ {t('share_disclaimer')}
            </div>

            {shareLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '3px solid rgba(129, 140, 248, 0.2)',
                  borderTopColor: '#818cf8',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{t('share_uploading')}</span>
              </div>
            ) : shareError ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.85rem' }}>
                  {shareError}
                </div>
                <button className="glow-btn-secondary" style={{ padding: '10px' }} onClick={() => setShowShareModal(false)}>
                  {t('btn_close')}
                </button>
              </div>
            ) : shareUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e5e7eb',
                      fontSize: '0.85rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="glow-btn" style={{ flex: 1, padding: '10px' }} onClick={handleCopyLink}>
                    {copied ? t('share_copied') : t('share_copy_link')}
                  </button>
                  <button className="glow-btn-secondary" style={{ padding: '10px' }} onClick={() => setShowShareModal(false)}>
                    {t('btn_close')}
                  </button>
                </div>
              </div>
            ) : null}

            {!shareLoading && !shareUrl && !shareError && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Creator Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>
                    {t('share_lbl_name')}
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder={t('share_ph_name')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f3f4f6',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>
                    {t('share_lbl_desc')}
                  </label>
                  <textarea
                    maxLength={200}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('share_ph_desc')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f3f4f6',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Math Puzzle (Human Check) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(99, 102, 241, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline' }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    {t('share_lbl_puzzle')}
                  </label>
                  <span style={{ fontSize: '0.85rem', color: '#d1d5db', margin: '4px 0' }}>
                    {t('share_puzzle_solve').replace('{a}', puzzleA.toString()).replace('{b}', puzzleB.toString())}
                  </span>
                  <input
                    type="number"
                    value={puzzleAnswer}
                    onChange={(e) => setPuzzleAnswer(e.target.value)}
                    placeholder={t('share_puzzle_ph')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f3f4f6',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  {captchaError && (
                    <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600, marginTop: '4px' }}>
                      {t('share_err_puzzle')}
                    </span>
                  )}
                </div>

                {/* Cooldown Alert */}
                {minutesLeft !== null && minutesLeft > 0 && (
                  <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0 0 0' }}>
                    Too many shares. Please wait {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
                  </p>
                )}

                {/* Confirm/Cancel Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button 
                    className="glow-btn" 
                    style={{ flex: 1, padding: '10px' }} 
                    onClick={handleConfirmShare}
                    disabled={(minutesLeft !== null && minutesLeft > 0) || !puzzleAnswer}
                  >
                    {t('share_btn_confirm')}
                  </button>
                  <button className="glow-btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={() => setShowShareModal(false)}>
                    {t('btn_cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
