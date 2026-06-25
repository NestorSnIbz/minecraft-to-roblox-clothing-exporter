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
  
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, 64, 64);
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

function createSinglePixelFaces(px: number, py: number) {
  const uv = [px, py, px + 1, py + 1];
  return {
    north: { uv, texture: 0 },
    south: { uv, texture: 0 },
    west: { uv, texture: 0 },
    east: { uv, texture: 0 },
    up: { uv, texture: 0 },
    down: { uv, texture: 0 },
  };
}

function buildClassicBBModel(skinImage: HTMLImageElement) {
  const textureUuid = generateUUID();
  const headCubeUuid = generateUUID();
  const overlayCubeUuid = generateUUID();
  const boneUuid = generateUUID();

  const base64Texture = getBase64Image(skinImage);

  return {
    meta: {
      format_version: '4.9',
      model_format: 'free',
      box_uv: false,
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
        path: '',
        uuid: textureUuid,
        source: base64Texture,
      },
    ],
    elements: [
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
          north: { uv: [8, 8, 16, 16], texture: 0 },
          south: { uv: [24, 8, 32, 16], texture: 0 },
          west: { uv: [16, 8, 24, 16], texture: 0 },
          east: { uv: [0, 8, 8, 16], texture: 0 },
          up: { uv: [16, 8, 8, 0], texture: 0 },
          down: { uv: [16, 0, 24, 8], texture: 0 },
        },
      },
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
          north: { uv: [40, 8, 48, 16], texture: 0 },
          south: { uv: [56, 8, 64, 16], texture: 0 },
          west: { uv: [48, 8, 56, 16], texture: 0 },
          east: { uv: [32, 8, 40, 16], texture: 0 },
          up: { uv: [48, 8, 40, 0], texture: 0 },
          down: { uv: [48, 0, 56, 8], texture: 0 },
        },
      },
    ],
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
}

function buildReliefBBModel(skinImage: HTMLImageElement, heightmap: any) {
  const textureUuid = generateUUID();
  const headCubeUuid = generateUUID();
  const boneUuid = generateUUID();
  const overlayChildren: string[] = [];

  const base64Texture = getBase64Image(skinImage);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo crear el contexto 2D para BBModel.');
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skinImage, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);

  const pixelSize = 1.125;
  const gridOffset = 3.9375;
  const thickness = 0.35;
  const offsets = heightmap?.offsets ?? {
    right: 4.0,
    left: 4.0,
    top: 4.0,
    bottom: 4.0,
    front: 4.0,
    back: 4.0,
  };

  const faceDefs = [
    {
      key: 'right',
      startX: 48,
      startY: 8,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [pixelOffset + thickness / 2, gridOffset - row * pixelSize, gridOffset - col * pixelSize],
        size: [thickness, pixelSize, pixelSize],
      }),
    },
    {
      key: 'left',
      startX: 32,
      startY: 8,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [-(pixelOffset + thickness / 2), gridOffset - row * pixelSize, -gridOffset + col * pixelSize],
        size: [thickness, pixelSize, pixelSize],
      }),
    },
    {
      key: 'top',
      startX: 40,
      startY: 0,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [-gridOffset + col * pixelSize, pixelOffset + thickness / 2, -gridOffset + row * pixelSize],
        size: [pixelSize, thickness, pixelSize],
      }),
    },
    {
      key: 'bottom',
      startX: 48,
      startY: 0,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [gridOffset - col * pixelSize, -(pixelOffset + thickness / 2), -gridOffset + row * pixelSize],
        size: [pixelSize, thickness, pixelSize],
      }),
    },
    {
      key: 'front',
      startX: 40,
      startY: 8,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [-gridOffset + col * pixelSize, gridOffset - row * pixelSize, pixelOffset + thickness / 2],
        size: [pixelSize, pixelSize, thickness],
      }),
    },
    {
      key: 'back',
      startX: 56,
      startY: 8,
      getBox: (col: number, row: number, pixelOffset: number) => ({
        center: [gridOffset - col * pixelSize, gridOffset - row * pixelSize, -(pixelOffset + thickness / 2)],
        size: [pixelSize, pixelSize, thickness],
      }),
    },
  ] as const;

  const elements: any[] = [
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
        north: { uv: [8, 8, 16, 16], texture: 0 },
        south: { uv: [24, 8, 32, 16], texture: 0 },
        west: { uv: [16, 8, 24, 16], texture: 0 },
        east: { uv: [0, 8, 8, 16], texture: 0 },
        up: { uv: [16, 8, 8, 0], texture: 0 },
        down: { uv: [16, 0, 24, 8], texture: 0 },
      },
    },
  ];

  for (const face of faceDefs) {
    const faceHeightmap = heightmap?.[face.key];
    const faceDefaultOffset = offsets[face.key as keyof typeof offsets] ?? 4.0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const px = face.startX + col;
        const py = face.startY + row;
        const idx = (py * 64 + px) * 4;
        const alpha = imgData.data[idx + 3];
        if (alpha <= 10) {
          continue;
        }

        let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
        if (heightVal === 0) {
          heightVal = 1;
        }

        const pixelOffset = heightVal === 3 || heightVal === 4
          ? faceDefaultOffset + 0.175
          : faceDefaultOffset;

        const { center, size } = face.getBox(col, row, pixelOffset);
        const [cx, cy, cz] = center;
        const [sx, sy, sz] = size;
        const uuid = generateUUID();
        overlayChildren.push(uuid);

        elements.push({
          name: `overlay_${face.key}_${row}_${col}`,
          type: 'cube',
          box_uv: false,
          from: [cx - sx / 2, cy - sy / 2, cz - sz / 2],
          to: [cx + sx / 2, cy + sy / 2, cz + sz / 2],
          origin: [0, 0, 0],
          uuid,
          color: 5,
          locked: false,
          visibility: true,
          faces: createSinglePixelFaces(px, py),
        });
      }
    }
  }

  return {
    meta: {
      format_version: '4.9',
      model_format: 'free',
      box_uv: false,
    },
    name: 'cabeza_minecraft_relieve',
    model_identifier: 'cabeza_minecraft_relieve',
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
        path: '',
        uuid: textureUuid,
        source: base64Texture,
      },
    ],
    elements,
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
        children: [headCubeUuid, ...overlayChildren],
      },
    ],
  };
}

/**
 * Exports the Minecraft head (and overlay) as a .bbmodel JSON file.
 * 
 * @param skinImage The original uploaded 64x64 skin image element
 */
export function exportToBBModelClassic(skinImage: HTMLImageElement) {
  const jsonString = JSON.stringify(buildClassicBBModel(skinImage), null, 2);
  downloadBBModelFile(jsonString, 'skinbridge_cabeza.bbmodel');
}

export function exportToBBModelWithRelief(skinImage: HTMLImageElement, heightmap: any) {
  const jsonString = JSON.stringify(buildReliefBBModel(skinImage, heightmap), null, 2);
  downloadBBModelFile(jsonString, 'skinbridge_cabeza.bbmodel');
}

export function exportToBBModel(skinImage: HTMLImageElement, heightmap?: any) {
  if (heightmap) {
    exportToBBModelWithRelief(skinImage, heightmap);
    return;
  }

  exportToBBModelClassic(skinImage);
}
