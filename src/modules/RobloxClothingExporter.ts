/**
 * RobloxClothingExporter.ts
 * 
 * Converts a Minecraft 64×64 skin PNG into Roblox Classic clothing templates:
 * - Shirt (585×559 px) — Torso + Arms only
 * - Pants (585×559 px) — Torso + Legs only (Roblox pants template includes torso)
 * 
 * Uses pixel-perfect nearest-neighbor scaling to preserve pixel art.
 * NO head data is ever included.
 */

// ─── Minecraft Skin Source Coordinates (64×64 atlas) ─────────────────────────

interface Rect { x: number; y: number; w: number; h: number; }

interface BodyPartFaces {
  front: Rect;
  back: Rect;
  left: Rect;
  right: Rect;
  top: Rect;
  bottom: Rect;
}

// Torso (body)
const MC_BODY: BodyPartFaces = {
  top:    { x: 20, y: 16, w: 8, h: 4 },
  bottom: { x: 28, y: 16, w: 8, h: 4 },
  left:   { x: 28, y: 20, w: 4, h: 12 }, // anatomically Left (third column)
  front:  { x: 20, y: 20, w: 8, h: 12 },
  right:  { x: 16, y: 20, w: 4, h: 12 }, // anatomically Right (first column)
  back:   { x: 32, y: 20, w: 8, h: 12 },
};

// Body overlay (jacket layer 2)
const MC_BODY_OVERLAY: BodyPartFaces = {
  top:    { x: 20, y: 32, w: 8, h: 4 },
  bottom: { x: 28, y: 32, w: 8, h: 4 },
  left:   { x: 28, y: 36, w: 4, h: 12 },
  front:  { x: 20, y: 36, w: 8, h: 12 },
  right:  { x: 16, y: 36, w: 4, h: 12 },
  back:   { x: 32, y: 36, w: 8, h: 12 },
};

// Right Arm
const MC_RIGHT_ARM: BodyPartFaces = {
  top:    { x: 44, y: 16, w: 4, h: 4 },
  bottom: { x: 48, y: 16, w: 4, h: 4 },
  left:   { x: 48, y: 20, w: 4, h: 12 },
  front:  { x: 44, y: 20, w: 4, h: 12 },
  right:  { x: 40, y: 20, w: 4, h: 12 },
  back:   { x: 52, y: 20, w: 4, h: 12 },
};

// Right Arm overlay (sleeve layer 2)
const MC_RIGHT_ARM_OVERLAY: BodyPartFaces = {
  top:    { x: 44, y: 32, w: 4, h: 4 },
  bottom: { x: 48, y: 32, w: 4, h: 4 },
  left:   { x: 48, y: 36, w: 4, h: 12 },
  front:  { x: 44, y: 36, w: 4, h: 12 },
  right:  { x: 40, y: 36, w: 4, h: 12 },
  back:   { x: 52, y: 36, w: 4, h: 12 },
};

// Left Arm (64×64 format)
const MC_LEFT_ARM: BodyPartFaces = {
  top:    { x: 36, y: 48, w: 4, h: 4 },
  bottom: { x: 40, y: 48, w: 4, h: 4 },
  left:   { x: 40, y: 52, w: 4, h: 12 },
  front:  { x: 36, y: 52, w: 4, h: 12 },
  right:  { x: 32, y: 52, w: 4, h: 12 },
  back:   { x: 44, y: 52, w: 4, h: 12 },
};

// Left Arm overlay (sleeve layer 2)
const MC_LEFT_ARM_OVERLAY: BodyPartFaces = {
  top:    { x: 52, y: 48, w: 4, h: 4 },
  bottom: { x: 56, y: 48, w: 4, h: 4 },
  left:   { x: 56, y: 52, w: 4, h: 12 },
  front:  { x: 52, y: 52, w: 4, h: 12 },
  right:  { x: 48, y: 52, w: 4, h: 12 },
  back:   { x: 60, y: 52, w: 4, h: 12 },
};

