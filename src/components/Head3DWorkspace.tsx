import { useState, useEffect, useRef } from 'react';
import { Upload, RotateCw, Grid, Download } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { build3DHead } from '../modules/HeadBuilder';
import { ThreeViewer } from '../modules/ThreeViewer';
import { exportToGLB } from '../modules/GLBExporter';
import { exportToBBModel } from '../modules/BBModelExporter';
import { exportToOBJ } from '../modules/OBJExporter';
import { exportToFBX } from '../modules/FBXExporter';
import { type ExtractedFaces } from '../modules/TextureExtractor';

interface Head3DWorkspaceProps {
  skinImage: HTMLImageElement | null;
  skinSrc: string;
  extractedFaces: ExtractedFaces | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dragActive: boolean;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  triggerUploadClick: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  logExport: (format: string, filename: string) => void;
}

export default function Head3DWorkspace({
  skinImage,
  skinSrc,
  extractedFaces,
  fileInputRef,
  handleFileChange,
  dragActive,
  handleDrag,
  handleDrop,
  triggerUploadClick,
  showToast,
  logExport,
}: Head3DWorkspaceProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'head' | 'overlay'>('head');
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ThreeViewer | null>(null);

  // Initialize and update the 3D Head viewer
  useEffect(() => {
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
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [skinImage, autoRotate, showGrid]);

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

  const currentFaces = (activeTab === 'head' || activeTab === 'overlay') && extractedFaces ? extractedFaces[activeTab] : null;

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

        {/* Skin Image Preview */}
        {skinSrc && (
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

        {/* Extracted Faces grid */}
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
      </section>

      {/* Right Side: Interactive 3D Viewer & Exporters */}
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
    </main>
  );
}
