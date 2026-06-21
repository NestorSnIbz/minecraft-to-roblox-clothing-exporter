import * as THREE from 'three';

// Face indices in Three.js BoxGeometry
// 0: Right (+X)
// 1: Left (-X)
// 2: Top (+Y)
// 3: Bottom (-Y)
// 4: Front (+Z)
// 5: Back (-Z)

interface FaceUVCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Sets the UV coordinates for a specific face of a BoxGeometry.
 * 
 * @param uvAttribute The BufferAttribute representing UVs
 * @param faceIndex Index of the face (0-5)
 * @param coords Pixel coordinates on the 64x64 texture
 */
function setFaceUVs(
  uvAttribute: THREE.BufferAttribute,
  faceIndex: number,
  coords: FaceUVCoords,
  isOverlay: boolean
) {
  const textureSize = 64;
  
  // Calculate UV boundaries (WebGL coordinates: bottom-left is 0,0, top-right is 1,1)
  const uMin = coords.x / textureSize;
  const uMax = (coords.x + coords.w) / textureSize;
  const vMin = (textureSize - (coords.y + coords.h)) / textureSize;
  const vMax = (textureSize - coords.y) / textureSize;

  const startIdx = faceIndex * 4;
  
  if (faceIndex === 2 && !isOverlay) {
    // Revert change for base layer top face: horizontally mirrored mapping
    // Vertex 0 (Top-Left of face)
    uvAttribute.setXY(startIdx, uMax, vMax);
    // Vertex 1 (Top-Right of face)
    uvAttribute.setXY(startIdx + 1, uMin, vMax);
    // Vertex 2 (Bottom-Left of face)
    uvAttribute.setXY(startIdx + 2, uMax, vMin);
    // Vertex 3 (Bottom-Right of face)
    uvAttribute.setXY(startIdx + 3, uMin, vMin);
  } else if (faceIndex === 3) {
    // Bottom face: vertically flipped AND horizontally mirrored to match standard Minecraft skin layout orientation
    // Vertex 0 (Top-Left of face: bottom-left-front)
    uvAttribute.setXY(startIdx, uMax, vMin);
    // Vertex 1 (Top-Right of face: bottom-right-front)
    uvAttribute.setXY(startIdx + 1, uMin, vMin);
    // Vertex 2 (Bottom-Left of face: bottom-left-back)
    uvAttribute.setXY(startIdx + 2, uMax, vMax);
    // Vertex 3 (Bottom-Right of face: bottom-right-back)
    uvAttribute.setXY(startIdx + 3, uMin, vMax);
  } else {
    // All other faces (including Top face of outer layer): standard mapping
    // Vertex 0 (Top-Left of face)
    uvAttribute.setXY(startIdx, uMin, vMax);
    // Vertex 1 (Top-Right of face)
    uvAttribute.setXY(startIdx + 1, uMax, vMax);
    // Vertex 2 (Bottom-Left of face)
    uvAttribute.setXY(startIdx + 2, uMin, vMin);
    // Vertex 3 (Bottom-Right of face)
    uvAttribute.setXY(startIdx + 3, uMax, vMin);
  }
}

/**
 * Applies custom Minecraft head UV coordinates to a BoxGeometry.
 * 
 * @param geometry The THREE.BoxGeometry to modify
 * @param isOverlay Whether to map overlay (Hat Layer) coordinates instead of base head
 */
export function applyHeadUVs(geometry: THREE.BoxGeometry, isOverlay: boolean) {
  const uvAttribute = geometry.attributes.uv as THREE.BufferAttribute;
  const offset = isOverlay ? 32 : 0;

  // Face definitions based on Minecraft head skin layout
  const faces: { [key: number]: FaceUVCoords } = {
    0: { x: 16 + offset, y: 8, w: 8, h: 8 },  // Right Face (+X)
    1: { x: 0 + offset,  y: 8, w: 8, h: 8 },  // Left Face (-X)
    2: { x: 8 + offset,  y: 0, w: 8, h: 8 },  // Top Face (+Y)
    3: { x: 16 + offset, y: 0, w: 8, h: 8 },  // Bottom Face (-Y)
    4: { x: 8 + offset,  y: 8, w: 8, h: 8 },  // Front Face (+Z)
    5: { x: 24 + offset, y: 8, w: 8, h: 8 },  // Back Face (-Z)
  };

  for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
    setFaceUVs(uvAttribute, faceIdx, faces[faceIdx], isOverlay);
  }

  // Mark the UV attribute as needing an update
  uvAttribute.needsUpdate = true;
}

/**
 * Builds the Minecraft Head 3D model (Group containing Head and HeadOverlay meshes).
 * 
 * @param skinImage The HTMLImageElement containing the skin
 * @returns A THREE.Group containing the 3D Head model
 */
export function build3DHead(skinImage: HTMLImageElement): THREE.Group {
  // 1. Create a texture from the skin image
  const texture = new THREE.CanvasTexture(skinImage);
  // Enable sharp pixel art rendering
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  // 2. Base Head (size 8x8x8)
  const headGeo = new THREE.BoxGeometry(8, 8, 8);
  applyHeadUVs(headGeo, false);
  
  const headMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.6,
    metalness: 0.1,
    transparent: false,
  });
  
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.name = 'Head';
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;

  // 3. Head Overlay (size 9x9x9, representing 0.5 unit inflation on all sides)
  const overlayGeo = new THREE.BoxGeometry(9, 9, 9);
  applyHeadUVs(overlayGeo, true);
  
  const overlayMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    alphaTest: 0.1, // discard transparent pixels to avoid depth-sorting issues
    side: THREE.DoubleSide, // render inner side as well for details
  });
  
  const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
  overlayMesh.name = 'HeadOverlay';
  overlayMesh.castShadow = true;
  overlayMesh.receiveShadow = true;

  // 4. Combine into a group
  const group = new THREE.Group();
  group.name = 'MinecraftHead';
  group.add(headMesh);
  group.add(overlayMesh);

  return group;
}