// Right Leg
const MC_RIGHT_LEG: BodyPartFaces = {
  top:    { x: 4,  y: 16, w: 4, h: 4 },
  bottom: { x: 8,  y: 16, w: 4, h: 4 },
  left:   { x: 8,  y: 20, w: 4, h: 12 },
  front:  { x: 4,  y: 20, w: 4, h: 12 },
  right:  { x: 0,  y: 20, w: 4, h: 12 },
  back:   { x: 12, y: 20, w: 4, h: 12 },
};

// Right Leg overlay (pants layer 2)
const MC_RIGHT_LEG_OVERLAY: BodyPartFaces = {
  top:    { x: 4,  y: 32, w: 4, h: 4 },
  bottom: { x: 8,  y: 32, w: 4, h: 4 },
  left:   { x: 8,  y: 36, w: 4, h: 12 },
  front:  { x: 4,  y: 36, w: 4, h: 12 },
  right:  { x: 0,  y: 36, w: 4, h: 12 },
  back:   { x: 12, y: 36, w: 4, h: 12 },
};

// Left Leg (64×64 format)
const MC_LEFT_LEG: BodyPartFaces = {
  top:    { x: 20, y: 48, w: 4, h: 4 },
  bottom: { x: 24, y: 48, w: 4, h: 4 },
  left:   { x: 24, y: 52, w: 4, h: 12 },
  front:  { x: 20, y: 52, w: 4, h: 12 },
  right:  { x: 16, y: 52, w: 4, h: 12 },
  back:   { x: 28, y: 52, w: 4, h: 12 },
};

// Left Leg overlay (pants layer 2)
const MC_LEFT_LEG_OVERLAY: BodyPartFaces = {
  top:    { x: 4,  y: 48, w: 4, h: 4 },
  bottom: { x: 8,  y: 48, w: 4, h: 4 },
  left:   { x: 8,  y: 52, w: 4, h: 12 },
  front:  { x: 4,  y: 52, w: 4, h: 12 },
  right:  { x: 0,  y: 52, w: 4, h: 12 },
  back:   { x: 12, y: 52, w: 4, h: 12 },
};


// ─── Roblox Classic Template Destination Coordinates (585×559) ───────────────
// Extracted from official Roblox R15 template images via pixel analysis.
// Both shirt and pants templates share the SAME layout structure.

// TORSO region (upper area of template)
const ROBLOX_TORSO: BodyPartFaces = {
  top:    { x: 231, y: 8,   w: 128, h: 64 },
  left:   { x: 361, y: 74,  w: 64,  h: 128 },  // Labeled "L" in template (anatomical Left)
  front:  { x: 231, y: 74,  w: 128, h: 128 },
  right:  { x: 165, y: 74,  w: 64,  h: 128 },  // Labeled "R" in template (anatomical Right)
  back:   { x: 427, y: 74,  w: 128, h: 128 },
  bottom: { x: 231, y: 204, w: 128, h: 64 },
};

// RIGHT ARM/LEG region (lower-left area of template)
const ROBLOX_RIGHT_LIMB: BodyPartFaces = {
  top:    { x: 217, y: 289, w: 64, h: 64 },
  left:   { x: 19,  y: 355, w: 64, h: 128 },   // Labeled "L" in template
  back:   { x: 85,  y: 355, w: 64, h: 128 },   // Labeled "B"
  right:  { x: 151, y: 355, w: 64, h: 128 },   // Labeled "R"
  front:  { x: 217, y: 355, w: 64, h: 128 },   // Labeled "F"
  bottom: { x: 217, y: 485, w: 64, h: 64 },
};

