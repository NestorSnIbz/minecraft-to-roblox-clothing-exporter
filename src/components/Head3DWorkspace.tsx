import { useState, useEffect, useRef } from 'react';
import { Upload, RotateCw, Grid, Download } from 'lucide-react';
import { useTranslation } from '../modules/i18n';
import { Head } from 'vite-react-ssg';
import { build3DHead } from '../modules/HeadBuilder';
import { ThreeViewer } from '../modules/ThreeViewer';
import { exportToGLB } from '../modules/GLBExporter';
import { exportToBBModel } from '../modules/BBModelExporter';
import { exportToOBJ } from '../modules/OBJExporter';
import { exportToFBX } from '../modules/FBXExporter';
import { type ExtractedFaces } from '../modules/TextureExtractor';
import { useShareHead3d } from '../hooks/useShareHead3d';

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

/**
 * Minecraft skin face layout (pixel coordinates on a 64×64 sheet).
 * baseX/Y = top-left of the base (inner) layer.
 * overlayX/Y = top-left of the overlay (outer) layer.
 */
const FACE_LAYOUT = [
  { key: 'right',  baseX: 16, baseY: 8,  overlayX: 48, overlayY: 8  },
  { key: 'left',   baseX: 0,  baseY: 8,  overlayX: 32, overlayY: 8  },
  { key: 'top',    baseX: 8,  baseY: 0,  overlayX: 40, overlayY: 0  },
  { key: 'bottom', baseX: 16, baseY: 0,  overlayX: 48, overlayY: 0  },
  { key: 'front',  baseX: 8,  baseY: 8,  overlayX: 40, overlayY: 8  },
  { key: 'back',   baseX: 24, baseY: 8,  overlayX: 56, overlayY: 8  },
] as const;

/**
 * Reads an 8×8 block of RGBA pixels from the skin image at (originX, originY).
 * Assumes the image is 64×64 (or a multiple thereof).
 */
function readBlock(ctx: CanvasRenderingContext2D, originX: number, originY: number, scale: number)
  : Uint8ClampedArray[] {
  const rows: Uint8ClampedArray[] = [];
  for (let r = 0; r < 8; r++) {
    // Read one pixel per cell using the scaled coordinates
    const rowData = new Uint8ClampedArray(8 * 4);
    for (let c = 0; c < 8; c++) {
      const px = Math.floor(originX * scale + c * scale);
      const py = Math.floor(originY * scale + r * scale);
      const d = ctx.getImageData(px, py, 1, 1).data;
      rowData[c * 4]     = d[0];
      rowData[c * 4 + 1] = d[1];
      rowData[c * 4 + 2] = d[2];
      rowData[c * 4 + 3] = d[3];
    }
    rows.push(rowData);
  }
  return rows;
}



/**
 * Algorithmic heightmap generator.
 *
 * For each overlay pixel:
 *   alpha < 10  → 0 (transparent / empty — no voxel)
 *   alpha ≥ 10  → 1 (flush relief — same height as base, no gap)
 *
 * All opaque overlay pixels produce uniform flush relief.
 * The Corner Alignment Pass below ensures seamless seams at the 4 vertical corners.
 */
function generateAlgorithmicHeightmap(skinImg: HTMLImageElement): HeightmapData {
  // Draw the skin onto an off-screen canvas so we can read pixels
  const canvas = document.createElement('canvas');
  canvas.width  = skinImg.naturalWidth  || skinImg.width;
  canvas.height = skinImg.naturalHeight || skinImg.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(skinImg, 0, 0);

  // Native pixel scale (supports 64×64 and higher-res skins)
  const scale = canvas.width / 64;

  const ALPHA_THRESHOLD = 10;  // below this → transparent (no voxel)

  const result: HeightmapData = {
    offsets: {} as Record<string, number>,
    right: [], left: [], top: [], bottom: [], front: [], back: [],
  };

  for (const faceDef of FACE_LAYOUT) {
    // Only read overlay pixels — base layer no longer needed
    const overlayRows = readBlock(ctx, faceDef.overlayX, faceDef.overlayY, scale);
    result.offsets[faceDef.key] = 4.0;

    const matrix: number[][] = [];
    for (let r = 0; r < 8; r++) {
      const row: number[] = [];
      for (let c = 0; c < 8; c++) {
        const alpha = overlayRows[r][c * 4 + 3];
        // Opaque pixel → flush relief (1). Transparent → no voxel (0).
        row.push(alpha >= ALPHA_THRESHOLD ? 1 : 0);
      }
      matrix.push(row);
    }
    (result as any)[faceDef.key] = matrix;
  }

  // ── Corner Alignment Pass ────────────────────────────────────────────────
  // Guarantee perfect, hole-free 3D seams at the 4 vertical corners.
  const fM = result.front, lM = result.left, rM = result.right, bM = result.back;
  if (fM.length === 8 && lM.length === 8 && rM.length === 8 && bM.length === 8) {
    for (let row = 0; row < 8; row++) {
      const maxFL = Math.max(fM[row][0], lM[row][7]); fM[row][0] = maxFL; lM[row][7] = maxFL;
      const maxFR = Math.max(fM[row][7], rM[row][0]); fM[row][7] = maxFR; rM[row][0] = maxFR;
      const maxBR = Math.max(bM[row][0], rM[row][7]); bM[row][0] = maxBR; rM[row][7] = maxBR;
      const maxBL = Math.max(bM[row][7], lM[row][0]); bM[row][7] = maxBL; lM[row][0] = maxBL;
    }
  }

  return result;
}

