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

interface SolidPixelUVBounds {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
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
  coords: FaceUVCoords
) {
  const textureSize = 64;
  const eps = 0.05; // safe inset to prevent floating-point precision from sampling adjacent transparent pixels
  
  // Calculate UV boundaries (WebGL coordinates: bottom-left is 0,0, top-right is 1,1)
  const uMin = (coords.x + eps) / textureSize;
  const uMax = (coords.x + coords.w - eps) / textureSize;
  const vMin = (textureSize - (coords.y + coords.h) + eps) / textureSize;
  const vMax = (textureSize - coords.y - eps) / textureSize;

  const startIdx = faceIndex * 4;
  
  if (faceIndex === 2) {
    // Top face: aligned to BBModel export [16, 8, 8, 0] / [48, 8, 40, 0]
    // Vertex 0 (Top-Left of face: back-left)
    uvAttribute.setXY(startIdx, uMin, vMax);
    // Vertex 1 (Top-Right of face: back-right)
    uvAttribute.setXY(startIdx + 1, uMax, vMax);
    // Vertex 2 (Bottom-Left of face: front-left)
    uvAttribute.setXY(startIdx + 2, uMin, vMin);
    // Vertex 3 (Bottom-Right of face: front-right)
    uvAttribute.setXY(startIdx + 3, uMax, vMin);
  } else if (faceIndex === 3) {
    // Bottom face: keep left/right orientation and mirror only top/bottom.
    // Vertex 0 (Top-Left of face: bottom-left-front)
    uvAttribute.setXY(startIdx, uMin, vMin);
    // Vertex 1 (Top-Right of face: bottom-right-front)
    uvAttribute.setXY(startIdx + 1, uMax, vMin);
    // Vertex 2 (Bottom-Left of face: bottom-left-back)
    uvAttribute.setXY(startIdx + 2, uMin, vMax);
    // Vertex 3 (Bottom-Right of face: bottom-right-back)
    uvAttribute.setXY(startIdx + 3, uMax, vMax);
  } else {
    // All other faces: standard mapping
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
    setFaceUVs(uvAttribute, faceIdx, faces[faceIdx]);
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
/**
 * Builds a BoxGeometry (non-indexed) with all UV coordinates mapped to a single pixel center
 * to ensure that all 6 sides of the voxel cube render as a solid pixel color.
 */
function setSolidPixelUVForBoxFace(
  uvAttr: THREE.BufferAttribute,
  faceIndex: number,
  bounds: SolidPixelUVBounds
) {
  const startIdx = faceIndex * 4;
  const uCenter = (bounds.uMin + bounds.uMax) / 2;
  const vCenter = (bounds.vMin + bounds.vMax) / 2;

  for (let i = 0; i < 4; i++) {
    uvAttr.setXY(startIdx + i, uCenter, vCenter);
  }
}

/**
 * Emits a single face of an axis-aligned box as a non-indexed quad (2 triangles).
 *
 * faceIndex follows THREE.BoxGeometry convention:
 *   0 = +X right   1 = -X left
 *   2 = +Y top     3 = -Y bottom
 *   4 = +Z front   5 = -Z back
 *
 * All 4 vertices are pinned to the UV center of the pixel (solid-pixel mapping)
 * to prevent bilinear bleeding between adjacent skin pixels.
 */
function buildSingleFaceGeometry(
  faceIndex: number,
  w: number, h: number, d: number,
  uMin: number, uMax: number, vMin: number, vMax: number
): THREE.BufferGeometry {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const uc = (uMin + uMax) / 2;
  const vc = (vMin + vMax) / 2;

  // Raw quad corners for each face (CCW winding when viewed from outside)
  type V3 = [number, number, number];
  const quads: [V3, V3, V3, V3, V3][] = [ // [v0, v1, v2, v3, normal]
    // 0: +X right
    [[ hw, -hh,  hd], [ hw,  hh,  hd], [ hw, -hh, -hd], [ hw,  hh, -hd], [1,0,0]],
    // 1: -X left
    [[-hw, -hh, -hd], [-hw,  hh, -hd], [-hw, -hh,  hd], [-hw,  hh,  hd], [-1,0,0]],
    // 2: +Y top
    [[-hw,  hh,  hd], [ hw,  hh,  hd], [-hw,  hh, -hd], [ hw,  hh, -hd], [0,1,0]],
    // 3: -Y bottom
    [[-hw, -hh, -hd], [ hw, -hh, -hd], [-hw, -hh,  hd], [ hw, -hh,  hd], [0,-1,0]],
    // 4: +Z front (outer / outward)
    [[-hw, -hh,  hd], [ hw, -hh,  hd], [-hw,  hh,  hd], [ hw,  hh,  hd], [0,0,1]],
    // 5: -Z back (inner / toward base head) — almost always culled
    [[ hw, -hh, -hd], [-hw, -hh, -hd], [ hw,  hh, -hd], [-hw,  hh, -hd], [0,0,-1]],
  ];

  const [v0, v1, v2, v3, n] = quads[faceIndex];
  const nx = n[0], ny = n[1], nz = n[2];

  // Triangle 0: v0, v1, v2 — Triangle 1: v1, v3, v2
  const positions = new Float32Array([
    v0[0],v0[1],v0[2],  v1[0],v1[1],v1[2],  v2[0],v2[1],v2[2],
    v1[0],v1[1],v1[2],  v3[0],v3[1],v3[2],  v2[0],v2[1],v2[2],
  ]);
  const normals = new Float32Array([
    nx,ny,nz, nx,ny,nz, nx,ny,nz,
    nx,ny,nz, nx,ny,nz, nx,ny,nz,
  ]);
  const uvs = new Float32Array([
    uc,vc, uc,vc, uc,vc,
    uc,vc, uc,vc, uc,vc,
  ]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
  geom.setAttribute('uv',       new THREE.BufferAttribute(uvs,       2));
  return geom;
}

/**
 * Builds a box geometry emitting ONLY the faces listed in `visibleFaces`.
 *
 * visibleFaces[i] === true  → emit face i  (THREE.BoxGeometry convention)
 * visibleFaces[4] is the OUTER face  (+Z before rotation) — outward-facing
 * visibleFaces[5] is the INNER face  (-Z before rotation) — toward base head, usually culled
 *
 * The resulting geometry is non-indexed (each triangle is independent) so it
 * can be safely merged with mergeBufferGeometries().
 */
function buildCulledBoxGeometry(
  w: number, h: number, d: number,
  uMin: number, uMax: number, vMin: number, vMax: number,
  visibleFaces: boolean[]
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let fi = 0; fi < 6; fi++) {
    if (visibleFaces[fi]) {
      parts.push(buildSingleFaceGeometry(fi, w, h, d, uMin, uMax, vMin, vMax));
    }
  }
  if (parts.length === 0) {
    // Return a degenerate empty geometry so callers don't need to null-check
    return new THREE.BufferGeometry();
  }
  if (parts.length === 1) return parts[0];
  const merged = mergeBufferGeometries(parts);
  parts.forEach(p => p.dispose());
  return merged;
}

/**
 * Like buildCulledBoxGeometry but each face can have its own UV bounds
 * (used for caps/tri-corners that span multiple skin pixels).
 */
function buildCulledBoxGeometryWithFacePixels(
  w: number, h: number, d: number,
  fallback: SolidPixelUVBounds,
  faceBounds: Partial<Record<number, SolidPixelUVBounds>>,
  visibleFaces: boolean[]
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let fi = 0; fi < 6; fi++) {
    if (visibleFaces[fi]) {
      const b = faceBounds[fi] ?? fallback;
      parts.push(buildSingleFaceGeometry(fi, w, h, d, b.uMin, b.uMax, b.vMin, b.vMax));
    }
  }
  if (parts.length === 0) return new THREE.BufferGeometry();
  if (parts.length === 1) return parts[0];
  const merged = mergeBufferGeometries(parts);
  parts.forEach(p => p.dispose());
  return merged;
}

// Legacy wrappers kept for external callers that still reference these names.
// They emit all 6 faces (no culling) — only used for the base head which has no coplanar issue.
function buildBoxGeometry(
  w: number, h: number, d: number,
  uMin: number, uMax: number, vMin: number, vMax: number
): THREE.BufferGeometry {
  return buildCulledBoxGeometry(w, h, d, uMin, uMax, vMin, vMax, [true,true,true,true,true,true]);
}

function buildBoxGeometryWithFacePixels(
  w: number, h: number, d: number,
  fallbackBounds: SolidPixelUVBounds,
  faceBounds: Partial<Record<number, SolidPixelUVBounds>>
): THREE.BufferGeometry {
  return buildCulledBoxGeometryWithFacePixels(
    w, h, d, fallbackBounds, faceBounds,
    [true,true,true,true,true,true] // caps emit all 6 until we decide which to cull below
  );
}

const BOX_FACE_INDEX_BY_KEY: Record<string, number> = {
  right: 0,
  left: 1,
  top: 2,
  bottom: 3,
  front: 4,
  back: 5,
};

const OPPOSITE_FACE_KEY: Record<string, string> = {
  right: 'left',
  left: 'right',
  top: 'bottom',
  bottom: 'top',
  front: 'back',
  back: 'front',
};

/**
 * Maps each head face key to the local-space face index (buildSingleFaceGeometry convention)
 * whose normal points OUTWARD for that face (away from the head center at origin).
 *
 * Face indices (pre-rotation local space):
 *   0 = +X right   1 = -X left
 *   2 = +Y top     3 = -Y bottom
 *   4 = +Z front   5 = -Z back
 *
 * Used to determine which faces of cap/corner geometry should be visible:
 * a cap between faceA and faceB should only show the faces with outward indices
 * for faceA and faceB, suppressing all other faces whose normals would be
 * perpendicular to the adjacent face's outward direction and therefore appear
 * as a darker border due to different lighting angle in MeshStandardMaterial.
 */
const FACE_KEY_OUTWARD_IDX: Record<string, number> = {
  right:  0,  // +X outward → face index 0
  left:   1,  // -X outward → face index 1
  top:    2,  // +Y outward → face index 2
  bottom: 3,  // -Y outward → face index 3
  front:  4,  // +Z outward → face index 4
  back:   5,  // -Z outward → face index 5
};


function assignAxisFacePixels(
  target: Partial<Record<number, SolidPixelUVBounds>>,
  faceKey: string,
  bounds: SolidPixelUVBounds,
  includeOpposite = true
) {
  const faceIndex = BOX_FACE_INDEX_BY_KEY[faceKey];
  target[faceIndex] = bounds;
  if (includeOpposite) {
    const oppositeIndex = BOX_FACE_INDEX_BY_KEY[OPPOSITE_FACE_KEY[faceKey]];
    target[oppositeIndex] = bounds;
  }
}

/**
 * Merges multiple BufferGeometries (non-indexed) into a single BufferGeometry.
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mergedGeom = new THREE.BufferGeometry();

  let totalVertices = 0;
  geometries.forEach((g) => {
    totalVertices += g.attributes.position.count;
  });

  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);

  let vertexOffset = 0;
  geometries.forEach((g) => {
    const posAttr = g.attributes.position;
    const normAttr = g.attributes.normal;
    const uvAttr = g.attributes.uv;

    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      positions[(vertexOffset + i) * 3] = posAttr.getX(i);
      positions[(vertexOffset + i) * 3 + 1] = posAttr.getY(i);
      positions[(vertexOffset + i) * 3 + 2] = posAttr.getZ(i);

      normals[(vertexOffset + i) * 3] = normAttr.getX(i);
      normals[(vertexOffset + i) * 3 + 1] = normAttr.getY(i);
      normals[(vertexOffset + i) * 3 + 2] = normAttr.getZ(i);

      uvs[(vertexOffset + i) * 2] = uvAttr.getX(i);
      uvs[(vertexOffset + i) * 2 + 1] = uvAttr.getY(i);
    }

    vertexOffset += count;
  });

  mergedGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  mergedGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  mergedGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const indices = new Uint16Array(totalVertices);
  for (let i = 0; i < totalVertices; i++) {
    indices[i] = i;
  }
  mergedGeom.setIndex(new THREE.BufferAttribute(indices, 1));

  return mergedGeom;
}

function removeExactDuplicateTriangles(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const positionAttr = geometry.getAttribute('position');
  const normalAttr = geometry.getAttribute('normal');
  const uvAttr = geometry.getAttribute('uv');

  if (
    !(positionAttr instanceof THREE.BufferAttribute) ||
    !(normalAttr instanceof THREE.BufferAttribute) ||
    !(uvAttr instanceof THREE.BufferAttribute)
  ) {
    return geometry;
  }

  const triangleCount = Math.floor(positionAttr.count / 3);
  const triangleGroups = new Map<string, number[]>();

  const vertexKey = (vertexIndex: number) =>
    `${positionAttr.getX(vertexIndex).toFixed(5)},${positionAttr.getY(vertexIndex).toFixed(5)},${positionAttr.getZ(vertexIndex).toFixed(5)}`;

  for (let tri = 0; tri < triangleCount; tri++) {
    const start = tri * 3;
    const key = [vertexKey(start), vertexKey(start + 1), vertexKey(start + 2)]
      .sort()
      .join('|');

    const bucket = triangleGroups.get(key);
    if (bucket) {
      bucket.push(tri);
    } else {
      triangleGroups.set(key, [tri]);
    }
  }

  const trianglesToKeep: number[] = [];
  for (const tris of triangleGroups.values()) {
    if (tris.length === 1) {
      trianglesToKeep.push(tris[0]);
    }
  }

  if (trianglesToKeep.length === triangleCount) {
    return geometry;
  }

  const nextPositions = new Float32Array(trianglesToKeep.length * 9);
  const nextNormals = new Float32Array(trianglesToKeep.length * 9);
  const nextUvs = new Float32Array(trianglesToKeep.length * 6);

  trianglesToKeep.forEach((tri, outTri) => {
    for (let corner = 0; corner < 3; corner++) {
      const srcVertex = tri * 3 + corner;
      const dstVertex = outTri * 3 + corner;

      nextPositions[dstVertex * 3] = positionAttr.getX(srcVertex);
      nextPositions[dstVertex * 3 + 1] = positionAttr.getY(srcVertex);
      nextPositions[dstVertex * 3 + 2] = positionAttr.getZ(srcVertex);

      nextNormals[dstVertex * 3] = normalAttr.getX(srcVertex);
      nextNormals[dstVertex * 3 + 1] = normalAttr.getY(srcVertex);
      nextNormals[dstVertex * 3 + 2] = normalAttr.getZ(srcVertex);

      nextUvs[dstVertex * 2] = uvAttr.getX(srcVertex);
      nextUvs[dstVertex * 2 + 1] = uvAttr.getY(srcVertex);
    }
  });

  const cleaned = new THREE.BufferGeometry();
  cleaned.setAttribute('position', new THREE.BufferAttribute(nextPositions, 3));
  cleaned.setAttribute('normal', new THREE.BufferAttribute(nextNormals, 3));
  cleaned.setAttribute('uv', new THREE.BufferAttribute(nextUvs, 2));

  const nextIndices = new Uint32Array(trianglesToKeep.length * 3);
  for (let i = 0; i < nextIndices.length; i++) {
    nextIndices[i] = i;
  }
  cleaned.setIndex(new THREE.BufferAttribute(nextIndices, 1));

  geometry.dispose();
  return cleaned;
}

/**
 * Builds the voxelized head overlay with relief (thickness) based on a heightmap matrix.
 */
function buildVoxelizedOverlayWithReliefInternal(
  skinImage: HTMLImageElement,
  heightmap?: any,
  boundaryInset = 0
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HeadOverlayVoxelized';

  // Read skin pixels
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skinImage, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);

  const pixelSize = 1.125;
  const gridOffset = 3.9375;

  // Handle dynamic offsets decided by the AI, or legacy format
  const baseBoundary = 4.0 + boundaryInset;
  let offsets = {
    right: baseBoundary,
    left: baseBoundary,
    top: baseBoundary,
    bottom: baseBoundary,
    front: baseBoundary,
    back: baseBoundary,
  };
  let faceHeightmapSource = heightmap;

  if (heightmap && heightmap.offsets) {
    offsets = heightmap.offsets;
  } else if (heightmap) {
    // Legacy support: only front face had 4.15 gap
    offsets = {
      right: baseBoundary,
      left: baseBoundary,
      top: baseBoundary,
      bottom: baseBoundary,
      front: 4.15 + boundaryInset,
      back: baseBoundary,
    };
  }

  // Initialize occupied Set with the base head volume (0..7 on all axes)
  const occupied = new Set<string>();
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      for (let z = 0; z < 8; z++) {
        occupied.add(`${x},${y},${z}`);
      }
    }
  }

  const faces = [
    { // Face 0 (Right, +X)
      key: 'right',
      startX: 48, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(Math.PI / 2);
      },
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: 7 + d,
        gy: 7 - row,
        gz: 7 - col
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: pixelOffset + thickness / 2,
        y: gridOffset - row * pixelSize,
        z: gridOffset - col * pixelSize
      })
    },
    { // Face 1 (Left, -X)
      key: 'left',
      startX: 32, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(-Math.PI / 2);
      },
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: 0 - d,
        gy: 7 - row,
        gz: col
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: -(pixelOffset + thickness / 2),
        y: gridOffset - row * pixelSize,
        z: -gridOffset + col * pixelSize
      })
    },
    { // Face 2 (Top, +Y)
      key: 'top',
      startX: 40, startY: 0,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateX(-Math.PI / 2);
      },
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: col,
        gy: 7 + d,
        gz: row
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: -gridOffset + col * pixelSize,
        y: pixelOffset + thickness / 2,
        z: -gridOffset + row * pixelSize
      })
    },
    { // Face 3 (Bottom, -Y)
      key: 'bottom',
      startX: 48, startY: 0,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateZ(Math.PI);
        geom.rotateX(Math.PI / 2);
      },
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: 7 - col,
        gy: 0 - d,
        gz: row
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: gridOffset - col * pixelSize,
        y: -(pixelOffset + thickness / 2),
        z: -gridOffset + row * pixelSize
      })
    },
    { // Face 4 (Front, +Z)
      key: 'front',
      startX: 40, startY: 8,
      applyRotation: (_geom: THREE.BufferGeometry) => {},
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: col,
        gy: 7 - row,
        gz: 7 + d
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: -gridOffset + col * pixelSize,
        y: gridOffset - row * pixelSize,
        z: pixelOffset + thickness / 2
      })
    },
    { // Face 5 (Back, -Z)
      key: 'back',
      startX: 56, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(Math.PI);
      },
      getGridCoord: (col: number, row: number, d: number) => ({
        gx: 7 - col,
        gy: 7 - row,
        gz: 0 - d
      }),
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => ({
        x: gridOffset - col * pixelSize,
        y: gridOffset - row * pixelSize,
        z: -(pixelOffset + thickness / 2)
      })
    }
  ];

  const geometries: THREE.BufferGeometry[] = [];

  // ─── Pass 1: Build overlay presence mask for every face ───────────────────
  // overlayMask[faceKey][row][col] = { active: bool, heightVal: number, offset: number }
  type PixelInfo = SolidPixelUVBounds & { active: boolean; heightVal: number; pixelOffset: number };
  const overlayMask: Record<string, PixelInfo[][]> = {};

  faces.forEach((face) => {
    const faceHeightmap = faceHeightmapSource ? faceHeightmapSource[face.key] : null;
    const faceDefaultOffset = offsets[face.key as keyof typeof offsets] ?? 4.0;
    const faceMatrix: PixelInfo[][] = [];

    for (let row = 0; row < 8; row++) {
      const rowArr: PixelInfo[] = [];
      for (let col = 0; col < 8; col++) {
        const px = face.startX + col;
        const py = face.startY + row;
        const idx = (py * 64 + px) * 4;
        const alpha = imgData.data[idx + 3];

        if (alpha > 10) {
          let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
          if (heightVal === 0) heightVal = 1;

          const pixelOffset = (heightVal === 3 || heightVal === 4)
            ? faceDefaultOffset + 0.175
            : faceDefaultOffset;

          const uMin = px / 64;
          const uMax = (px + 1) / 64;
          const vMin = (64 - (py + 1)) / 64;
          const vMax = (64 - py) / 64;

          rowArr.push({ active: true, heightVal, pixelOffset, uMin, uMax, vMin, vMax });
        } else {
          rowArr.push({ active: false, heightVal: 0, pixelOffset: 0, uMin: 0, uMax: 0, vMin: 0, vMax: 0 });
        }
      }
      faceMatrix.push(rowArr);
    }
    overlayMask[face.key] = faceMatrix;
  });

  // ─── Shared constants ─────────────────────────────────────────────────────
  // The outermost column/row pixel center is at ±3.9375; its near edge is at ±3.375.
  // The adjacent face overlay starts at ±(4.0 + boundaryInset), so we clip to that boundary:
  //   clipped width = (4.0 + boundaryInset) − 3.375
  //   center shift  = −(1.125 − clipped width)/2
  const THICKNESS    = 0.35;







  // Helper to find the adjacent boundary pixel on another face
  function getBoundaryNeighbor(
    faceKey: string,
    row: number,
    col: number,
    localFaceIdx: number
  ): { face: string; row: number; col: number } | null {
    if (localFaceIdx === 0) { // +X local (right boundary)
      if (col < 7) return null;
      if (faceKey === 'front')  return { face: 'right',  row: row,     col: 0 };
      if (faceKey === 'back')   return { face: 'left',   row: row,     col: 0 };
      if (faceKey === 'right')  return { face: 'back',   row: row,     col: 0 };
      if (faceKey === 'left')   return { face: 'front',  row: row,     col: 0 };
      if (faceKey === 'top')    return { face: 'right',  row: 0,       col: 7 - row };
      if (faceKey === 'bottom') return { face: 'left',   row: 7,       col: row };
    }
    if (localFaceIdx === 1) { // -X local (left boundary)
      if (col > 0) return null;
      if (faceKey === 'front')  return { face: 'left',   row: row,     col: 7 };
      if (faceKey === 'back')   return { face: 'right',  row: row,     col: 7 };
      if (faceKey === 'right')  return { face: 'front',  row: row,     col: 7 };
      if (faceKey === 'left')   return { face: 'back',   row: row,     col: 7 };
      if (faceKey === 'top')    return { face: 'left',   row: 0,       col: row };
      if (faceKey === 'bottom') return { face: 'right',  row: 7,       col: 7 - row };
    }
    if (localFaceIdx === 2) { // +Y local (top boundary)
      if (row > 0) return null;
      if (faceKey === 'front')  return { face: 'top',    row: 7,       col: col };
      if (faceKey === 'back')   return { face: 'top',    row: 0,       col: 7 - col };
      if (faceKey === 'right')  return { face: 'top',    row: 7 - col, col: 7 };
      if (faceKey === 'left')   return { face: 'top',    row: col,     col: 0 };
      if (faceKey === 'top')    return { face: 'back',   row: 0,       col: 7 - col };
      if (faceKey === 'bottom') return { face: 'back',   row: 7,       col: col };
    }
    if (localFaceIdx === 3) { // -Y local (bottom boundary)
      if (row < 7) return null;
      if (faceKey === 'front')  return { face: 'bottom', row: 0,       col: col };
      if (faceKey === 'back')   return { face: 'bottom', row: 7,       col: 7 - col };
      if (faceKey === 'right')  return { face: 'bottom', row: 7 - col, col: 0 };
      if (faceKey === 'left')   return { face: 'bottom', row: col,     col: 7 };
      if (faceKey === 'top')    return { face: 'front',  row: 0,       col: col };
      if (faceKey === 'bottom') return { face: 'front',  row: 7,       col: 7 - col };
    }
    return null;
  }

  function isNeighborActive(neighbor: { face: string; row: number; col: number } | null): boolean {
    if (!neighbor) return false;
    return overlayMask[neighbor.face]?.[neighbor.row]?.[neighbor.col]?.active ?? false;
  }

  faces.forEach((face) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const info = overlayMask[face.key][row][col];
        if (!info.active) continue;

        // Occupied-set check
        const d = 1;
        const coord = face.getGridCoord(col, row, d);
        const coordKey = `${coord.gx},${coord.gy},${coord.gz}`;
        if (occupied.has(coordKey)) continue;
        occupied.add(coordKey);

        // Natural local bounds for this voxel
        const localX_min = -4.5 + col * 1.125;
        const localX_max = -4.5 + (col + 1) * 1.125;
        const localY_min = 4.5 - (row + 1) * 1.125;
        const localY_max = 4.5 - row * 1.125;

        let xMin = localX_min;
        let xMax = localX_max;
        let yMin = localY_min;
        let yMax = localY_max;

        // Perform face culling (0:+X, 1:-X, 2:+Y, 3:-Y, 4:+Z outer, 5:-Z inner)
        const visibleFaces = [false, false, false, false, true, false];

        const getPriority = (f: string) => {
          if (f === 'top' || f === 'bottom') return 3;
          if (f === 'front' || f === 'back') return 2;
          return 1;
        };

        for (let fi = 0; fi < 4; fi++) {
          let hasSameFaceNeighbor = false;
          if (fi === 0 && col < 7) hasSameFaceNeighbor = overlayMask[face.key][row][col + 1]?.active;
          else if (fi === 1 && col > 0) hasSameFaceNeighbor = overlayMask[face.key][row][col - 1]?.active;
          else if (fi === 2 && row > 0) hasSameFaceNeighbor = overlayMask[face.key][row - 1][col]?.active;
          else if (fi === 3 && row < 7) hasSameFaceNeighbor = overlayMask[face.key][row + 1][col]?.active;

          if (hasSameFaceNeighbor) {
            visibleFaces[fi] = false;
          } else {
            const bNeighbor = getBoundaryNeighbor(face.key, row, col, fi);
            if (bNeighbor) {
              // This is a boundary edge!
              // Add a tiny overlap of 0.005 to prevent rendering seams / Z-fighting along the corner edges
              let limitCoord = baseBoundary;
              const isNeighborActiveVal = isNeighborActive(bNeighbor);
              if (isNeighborActiveVal) {
                const adjOffset = overlayMask[bNeighbor.face][bNeighbor.row][bNeighbor.col].pixelOffset;
                limitCoord = adjOffset + THICKNESS;
              }

              // Check priority: if current face has higher priority than neighbor face, add 0.005 overlap
              if (getPriority(face.key) > getPriority(bNeighbor.face)) {
                limitCoord += 0.005;
              }

              // Clip the voxel boundary to the limit coordinate
              if (fi === 0) xMax = limitCoord;
              else if (fi === 1) xMin = -limitCoord;
              else if (fi === 2) yMax = limitCoord;
              else if (fi === 3) yMin = -limitCoord;

              // Cull the boundary side face only if the neighbor is active (otherwise it is exposed and must be rendered to seal the voxel)
              if (isNeighborActiveVal) {
                visibleFaces[fi] = false;
              } else {
                visibleFaces[fi] = true;
              }
            } else {
              visibleFaces[fi] = true;
            }
          }
        }

        // Apply secondary priority-based coordinate offsets for perpendicular side walls to prevent Z-fighting at corners without leaving gaps
        for (let fi = 0; fi < 4; fi++) {
          if (!visibleFaces[fi]) continue;
          
          if (fi === 0 || fi === 1) { // X-facing faces (check Y-facing boundaries)
            const bTop = getBoundaryNeighbor(face.key, row, col, 2);
            if (bTop && isNeighborActive(bTop) && getPriority(face.key) < getPriority(bTop.face)) {
              if (fi === 0) xMax -= 0.005;
              else if (fi === 1) xMin += 0.005;
            }
            const bBottom = getBoundaryNeighbor(face.key, row, col, 3);
            if (bBottom && isNeighborActive(bBottom) && getPriority(face.key) < getPriority(bBottom.face)) {
              if (fi === 0) xMax -= 0.005;
              else if (fi === 1) xMin += 0.005;
            }
          } else if (fi === 2 || fi === 3) { // Y-facing faces (check X-facing boundaries)
            const bRight = getBoundaryNeighbor(face.key, row, col, 0);
            if (bRight && isNeighborActive(bRight) && getPriority(face.key) < getPriority(bRight.face)) {
              if (fi === 2) yMax -= 0.005;
              else if (fi === 3) yMin += 0.005;
            }
            const bLeft = getBoundaryNeighbor(face.key, row, col, 1);
            if (bLeft && isNeighborActive(bLeft) && getPriority(face.key) < getPriority(bLeft.face)) {
              if (fi === 2) yMax -= 0.005;
              else if (fi === 3) yMin += 0.005;
            }
          }
        }

        const w = xMax - xMin;
        const h = yMax - yMin;

        // Local center coords
        const local_cx = xMin + w / 2;
        const local_cy = yMin + h / 2;
        const local_cz = info.pixelOffset + THICKNESS / 2;

        const geom = buildCulledBoxGeometry(
          w, h, THICKNESS,
          info.uMin, info.uMax, info.vMin, info.vMax,
          visibleFaces
        );
        geom.translate(local_cx, local_cy, local_cz);
        face.applyRotation(geom);
        geometries.push(geom);
      }
    }
  });



  const voxelMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  if (geometries.length > 0) {
    const mergedGeom = removeExactDuplicateTriangles(mergeBufferGeometries(geometries));
    geometries.forEach((g) => g.dispose());
    
    const mesh = new THREE.Mesh(mergedGeom, voxelMaterial);
    mesh.name = 'HeadOverlay';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

export function buildVoxelizedOverlayWithRelief(
  skinImage: HTMLImageElement,
  heightmap?: any
): THREE.Group {
  return buildVoxelizedOverlayWithReliefInternal(skinImage, heightmap, 0);
}

export function buildVoxelizedOverlayWithReliefForExport(
  skinImage: HTMLImageElement,
  heightmap?: any,
  boundaryInset = 0.02
): THREE.Group {
  return buildVoxelizedOverlayWithReliefInternal(skinImage, heightmap, boundaryInset);
}

/**
 * Builds the Minecraft Head 3D model (Group containing Head and HeadOverlay meshes).
 * Supports optional heightmap relief for the overlay layer.
 * 
 * @param skinImage The HTMLImageElement containing the skin
 * @param heightmap Optional heightmap for the overlay relief
 * @returns A THREE.Group containing the 3D Head model
 */
export function build3DHead(
  skinImage: HTMLImageElement,
  heightmap?: any
): THREE.Group {
  // 1. Create a texture from the skin image
  const texture = new THREE.CanvasTexture(skinImage);
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

  // 3. Head Overlay
  let overlayMesh: THREE.Object3D;

  if (heightmap) {
    // Volumetric 3D Voxel Overlay with custom relief
    const voxelizedOverlayGroup = buildVoxelizedOverlayWithRelief(skinImage, heightmap);
    // Bind the texture to its material
    voxelizedOverlayGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.map = texture;
        child.material.transparent = true;
        child.material.alphaTest = 0.1;
        child.material.needsUpdate = true;
      }
    });
    overlayMesh = voxelizedOverlayGroup;
  } else {
    // Classic single BoxGeometry overlay (prerendered transparent shell)
    const overlayGeo = new THREE.BoxGeometry(9, 9, 9);
    applyHeadUVs(overlayGeo, true);
    
    const overlayMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    
    const classicMesh = new THREE.Mesh(overlayGeo, overlayMat);
    classicMesh.name = 'HeadOverlay';
    classicMesh.castShadow = true;
    classicMesh.receiveShadow = true;
    overlayMesh = classicMesh;
  }

  // 4. Combine into a group
  const group = new THREE.Group();
  group.name = 'MinecraftHead';
  group.add(headMesh);
  group.add(overlayMesh);

  return group;
}