// LEFT ARM/LEG region (lower-right area of template)
const ROBLOX_LEFT_LIMB: BodyPartFaces = {
  top:    { x: 308, y: 289, w: 64, h: 64 },
  front:  { x: 308, y: 355, w: 64, h: 128 },   // Labeled "F"
  left:   { x: 374, y: 355, w: 64, h: 128 },   // Labeled "L"
  back:   { x: 440, y: 355, w: 64, h: 128 },   // Labeled "B"
  right:  { x: 506, y: 355, w: 64, h: 128 },   // Labeled "R"
  bottom: { x: 308, y: 485, w: 64, h: 64 },
};


// ─── Core Rendering Functions ────────────────────────────────────────────────

const TEMPLATE_WIDTH = 585;
const TEMPLATE_HEIGHT = 559;

/**
 * Extract pixel data from the Minecraft skin image.
 */
function getSkinPixels(skinImage: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skinImage, 0, 0);
  return ctx.getImageData(0, 0, 64, 64);
}

/**
 * Draws a Minecraft skin face onto the Roblox template canvas using
 * nearest-neighbor scaling (no interpolation) for pixel-perfect results.
 * 
 * @param ctx - Destination canvas context (585×559)
 * @param skinData - Source pixel data from the 64×64 skin
 * @param src - Source rectangle in the Minecraft skin
 * @param dst - Destination rectangle in the Roblox template
 */
function drawFaceScaled(
  ctx: CanvasRenderingContext2D,
  skinData: ImageData,
  src: Rect,
  dst: Rect
) {
  const scaleX = dst.w / src.w;
  const scaleY = dst.h / src.h;

  for (let dy = 0; dy < dst.h; dy++) {
    for (let dx = 0; dx < dst.w; dx++) {
      // Map destination pixel back to source pixel (nearest-neighbor)
      const sx = Math.floor(dx / scaleX);
      const sy = Math.floor(dy / scaleY);

      const srcIdx = ((src.y + sy) * 64 + (src.x + sx)) * 4;
      const r = skinData.data[srcIdx];
      const g = skinData.data[srcIdx + 1];
      const b = skinData.data[srcIdx + 2];
      const a = skinData.data[srcIdx + 3];

      if (a === 0) continue; // Skip fully transparent pixels

      // For semi-transparent overlay pixels, composite over existing
      if (a < 255) {
        const existing = ctx.getImageData(dst.x + dx, dst.y + dy, 1, 1);
        const er = existing.data[0], eg = existing.data[1], 
              eb = existing.data[2], ea = existing.data[3];
        
        const alpha = a / 255;
        const invAlpha = 1 - alpha;
        
        ctx.fillStyle = `rgba(${Math.round(r * alpha + er * invAlpha)},${Math.round(g * alpha + eg * invAlpha)},${Math.round(b * alpha + eb * invAlpha)},${Math.max(ea / 255, alpha)})`;
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      }
      
      ctx.fillRect(dst.x + dx, dst.y + dy, 1, 1);
    }
  }
}

/**
 * Maps all faces of a body part from Minecraft source to Roblox destination.
 */
function mapBodyPart(
  ctx: CanvasRenderingContext2D,
  skinData: ImageData,
  mcPart: BodyPartFaces,
  robloxPart: BodyPartFaces
) {
  const faces: (keyof BodyPartFaces)[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  for (const face of faces) {
    drawFaceScaled(ctx, skinData, mcPart[face], robloxPart[face]);
  }
}

/**
 * Downloads a canvas as a PNG file.
 */
function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(); return; }
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      resolve();
    }, 'image/png');
  });
}


// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generates a Roblox Classic Shirt template (585×559) canvas from a Minecraft skin.
 * Contains: Torso (front, back, left, right, top, bottom) + Both Arms.
 * Does NOT include head or legs.
 * 
 * Composites base layer + overlay layer for pixel-perfect accuracy.
 */
