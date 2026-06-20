/**
 * TextureExtractor.ts
 * Module to crop and extract individual face textures from a Minecraft skin image.
 */

export interface FaceData {
  name: string;
  dataUrl: string;
  x: number;
  y: number;
}

export interface ExtractedFaces {
  head: {
    top: FaceData;
    bottom: FaceData;
    left: FaceData;
    front: FaceData;
    right: FaceData;
    back: FaceData;
  };
  overlay: {
    top: FaceData;
    bottom: FaceData;
    left: FaceData;
    front: FaceData;
    right: FaceData;
    back: FaceData;
  };
}

/**
 * Extracts a specific rectangular region from an image and returns it as a base64 Data URL.
 */
function cropRegion(
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }

  // Disable image smoothing to preserve sharp pixel art edges
  ctx.imageSmoothingEnabled = false;
  
  // Draw only the specified region
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  
  return canvas.toDataURL('image/png');
}

/**
 * Extracts all 12 head and overlay faces from the Minecraft skin image.
 * 
 * @param image The validated 64x64 skin image element
 * @returns ExtractedFaces object containing data URLs for each face
 */
export function extractFaces(image: HTMLImageElement): ExtractedFaces {
  return {
    head: {
      top: { name: 'Superior (Top)', dataUrl: cropRegion(image, 8, 0, 8, 8), x: 8, y: 0 },
      bottom: { name: 'Inferior (Bottom)', dataUrl: cropRegion(image, 16, 0, 8, 8), x: 16, y: 0 },
      left: { name: 'Izquierda (Left/East)', dataUrl: cropRegion(image, 0, 8, 8, 8), x: 0, y: 8 },
      front: { name: 'Frente (Front)', dataUrl: cropRegion(image, 8, 8, 8, 8), x: 8, y: 8 },
      right: { name: 'Derecha (Right/West)', dataUrl: cropRegion(image, 16, 8, 8, 8), x: 16, y: 8 },
      back: { name: 'Detrás (Back)', dataUrl: cropRegion(image, 24, 8, 8, 8), x: 24, y: 8 },
    },
    overlay: {
      top: { name: 'Superior (Top)', dataUrl: cropRegion(image, 40, 0, 8, 8), x: 40, y: 0 },
      bottom: { name: 'Inferior (Bottom)', dataUrl: cropRegion(image, 48, 0, 8, 8), x: 48, y: 0 },
      left: { name: 'Izquierda (Left/East)', dataUrl: cropRegion(image, 32, 8, 8, 8), x: 32, y: 8 },
      front: { name: 'Frente (Front)', dataUrl: cropRegion(image, 40, 8, 8, 8), x: 40, y: 8 },
      right: { name: 'Derecha (Right/West)', dataUrl: cropRegion(image, 48, 8, 8, 8), x: 48, y: 8 },
      back: { name: 'Detrás (Back)', dataUrl: cropRegion(image, 56, 8, 8, 8), x: 56, y: 8 },
    },
  };
}
