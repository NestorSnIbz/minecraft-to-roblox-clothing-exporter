import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Upload, RotateCw, Grid, Download } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { ThreeViewer } from '../modules/ThreeViewer';
import { buildRobloxAvatar } from '../modules/RobloxAvatarBuilder';
import { 
  exportRobloxShirt, 
  exportRobloxPants, 
  drawRobloxPreview,
  generateRobloxShirtCanvas,
  generateRobloxPantsCanvas
} from '../modules/RobloxClothingExporter';

interface RobloxWorkspaceProps {
  skinImage: HTMLImageElement | null;
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

  const robloxContainerRef = useRef<HTMLDivElement | null>(null);
  const robloxViewerRef = useRef<ThreeViewer | null>(null);
  const robloxShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const robloxPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullShirtCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullPantsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and update the 3D Roblox Avatar viewer
  useEffect(() => {
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
    return () => {
      if (robloxViewerRef.current) {
        robloxViewerRef.current.destroy();
        robloxViewerRef.current = null;
      }
    };
  }, [skinImage, autoRotate, showGrid]);

  // Draw Roblox clothing previews
  useEffect(() => {
    if (skinImage) {
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
  }, [robloxView, skinImage]);

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

  return (
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
    </main>
  );
}