export function generateRobloxShirtCanvas(skinImage: HTMLImageElement): HTMLCanvasElement {
  const skinData = getSkinPixels(skinImage);

  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Clear to fully transparent
  ctx.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

  // ── Base layers ──
  // Torso
  mapBodyPart(ctx, skinData, MC_BODY, ROBLOX_TORSO);
  // Right Arm → Right limb position on template
  mapBodyPart(ctx, skinData, MC_RIGHT_ARM, ROBLOX_RIGHT_LIMB);
  // Left Arm → Left limb position on template
  mapBodyPart(ctx, skinData, MC_LEFT_ARM, ROBLOX_LEFT_LIMB);

  // ── Overlay layers (composited on top) ──
  // Body overlay (jacket)
  mapBodyPart(ctx, skinData, MC_BODY_OVERLAY, ROBLOX_TORSO);
  // Right Arm overlay (right sleeve)
  mapBodyPart(ctx, skinData, MC_RIGHT_ARM_OVERLAY, ROBLOX_RIGHT_LIMB);
  // Left Arm overlay (left sleeve)
  mapBodyPart(ctx, skinData, MC_LEFT_ARM_OVERLAY, ROBLOX_LEFT_LIMB);

  return canvas;
}

/**
 * Generates a Roblox Classic Pants template (585×559) canvas from a Minecraft skin.
 * Contains: Torso (the pants template includes torso for waist area) + Both Legs.
 * Does NOT include head or arms.
 * 
 * Composites base layer + overlay layer for pixel-perfect accuracy.
 */
export function generateRobloxPantsCanvas(skinImage: HTMLImageElement): HTMLCanvasElement {
  const skinData = getSkinPixels(skinImage);

  const canvas = document.createElement('canvas');
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Clear to fully transparent
  ctx.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

  // ── Base layers ──
  // Torso (pants template includes torso for waist alignment)
  mapBodyPart(ctx, skinData, MC_BODY, ROBLOX_TORSO);
  // Right Leg → Right limb position on template
  mapBodyPart(ctx, skinData, MC_RIGHT_LEG, ROBLOX_RIGHT_LIMB);
  // Left Leg → Left limb position on template
  mapBodyPart(ctx, skinData, MC_LEFT_LEG, ROBLOX_LEFT_LIMB);

  // ── Overlay layers (composited on top) ──
  // Body overlay (belt area)
  mapBodyPart(ctx, skinData, MC_BODY_OVERLAY, ROBLOX_TORSO);
  // Right Leg overlay
  mapBodyPart(ctx, skinData, MC_RIGHT_LEG_OVERLAY, ROBLOX_RIGHT_LIMB);
  // Left Leg overlay
  mapBodyPart(ctx, skinData, MC_LEFT_LEG_OVERLAY, ROBLOX_LEFT_LIMB);

  return canvas;
}

/**
 * Exports a Roblox Classic Shirt template (585×559) from a Minecraft skin.
 */
export function exportRobloxShirt(skinImage: HTMLImageElement): Promise<void> {
  const canvas = generateRobloxShirtCanvas(skinImage);
  return downloadCanvasAsPNG(canvas, 'shirt.png');
}

/**
 * Exports a Roblox Classic Pants template (585×559) from a Minecraft skin.
 */
export function exportRobloxPants(skinImage: HTMLImageElement): Promise<void> {
  const canvas = generateRobloxPantsCanvas(skinImage);
  return downloadCanvasAsPNG(canvas, 'pants.png');
}

/**
 * Draws a 2D preview of Roblox Classic clothing (shirt or pants) for a specific view
 * (front, back, left, right) onto a destination canvas.
 */
