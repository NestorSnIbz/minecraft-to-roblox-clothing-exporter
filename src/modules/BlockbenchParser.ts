import * as THREE from 'three';

export interface BlockbenchTexture {
  id: string;
  uuid?: string;
  name: string;
  source: string; // Base64 data URL
  width: number;
  height: number;
  loadedImage?: HTMLImageElement;
  threeMaterial?: THREE.MeshStandardMaterial;
}

export interface ParsedBlockbenchModel {
  group: THREE.Group;
  textures: BlockbenchTexture[];
}

/**
 * Loads a base64 image string into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load embedded texture'));
    img.src = src;
  });
}

/**
 * Generates a default 64x64 grid texture to use as a fallback if no textures are provided.
 */
function generateFallbackTexture(): HTMLImageElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  // Grey checkerboard grid
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, 64, 64);
  
  ctx.fillStyle = '#27272a';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
    }
  }
  
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}

/**
 * Normalizes and rotates UV coordinate coordinates for a BoxGeometry face.
 */
function assignFaceUVs(
  uvAttribute: THREE.BufferAttribute,
  faceIndex: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  texWidth: number,
  texHeight: number,
  rotation: number
) {
  // Apply a tiny half-pixel inset margin (0.02 pixels) to pull UV coordinates slightly inward.
  // This completely eliminates Bilinear Bleeding / Alpha Bleeding (dark lines and blurry transitions at the borders).
  const margin = 0.02;
  
  const uMin = (u1 < u2 ? u1 + margin : u1 - margin) / texWidth;
  const uMax = (u1 < u2 ? u2 - margin : u2 + margin) / texWidth;
  const vMin = 1.0 - ((v1 < v2 ? v2 - margin : v2 + margin) / texHeight);
  const vMax = 1.0 - ((v1 < v2 ? v1 + margin : v1 - margin) / texHeight);

  // Default Three.js vertex order for a face: TL, TR, BL, BR
  const points = [
    { u: uMin, v: vMax }, // Top-Left
    { u: uMax, v: vMax }, // Top-Right
    { u: uMin, v: vMin }, // Bottom-Left
    { u: uMax, v: vMin }  // Bottom-Right
  ];

  // Rotate UV coordinates if specified (90, 180, 270 degrees clockwise)
  let rotated = points;
  if (rotation === 90) {
    rotated = [points[2], points[0], points[3], points[1]];
  } else if (rotation === 180) {
    rotated = [points[3], points[2], points[1], points[0]];
  } else if (rotation === 270) {
    rotated = [points[1], points[3], points[0], points[2]];
  }

  // Write UV coordinates to buffer
  const startIdx = faceIndex * 4;
  uvAttribute.setXY(startIdx + 0, rotated[0].u, rotated[0].v); // TL
  uvAttribute.setXY(startIdx + 1, rotated[1].u, rotated[1].v); // TR
  uvAttribute.setXY(startIdx + 2, rotated[2].u, rotated[2].v); // BL
  uvAttribute.setXY(startIdx + 3, rotated[3].u, rotated[3].v); // BR
}

/**
 * Scales an image up to 1024x1024 using Nearest-Neighbor interpolation on a canvas.
 */
function scaleImageTo1024(image: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(image);
      return;
    }
    
    // Nearest-neighbor scaling settings
    ctx.imageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;
    
    ctx.drawImage(
      image,
      0, 0, image.naturalWidth || image.width, image.naturalHeight || image.height,
      0, 0, 1024, 1024
    );
    
    const scaledImg = new Image();
    scaledImg.onload = () => resolve(scaledImg);
    scaledImg.onerror = () => resolve(image); // Fallback to original if load fails
    scaledImg.src = canvas.toDataURL('image/png');
  });
}

/**
 * Parses the raw .bbmodel JSON and builds the corresponding 3D meshes.
 */