// Keep the HeightmapData type for compatibility with HeadBuilder
function generateAIInputImage(skinImg: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  // Fill dark background
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, 720, 480);

  // Face definitions based on Minecraft skin layout coordinates
  const faces = [
    { key: 'right',  name: 'RIGHT FACE',  baseX: 16, baseY: 8, overlayX: 48, overlayY: 8, gridX: 0, gridY: 0 },
    { key: 'left',   name: 'LEFT FACE',   baseX: 0,  baseY: 8, overlayX: 32, overlayY: 8, gridX: 1, gridY: 0 },
    { key: 'top',    name: 'TOP FACE',    baseX: 8,  baseY: 0, overlayX: 40, overlayY: 0, gridX: 2, gridY: 0 },
    { key: 'bottom', name: 'BOTTOM FACE', baseX: 16, baseY: 0, overlayX: 48, overlayY: 0, gridX: 0, gridY: 1 },
    { key: 'front',  name: 'FRONT FACE',  baseX: 8,  baseY: 8, overlayX: 40, overlayY: 8, gridX: 1, gridY: 1 },
    { key: 'back',   name: 'BACK FACE',   baseX: 24, baseY: 8, overlayX: 56, overlayY: 8, gridX: 2, gridY: 1 }
  ];

  ctx.imageSmoothingEnabled = false;

  faces.forEach((f) => {
    const startX = f.gridX * 240;
    const startY = f.gridY * 240;

    // Draw Face Name
    ctx.fillStyle = '#f5c2e7';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(f.name, startX + 20, startY + 30);

    // Draw Labels
    ctx.fillStyle = '#a6adc8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Base', startX + 20, startY + 50);
    ctx.fillText('Overlay', startX + 130, startY + 50);

    const scale = skinImg.naturalWidth ? (skinImg.naturalWidth / 64) : (skinImg.width / 64 || 1);

    // Draw Base Head Face (8x8 * scale) scaled to 80x80
    ctx.drawImage(
      skinImg,
      f.baseX * scale,
      f.baseY * scale,
      8 * scale,
      8 * scale,
      startX + 20,
      startY + 60,
      80,
      80
    );

    // Draw Overlay Face (8x8 * scale) scaled to 80x80
    ctx.drawImage(
      skinImg,
      f.overlayX * scale,
      f.overlayY * scale,
      8 * scale,
      8 * scale,
      startX + 130,
      startY + 60,
      80,
      80
    );

    // Draw border around the faces
    ctx.strokeStyle = '#45475a';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX + 20, startY + 60, 80, 80);
    ctx.strokeRect(startX + 130, startY + 60, 80, 80);
  });

  // (legacy — kept so TypeScript doesn't error on the removed call-site below)
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1];
}


interface HeightmapData {
  message?: string;
  offsets: Record<string, number>;
  right: number[][];
  left: number[][];
  top: number[][];
  bottom: number[][];
  front: number[][];
  back: number[][];
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

  const { share: shareHead3d, minutesLeft } = useShareHead3d();
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