export function drawRobloxPreview(
  type: 'shirt' | 'pants',
  view: 'front' | 'back' | 'left' | 'right',
  skinImage: HTMLImageElement,
  destCanvas: HTMLCanvasElement
) {
  const templateCanvas = type === 'shirt'
    ? generateRobloxShirtCanvas(skinImage)
    : generateRobloxPantsCanvas(skinImage);

  const destCtx = destCanvas.getContext('2d');
  if (!destCtx) return;

  destCtx.imageSmoothingEnabled = false;

  const copyRect = (srcRect: Rect, dx: number, dy: number, dw: number, dh: number) => {
    destCtx.drawImage(
      templateCanvas,
      srcRect.x, srcRect.y, srcRect.w, srcRect.h,
      dx, dy, dw, dh
    );
  };

  if (type === 'shirt') {
    if (view === 'front') {
      destCanvas.width = 256;
      destCanvas.height = 128;
      destCtx.clearRect(0, 0, 256, 128);
      // Right Arm Front (draw on viewer's left side)
      copyRect(ROBLOX_RIGHT_LIMB.front, 0, 0, 64, 128);
      // Torso Front
      copyRect(ROBLOX_TORSO.front, 64, 0, 128, 128);
      // Left Arm Front (draw on viewer's right side)
      copyRect(ROBLOX_LEFT_LIMB.front, 192, 0, 64, 128);
    } else if (view === 'back') {
      destCanvas.width = 256;
      destCanvas.height = 128;
      destCtx.clearRect(0, 0, 256, 128);
      // Left Arm Back
      copyRect(ROBLOX_LEFT_LIMB.back, 0, 0, 64, 128);
      // Torso Back
      copyRect(ROBLOX_TORSO.back, 64, 0, 128, 128);
      // Right Arm Back
      copyRect(ROBLOX_RIGHT_LIMB.back, 192, 0, 64, 128);
    } else if (view === 'left') {
      destCanvas.width = 128;
      destCanvas.height = 128;
      destCtx.clearRect(0, 0, 128, 128);
      // Torso Left
      copyRect(ROBLOX_TORSO.left, 0, 0, 64, 128);
      // Left Arm Left
      copyRect(ROBLOX_LEFT_LIMB.left, 64, 0, 64, 128);
    } else if (view === 'right') {
      destCanvas.width = 128;
      destCanvas.height = 128;
      destCtx.clearRect(0, 0, 128, 128);
      // Right Arm Right
      copyRect(ROBLOX_RIGHT_LIMB.right, 0, 0, 64, 128);
      // Torso Right
      copyRect(ROBLOX_TORSO.right, 64, 0, 64, 128);
    }
  } else {
    // pants
    if (view === 'front') {
      destCanvas.width = 128;
      destCanvas.height = 256;
      destCtx.clearRect(0, 0, 128, 256);
      // Torso Front
      copyRect(ROBLOX_TORSO.front, 0, 0, 128, 128);
      // Right Leg Front
      copyRect(ROBLOX_RIGHT_LIMB.front, 0, 128, 64, 128);
      // Left Leg Front
      copyRect(ROBLOX_LEFT_LIMB.front, 64, 128, 64, 128);
    } else if (view === 'back') {
      destCanvas.width = 128;
      destCanvas.height = 256;
      destCtx.clearRect(0, 0, 128, 256);
      // Torso Back
      copyRect(ROBLOX_TORSO.back, 0, 0, 128, 128);
      // Left Leg Back
      copyRect(ROBLOX_LEFT_LIMB.back, 0, 128, 64, 128);
      // Right Leg Back
      copyRect(ROBLOX_RIGHT_LIMB.back, 64, 128, 64, 128);
    } else if (view === 'left') {
      destCanvas.width = 64;
      destCanvas.height = 256;
      destCtx.clearRect(0, 0, 64, 256);
      // Torso Left
      copyRect(ROBLOX_TORSO.left, 0, 0, 64, 128);
      // Left Leg Left
      copyRect(ROBLOX_LEFT_LIMB.left, 0, 128, 64, 128);
    } else if (view === 'right') {
      destCanvas.width = 64;
      destCanvas.height = 256;
      destCtx.clearRect(0, 0, 64, 256);
      // Torso Right
      copyRect(ROBLOX_TORSO.right, 0, 0, 64, 128);
      // Right Leg Right
      copyRect(ROBLOX_RIGHT_LIMB.right, 0, 128, 64, 128);
    }
  }
}