export async function parseBlockbenchModel(jsonText: string): Promise<ParsedBlockbenchModel> {
  const data = JSON.parse(jsonText);
  
  if (!data.elements || !Array.isArray(data.elements)) {
    throw new Error('Invalid .bbmodel structure: elements array is missing.');
  }

  const modelGroup = new THREE.Group();
  modelGroup.name = 'BlockbenchModel';

  // 1. Parse and Load Textures
  const parsedTextures: BlockbenchTexture[] = [];
  const rawTextures = data.textures || [];
  
  for (const tex of rawTextures) {
    let img: HTMLImageElement;
    if (tex.source && tex.source.startsWith('data:')) {
      try {
        img = await loadImage(tex.source);
      } catch (err) {
        console.warn('Failed to load embedded texture:', tex.name, err);
        img = generateFallbackTexture();
      }
    } else {
      img = generateFallbackTexture();
    }

    // Scale up to 1024x1024 to make Roblox Studio render it sharp
    const scaledImg = await scaleImageTo1024(img);

    // Create a WebGL Texture
    const texture = new THREE.Texture(scaledImg);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.name = tex.name || 'texture.png';
    (texture as any).sourceFile = tex.name || 'texture.png';
    texture.needsUpdate = true;

    // Standard material referencing this texture
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      side: THREE.DoubleSide
    });
    material.name = `mat_${tex.name || tex.id}`;

    parsedTextures.push({
      id: String(tex.id),
      uuid: tex.uuid,
      name: tex.name || 'texture.png',
      source: tex.source || '',
      width: tex.width || 64,
      height: tex.height || 64,
      loadedImage: scaledImg,
      threeMaterial: material
    });
  }

  // Fallback if no textures exist in the file
  if (parsedTextures.length === 0) {
    const fallbackImg = generateFallbackTexture();
    const scaledFallbackImg = await scaleImageTo1024(fallbackImg);
    const texture = new THREE.Texture(scaledFallbackImg);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.name = 'fallback.png';
    texture.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      side: THREE.DoubleSide
    });
    material.name = 'mat_fallback';

    parsedTextures.push({
      id: 'fallback',
      name: 'fallback.png',
      source: '',
      width: 64,
      height: 64,
      loadedImage: scaledFallbackImg,
      threeMaterial: material
    });
  }

  // Shared transparent material for faces that have no texture assigned
  const transparentMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  });
  transparentMaterial.name = 'mat_transparent';

  // Helper to map Blockbench texture ref to parsed texture
  const getTextureByRef = (ref: any): BlockbenchTexture => {
    if (ref === undefined || ref === null) return parsedTextures[0];
    const refStr = String(ref).replace('#', '');
    const found = parsedTextures.find(t => t.id === refStr || t.uuid === refStr);
    return found || parsedTextures[0];
  };

  // 2. Parse Elements
  for (let i = 0; i < data.elements.length; i++) {
    const el = data.elements[i];

    // Skip hidden elements (helps exclude toggled/hidden editor states)
    if (el.visibility === false) {
      continue;
    }

    // Skip locators/cameras/helpers that don't have any textured faces
    let hasTexturedFace = false;
    const faceOrderCheck = ['east', 'west', 'up', 'down', 'south', 'north'];
    if (el.faces) {
      for (const faceKey of faceOrderCheck) {
        const faceData = el.faces[faceKey];
        if (faceData && faceData.texture !== undefined && faceData.texture !== null) {
          hasTexturedFace = true;
          break;
        }
      }
    }
    if (!hasTexturedFace) {
      continue;
    }

    const from = el.from || [0, 0, 0];
    const to = el.to || [1, 1, 1];
    const origin = el.origin || [0, 0, 0];
    const rotation = el.rotation || [0, 0, 0];

    // Compute dimensions
    const width = Math.abs(to[0] - from[0]);
    const height = Math.abs(to[1] - from[1]);
    const depth = Math.abs(to[2] - from[2]);

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute;

    // Blockbench coordinates: center is mid-point
    const centerX = (from[0] + to[0]) / 2;
    const centerY = (from[1] + to[1]) / 2;
    const centerZ = (from[2] + to[2]) / 2;

    // Define 6 face materials in standard Three.js order:
    // +X (East), -X (West), +Y (Up), -Y (Down), +Z (South), -Z (North)
    const faceOrder = [
      { key: 'east', idx: 0 },
      { key: 'west', idx: 1 },
      { key: 'up', idx: 2 },
      { key: 'down', idx: 3 },
      { key: 'south', idx: 4 },
      { key: 'north', idx: 5 }
    ];

    const materials: THREE.Material[] = [];

    for (const faceInfo of faceOrder) {
      const faceData = el.faces ? el.faces[faceInfo.key] : null;
      if (faceData && faceData.texture !== undefined && faceData.texture !== null) {
        const tex = getTextureByRef(faceData.texture);
        materials.push(tex.threeMaterial || parsedTextures[0].threeMaterial!);
        
        // Map UV coordinates for this face
        const uv = faceData.uv || [0, 0, 16, 16];
        assignFaceUVs(
          uvAttribute,
          faceInfo.idx,
          uv[0],
          uv[1],
          uv[2],
          uv[3],
          tex.width,
          tex.height,
          faceData.rotation || 0
        );
      } else {
        materials.push(transparentMaterial);
      }
    }

    geometry.attributes.uv.needsUpdate = true;

    // Create mesh
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.name = el.name || `cube_${i}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Set position relative to rotation pivot (origin)
    mesh.position.set(
      centerX - origin[0],
      centerY - origin[1],
      centerZ - origin[2]
    );

    // Create rotation pivot group
    const pivot = new THREE.Group();
    pivot.name = `pivot_${el.name || i}`;
    pivot.position.set(origin[0], origin[1], origin[2]);
    pivot.add(mesh);

    // Apply rotation (Euler degrees converted to radians)
    // Blockbench rotation order is ZXY (Minecraft standard)
    pivot.rotation.order = 'ZXY';
    pivot.rotation.set(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2])
    );

    modelGroup.add(pivot);
  }

  // Center model globally around (0,0,0) by calculating bounding box
  const bbox = new THREE.Box3().setFromObject(modelGroup);
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  
  // Offset all top-level pivots so the model geometry centers nicely at origin
  modelGroup.children.forEach((child) => {
    child.position.sub(center);
  });

  return {
    group: modelGroup,
    textures: parsedTextures
  };
}
