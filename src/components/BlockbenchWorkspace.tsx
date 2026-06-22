import React, { useState, useEffect, useRef } from 'react';
import { Upload, RotateCw, Grid, Download, FileJson } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { Head } from 'vite-react-ssg';
import { parseBlockbenchModel, type ParsedBlockbenchModel } from '../modules/BlockbenchParser';
import { exportToOBJ, exportToFBX } from '../modules/BlockbenchExporter';
import { ThreeViewer } from '../modules/ThreeViewer';
import * as THREE from 'three';

interface BlockbenchWorkspaceProps {
  showToast: (type: 'success' | 'error', message: string) => void;
  logExport: (format: string, filename: string) => void;
}

export default function BlockbenchWorkspace({ showToast, logExport }: BlockbenchWorkspaceProps) {
  const { t } = useTranslation();
  const [model, setModel] = useState<ParsedBlockbenchModel | null>(null);
  const [filenamePrefix, setFilenamePrefix] = useState<string>('blockbench_model');
  const [elementCount, setElementCount] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ThreeViewer | null>(null);

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setDebugLogs(prev => [...prev, `[Global Error] ${event.message} at ${event.filename}:${event.lineno}`]);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setDebugLogs(prev => [...prev, `[Promise Rejection] ${event.reason?.message || event.reason}`]);
    };
    
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setDebugLogs(prev => [...prev, `[Console Error] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`]);
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (containerRef.current && !viewerRef.current) {
      const viewer = new ThreeViewer(containerRef.current);
      viewerRef.current = viewer;
      viewer.setGridY(-5);
    }
    
    if (viewerRef.current) {
      viewerRef.current.autoRotate = autoRotate;
      viewerRef.current.setGridVisible(showGrid);
      if (model) {
        viewerRef.current.setHeadModel(model.group, true);
        
        // Auto position grid helper to just below the bottom of the bounding box
        const bbox = new THREE.Box3().setFromObject(model.group);
        viewerRef.current.setGridY(bbox.min.y - 0.5);
      }
    }
  }, [model, autoRotate, showGrid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const parsed = await parseBlockbenchModel(text);
      
      // Determine counts
      let numElements = 0;
      try {
        const data = JSON.parse(text);
        if (data.elements) {
          numElements = data.elements.length;
        }
      } catch (e) {
        // Fallback
      }
      
      setElementCount(numElements);
      setModel(parsed);
      
      // Clean prefix name from filename
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setFilenamePrefix(baseName);
      
      showToast('success', t('toast_bb_load_success'));
    } catch (err: any) {
      console.error(err);
      showToast('error', t('toast_bb_parse_error', { error: err.message || err }));
    } finally {
      setIsLoading(false);
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
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.bbmodel') || file.name.endsWith('.json')) {
        handleFile(file);
      } else {
        showToast('error', t('bb_upload_format_hint'));
      }
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

  const handleExportOBJ = async () => {
    if (!model) return;
    try {
      await exportToOBJ(model.group, model.textures, filenamePrefix);
      showToast('success', t('toast_bb_export_success'));
      logExport('OBJ', `${filenamePrefix}.obj`);
    } catch (err: any) {
      showToast('error', t('toast_bb_export_error', { error: err.message || err }));
    }
  };

  const handleExportFBX = async () => {
    if (!model) return;
    try {
      await exportToFBX(model.group, filenamePrefix);
      showToast('success', t('toast_bb_export_success'));
      logExport('FBX', `${filenamePrefix}.fbx`);
    } catch (err: any) {
      showToast('error', t('toast_bb_export_error', { error: err.message || err }));
    }
  };

  return (
    <main className="main-grid">
      <Head>
        <title>Minecraft Skin Blockbench Export | Convert bbmodel to OBJ/FBX</title>
        <meta name="description" content="Convert Minecraft skins and Blockbench bbmodel files to OBJ and FBX format. Optimize your models with physical alpha-cutout textures for Roblox." />
        <meta property="og:title" content="Minecraft Skin Blockbench Export &amp; Converter" />
        <meta property="og:description" content="Convert Minecraft skins and Blockbench bbmodel files to OBJ and FBX format." />
        <link rel="canonical" href="https://minecraft-to-roblox-clothing-export.vercel.app/blockbench" />
      </Head>
      {/* Left Panel: Upload and model details */}
      <section className="glass-panel sidebar-panel">
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700 }}>
            {t('bb_upload_title')}
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#a1a1aa' }}>
            {t('bb_upload_desc')}
          </p>
          
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".bbmodel,.json" 
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
            style={{ cursor: 'pointer' }}
          >
            <Upload size={36} style={{ color: '#818cf8', marginBottom: '8px' }} />
            <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 600 }}>
              {t('bb_upload_btn')}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
              {t('bb_upload_format_hint')}
            </p>
          </div>
        </div>

        {/* Model info or loading state */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '3px solid rgba(129, 140, 248, 0.2)',
              borderTopColor: '#818cf8',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Procesando archivo...</span>
          </div>
        )}

        {model && !isLoading && (
          <div className="skin-preview-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileJson size={20} style={{ color: '#818cf8' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                {t('bb_model_info')}
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#e4e4e7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span style={{ color: '#a1a1aa' }}>{t('bb_model_name')}:</span>
                <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{filenamePrefix}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span style={{ color: '#a1a1aa' }}>{t('bb_model_elements')}:</span>
                <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{elementCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span style={{ color: '#a1a1aa' }}>{t('bb_model_textures')}:</span>
                <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{model.textures.length}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#a1a1aa', fontWeight: 600 }}>Texturas del Modelo:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                {model.textures.map((tex, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '3px', overflow: 'hidden', background: '#1c1917', flexShrink: 0 }}>
                      {tex.loadedImage && (
                        <img 
                          src={tex.loadedImage.src} 
                          alt={tex.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} 
                        />
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#e4e4e7', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                      {tex.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#71717a' }}>
                      {tex.width}x{tex.height}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {debugLogs.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            borderTop: '1px solid rgba(239, 68, 68, 0.2)', 
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>Diagnóstico de Errores:</h4>
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              border: '1px solid rgba(239, 68, 68, 0.15)', 
              borderRadius: '6px', 
              padding: '8px', 
              maxHeight: '120px', 
              overflowY: 'auto',
              fontSize: '0.75rem',
              color: '#fca5a5',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {debugLogs.map((log, idx) => (
                <div key={idx} style={{ borderBottom: idx < debugLogs.length - 1 ? '1px solid rgba(239, 68, 68, 0.08)' : 'none', paddingBottom: '4px' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Right Panel: Viewport and Action Buttons */}
      <section className="glass-panel viewer-panel" style={{ minHeight: '680px' }}>
        <div className="viewer-canvas-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Dedicated canvas container managed by Three.js */}
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

          {/* React-managed placeholder overlay (rendered as sibling) */}
          {!model && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              textAlign: 'center',
              color: '#71717a',
              zIndex: 10
            }}>
              <Upload size={48} style={{ color: '#3f3f46' }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                {t('bb_no_model')}
              </p>
            </div>
          )}
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
            <button 
              className="glow-btn-secondary" 
              onClick={handleExportOBJ} 
              disabled={!model}
              style={{ opacity: model ? 1 : 0.5, cursor: model ? 'pointer' : 'not-allowed' }}
            >
              <Download size={18} /> OBJ
            </button>
            <button 
              className="glow-btn" 
              onClick={handleExportFBX} 
              disabled={!model}
              style={{ opacity: model ? 1 : 0.5, cursor: model ? 'pointer' : 'not-allowed' }}
            >
              <Download size={18} /> FBX
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