  // Voxel Relief States (algorithmic — no AI required)
  const [heightmap, setHeightmap] = useState<HeightmapData | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('custom_heightmap');
      if (saved) {
        try { return JSON.parse(saved); } catch { return null; }
      }
    }
    return null;
  });
  const [useRelief, setUseRelief] = useState<boolean>(false);
  const [reliefLoading, setReliefLoading] = useState<boolean>(false);

  const handleHeightmapChange = (map: HeightmapData | null) => {
    setHeightmap(map);
    if (typeof window !== 'undefined') {
      if (map) {
        localStorage.setItem('custom_heightmap', JSON.stringify(map));
      } else {
        localStorage.removeItem('custom_heightmap');
      }
    }
  };

  /** Generates the overlay heightmap using the deterministic pixel algorithm. */
  const handleGenerateRelief = async () => {
    if (!skinImage) {
      showToast('error', t('toast_load_skin_first'));
      return;
    }
    setReliefLoading(true);
    try {
      // Small async yield so the loading state renders before heavy pixel work
      await new Promise(r => setTimeout(r, 20));
      const map = generateAlgorithmicHeightmap(skinImage);
      handleHeightmapChange(map);
      setUseRelief(true);
      showToast('success', t('toast_relief_success'));
    } catch (err: any) {
      console.error(err);
      showToast('error', t('toast_relief_error', { error: err.message || err }));
    } finally {
      setReliefLoading(false);
    }
  };

  // (removed: handleAdjustAIRelief — AI chat adjustment no longer needed)
  const _unused_handleAdjustAIRelief = async () => {
    // body removed — function is no longer used
  };

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
      if (viewerRef.current) {
        viewerRef.current.renderOnce();
        previewCanvas = viewerRef.current.getCanvas();
      }
      const url = await shareHead3d(
        previewCanvas,
        skinSrc,
        extractedFaces,
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
        type: 'head3d',
        creatorName: creatorName.trim() || 'Anonymous',
        description: description.trim() || '',
        previewUrl: previewUrl,
        createdAt: Date.now(),
        skinUrl: skinSrc
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<ThreeViewer | null>(null);

  // Reset heightmap when a new skin is loaded
  useEffect(() => {
    setHeightmap(null);
    setUseRelief(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('custom_heightmap');
    }
  }, [skinImage]);

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
        const activeHeightmap = useRelief && heightmap ? heightmap : undefined;
        const headGroup = build3DHead(skinImage, activeHeightmap);
        viewerRef.current.setHeadModel(headGroup);
      }
    }
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [skinImage, autoRotate, showGrid, useRelief, heightmap]);

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
      await exportToOBJ(headModel, skinImage, useRelief && heightmap ? heightmap : undefined);
      showToast('success', t('toast_obj_success'));
      logExport('OBJ', 'skinbridge_cabeza.obj');
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
      await exportToFBX(headModel, skinImage, useRelief && heightmap ? heightmap : undefined);
      showToast('success', t('toast_fbx_success'));
      logExport('FBX', 'skinbridge_cabeza.fbx');
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
      await exportToGLB(headModel, skinImage || undefined, useRelief && heightmap ? heightmap : undefined);
      showToast('success', t('toast_glb_success'));
      logExport('GLB', 'skinbridge_cabeza.glb');
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
      logExport('BBMODEL', 'skinbridge_cabeza.bbmodel');
    } catch (err: any) {
      showToast('error', t('toast_bbmodel_error', { error: err.message }));
    }
  };

  const currentFaces = (activeTab === 'head' || activeTab === 'overlay') && extractedFaces ? extractedFaces[activeTab] : null;

  return (
    <main className="main-grid">
      <Head>
        <title>Minecraft Skin 3D Head Viewer &amp; Exporter | SkinBridge</title>
        <meta name="description" content="View your Minecraft skin as an interactive 3D head model. Export all 6 face textures (top, bottom, left, right, front, back) from your skin online." />
        <meta property="og:title" content="Minecraft Skin 3D Head Viewer &amp; Exporter" />
        <meta property="og:description" content="View your Minecraft skin as an interactive 3D head model and export all face textures online." />
        <link rel="canonical" href="https://skinbridge.vercel.app/head3d" />
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

        {/* 3D Voxel Relief Section */}
        {skinImage && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Relief description */}
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.4' }}>
              {t('relief_description')}
            </p>

            {/* Generate button */}
            <button
              className="glow-btn"
              onClick={handleGenerateRelief}
              disabled={reliefLoading}
              style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}
            >
              {reliefLoading ? t('btn_generating_relief') : t('btn_generate_relief')}
            </button>

            {/* Toggle relief on/off after generation */}
            {heightmap && (
              <label className="toggle-container" style={{ marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={useRelief}
                  onChange={(e) => setUseRelief(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <span className="checkbox-custom"></span>
                <span style={{ fontSize: '0.8rem' }}>{t('toggle_relief_label')}</span>
              </label>
            )}

            {/* Per-face flush/floating indicators */}
            {heightmap && useRelief && heightmap.offsets && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {Object.entries(heightmap.offsets).map(([face, val]) => {
                  const faceMatrix = (heightmap as any)[face] as number[][] | undefined;
                  const hasFloating = faceMatrix ? faceMatrix.some(row => row.some((v: number) => v === 3)) : false;
                  const isFloating = (val as number) > 4.0 || hasFloating;
                  return (
                    <div key={face} style={{
                      padding: '4px 6px', borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.7rem', color: '#a1a1aa',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#e4e4e7', marginBottom: '2px' }}>
                        {t(`face_${face}`) || face}
                      </span>
                      <span style={{ color: isFloating ? '#38bdf8' : '#a1a1aa', fontWeight: isFloating ? 'bold' : 'normal' }}>
                        {isFloating ? t('offset_gap') : t('offset_flush')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <p style={{ margin: 0, fontSize: '0.7rem', color: '#71717a', lineHeight: '1.3' }}>
              {t('relief_export_note')}
            </p>
          </div>
        )}
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
            <button className="glow-btn-secondary" onClick={handleExportOBJ}>
              <Download size={18} /> OBJ
            </button>
            <button className="glow-btn-secondary" onClick={handleExportFBX}>
              <Download size={18} /> FBX
            </button>
            <button className="glow-btn-secondary" onClick={handleExportGLB}>
              <Download size={18} /> GLB
            </button>
            <button className="glow-btn" onClick={handleExportBBModel}>
              <Download size={18} /> BBMODEL
            </button>
            {skinImage && (
              <button className="glow-btn-secondary" onClick={handleShareClick} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
