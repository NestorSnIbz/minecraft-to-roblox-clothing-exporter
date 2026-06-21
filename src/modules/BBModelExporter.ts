/**
 * BBModelExporter.ts
 * Module to programmatically export the Minecraft Head as a Blockbench .bbmodel file.
 */

// Helper to generate RFC4122 v4 compliant UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Converts the skin image element to a base64 encoded data URI.
 */
function getBase64Image(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Triggers a browser download of the bbmodel content.
 */
function downloadBBModelFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Exports the Minecraft head (and overlay) as a .bbmodel JSON file.
 * 
 * @param skinImage The original uploaded 64x64 skin image element
 */
export function exportToBBModel(skinImage: HTMLImageElement) {
  const textureUuid = generateUUID();
  const headCubeUuid = generateUUID();
  const overlayCubeUuid = generateUUID();
  const boneUuid = generateUUID();

  const base64Texture = getBase64Image(skinImage);

  // Define the .bbmodel project structure with native Blockbench elements
  const bbmodel = {
    meta: {
      format_version: '4.9',
      model_format: 'free',
      box_uv: false, // Per-face UVs are required for custom skin offsets
    },
    name: 'cabeza_minecraft',
    model_identifier: 'cabeza_minecraft',
    resolution: {
      width: 64,
      height: 64,
    },
    textures: [
      {
        name: 'skin',
        folder: 'textures',
        namespace: 'minecraft',
        id: '0',
        path: 'skin.png',
        uuid: textureUuid,
        source: base64Texture,
      },
    ],
    elements: [
      // 1. Base Head Cube (Native Editable Cube)
      {
        name: 'Head',
        type: 'cube',
        box_uv: false,
        from: [-4, 0, -4],
        to: [4, 8, 4],
        origin: [0, 0, 0],
        uuid: headCubeUuid,
        color: 0,
        locked: false,
        visibility: true,
        faces: {
          north: { uv: [8, 8, 16, 16], texture: 0 },  // Front
          south: { uv: [24, 8, 32, 16], texture: 0 }, // Back
          west: { uv: [16, 8, 24, 16], texture: 0 },  // Right
          east: { uv: [0, 8, 8, 16], texture: 0 },    // Left
          up: { uv: [16, 8, 8, 0], texture: 0 },      // Top
          down: { uv: [16, 0, 24, 8], texture: 0 },  // Bottom
        },
      },
      // 2. Head Overlay Cube (Hat Layer, Native Editable Cube, inflated by 0.5 units on all sides)
      {
        name: 'HeadOverlay',
        type: 'cube',
        box_uv: false,
        from: [-4.5, -0.5, -4.5],
        to: [4.5, 8.5, 4.5],
        origin: [0, 0, 0],
        uuid: overlayCubeUuid,
        color: 5,
        locked: false,
        visibility: true,
        faces: {
          north: { uv: [40, 8, 48, 16], texture: 0 },  // Front
          south: { uv: [56, 8, 64, 16], texture: 0 }, // Back
          west: { uv: [48, 8, 56, 16], texture: 0 },  // Right
          east: { uv: [32, 8, 40, 16], texture: 0 },  // Left
          up: { uv: [48, 8, 40, 0], texture: 0 },      // Top
          down: { uv: [48, 0, 56, 8], texture: 0 },  // Bottom
        },
      },
    ],
    // Hierarchy grouping elements under a native "head" bone
    outliner: [
      {
        name: 'head',
        type: 'group',
        origin: [0, 0, 0],
        color: 0,
        uuid: boneUuid,
        export: true,
        isOpen: true,
        locked: false,
        visibility: true,
        children: [headCubeUuid, overlayCubeUuid],
      },
    ],
  };

  const jsonString = JSON.stringify(bbmodel, null, 2);
  downloadBBModelFile(jsonString, 'cabeza.bbmodel');
}
