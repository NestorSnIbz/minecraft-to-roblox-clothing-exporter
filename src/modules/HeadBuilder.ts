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

function buildBoxGeometry(
  w: number,
  h: number,
  d: number,
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number
): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, h, d);
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;

  const solidBounds: SolidPixelUVBounds = { uMin, uMax, vMin, vMax };
  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    setSolidPixelUVForBoxFace(uvAttr, faceIndex, solidBounds);
  }
  uvAttr.needsUpdate = true;

  const nonIndexed = geom.toNonIndexed();
  geom.dispose();
  return nonIndexed;
}

function buildBoxGeometryWithFacePixels(
  w: number,
  h: number,
  d: number,
  fallbackBounds: SolidPixelUVBounds,
  faceBounds: Partial<Record<number, SolidPixelUVBounds>>
): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, h, d);
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;

  for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
    setSolidPixelUVForBoxFace(uvAttr, faceIndex, faceBounds[faceIndex] ?? fallbackBounds);
  }

  uvAttr.needsUpdate = true;
  const nonIndexed = geom.toNonIndexed();
  geom.dispose();
  return nonIndexed;
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
  const CORNER_CLIP_W = 0.625 + boundaryInset;
  const CORNER_SHIFT  = -0.25 + boundaryInset / 2;

  type P3 = { x: number; y: number; z: number };

  // ─── Vertical corner definitions (4 corners: left/right meets front/back) ─
  // clipA/clipB: shift the face voxel center so it stops at the ±4.0 boundary.
  // capPos: center of the THICKNESS×pixelSize×THICKNESS square cap that fills the gap.
  const vcDefs = [
    // Front col=7 ↔ Right col=0  (+x, +z corner)
    // topPixel:    the top-face pixel at this tri-corner
    // bottomPixel: the bottom-face pixel at this tri-corner
    { faceA: 'front', colA: 7, faceB: 'right', colB: 0,
      clipAPos: (p: P3) => ({ ...p, x: p.x + CORNER_SHIFT }),
      clipBPos: (p: P3) => ({ ...p, z: p.z + CORNER_SHIFT }),
      capPos: (row: number, pOfsA: number, pOfsB: number, th: number): P3 => ({
        x: pOfsB + th / 2, y: gridOffset - row * pixelSize, z: pOfsA + th / 2 }),
      topPixel:    { row: 7, col: 7 },   // top face front-right pixel
      bottomPixel: { row: 7, col: 0 } }, // bottom face front-right pixel
    // Front col=0 ↔ Left col=7  (−x, +z corner)
    { faceA: 'front', colA: 0, faceB: 'left', colB: 7,
      clipAPos: (p: P3) => ({ ...p, x: p.x - CORNER_SHIFT }),
      clipBPos: (p: P3) => ({ ...p, z: p.z + CORNER_SHIFT }),
      capPos: (row: number, pOfsA: number, pOfsB: number, th: number): P3 => ({
        x: -(pOfsB + th / 2), y: gridOffset - row * pixelSize, z: pOfsA + th / 2 }),
      topPixel:    { row: 7, col: 0 },
      bottomPixel: { row: 7, col: 7 } },
    // Back col=0 ↔ Right col=7  (+x, −z corner)
    { faceA: 'back', colA: 0, faceB: 'right', colB: 7,
      clipAPos: (p: P3) => ({ ...p, x: p.x + CORNER_SHIFT }),
      clipBPos: (p: P3) => ({ ...p, z: p.z - CORNER_SHIFT }),
      capPos: (row: number, pOfsA: number, pOfsB: number, th: number): P3 => ({
        x: pOfsB + th / 2, y: gridOffset - row * pixelSize, z: -(pOfsA + th / 2) }),
      topPixel:    { row: 0, col: 7 },
      bottomPixel: { row: 0, col: 0 } },
    // Back col=7 ↔ Left col=0  (−x, −z corner)
    { faceA: 'back', colA: 7, faceB: 'left', colB: 0,
      clipAPos: (p: P3) => ({ ...p, x: p.x - CORNER_SHIFT }),
      clipBPos: (p: P3) => ({ ...p, z: p.z - CORNER_SHIFT }),
      capPos: (row: number, pOfsA: number, pOfsB: number, th: number): P3 => ({
        x: -(pOfsB + th / 2), y: gridOffset - row * pixelSize, z: -(pOfsA + th / 2) }),
      topPixel:    { row: 0, col: 0 },
      bottomPixel: { row: 0, col: 7 } },
  ];

  // Lookup: "${face}:${col}" → { def, role }
  type VCRole = { def: typeof vcDefs[0]; role: 'A' | 'B' };
  const vcLookup = new Map<string, VCRole>();
  vcDefs.forEach(def => {
    vcLookup.set(`${def.faceA}:${def.colA}`, { def, role: 'A' });
    vcLookup.set(`${def.faceB}:${def.colB}`, { def, role: 'B' });
  });

  // ─── Horizontal edge definitions (8 edges: top/bottom ↔ side faces) ───────
  //
  // Each edge has:
  //   faceA = top or bottom face (protrudes in ±Y)
  //   faceB = a side face (front/back/left/right, protrudes in ±X or ±Z)
  //
  //   isEdgeA / isEdgeB: does (row,col) sit on this edge?
  //   paramFromA/B: the "edge index" (0-7) for the pixel along the edge.
  //   rowBfromP / colBfromP: faceB (row,col) from edge index.
  //   rowAfromP / colAfromP: faceA (row,col) from edge index.
  //
  //   clipADim: 'w' clips the voxel width;  'h' clips the voxel height
  //     • Top/Bottom face: w→world-x, h→world-z  (after their rotations)
  //     • Side face:       w→world-x/z, h→world-y
  //   clipAPos / clipBPos: shift the voxel center inward by CORNER_SHIFT on the clipped axis.
  //
  //   capW/capH/capD: dimensions of the cap box (NO extra rotation applied).
  //     Caps are axis-aligned boxes that fill the gap in the ±Y × ±outward plane.
  //   getCapCenter: world position of the cap center.
  // boundaries: when the cap's long dimension (capW or capD === pixelSize) is at edge
  // parameter 0 or 7, a VC collision on the adjacent face would cause the cap to protrude.
  // Each entry: param to check, which face/pixel to query, and shift for the long axis.
  type HEdgeBoundary = {
    param: number; adjFace: string; adjRow: number; adjCol: number;
    shiftX: number; shiftZ: number;
  };
  type HEdgeDef = {
    id: string;
    faceA: string; faceB: string;
    isEdgeA: (r: number, c: number) => boolean;
    paramFromA: (r: number, c: number) => number;
    rowBfromP: (p: number) => number; colBfromP: (p: number) => number;
    isEdgeB: (r: number, c: number) => boolean;
    paramFromB: (r: number, c: number) => number;
    rowAfromP: (p: number) => number; colAfromP: (p: number) => number;
    clipADim: 'w' | 'h'; clipAPos: (p: P3) => P3;
    clipBDim: 'w' | 'h'; clipBPos: (p: P3) => P3;
    capW: number; capH: number; capD: number;
    getCapCenter: (p: number, pOfsA: number, pOfsB: number) => P3;
    boundaries: HEdgeBoundary[];
  };

  const heDefs: HEdgeDef[] = [
    // ① Top row=7 ↔ Front row=0  (top-front edge, +y/+z)
    // boundaries: param=7(right side)→check right[0][0]; param=0(left side)→check left[0][7]
    { id: 'top-front', faceA: 'top', faceB: 'front',
      isEdgeA: (r, _unusedC) => r === 7,   paramFromA: (_unusedR, c) => c,
      rowBfromP: (_p) => 0,          colBfromP: (p) => p,
      isEdgeB: (r, _unusedC) => r === 0,  paramFromB: (_unusedR, c) => c,
      rowAfromP: (_p) => 7,          colAfromP: (p) => p,
      clipADim: 'h', clipAPos: (p) => ({ ...p, z: p.z + CORNER_SHIFT }),  // top h→z, clip z toward −
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y + CORNER_SHIFT }),  // front h→y, clip y toward −
      capW: pixelSize, capH: THICKNESS, capD: THICKNESS,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: -gridOffset + p * pixelSize, y: pOfsA + THICKNESS / 2, z: pOfsB + THICKNESS / 2 }),
      boundaries: [
        { param: 7, adjFace: 'right', adjRow: 0, adjCol: 0, shiftX: CORNER_SHIFT,  shiftZ: 0 },
        { param: 0, adjFace: 'left',  adjRow: 0, adjCol: 7, shiftX: -CORNER_SHIFT, shiftZ: 0 },
      ] },

    // ② Top row=0 ↔ Back row=0  (top-back edge, +y/−z)
    // Top row=0 → z = −3.9375 (back edge). Back row=0 → y = +3.9375 (top edge).
    // Top col=c ↔ Back col=7−c  (mirrored x)
    { id: 'top-back', faceA: 'top', faceB: 'back',
      isEdgeA: (r, _unusedC) => r === 0, paramFromA: (_unusedR, c) => c,
      rowBfromP: (_p) => 0,         colBfromP: (p) => 7 - p,
      isEdgeB: (r, _unusedC) => r === 0, paramFromB: (_unusedR, c) => 7 - c,
      rowAfromP: (_p) => 0,         colAfromP: (p) => p,
      clipADim: 'h', clipAPos: (p) => ({ ...p, z: p.z - CORNER_SHIFT }),  // z=−3.9375, clip toward +z → shift +0.25
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y + CORNER_SHIFT }),  // y=+3.9375, clip toward −y
      capW: pixelSize, capH: THICKNESS, capD: THICKNESS,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: -gridOffset + p * pixelSize, y: pOfsA + THICKNESS / 2, z: -(pOfsB + THICKNESS / 2) }),
      boundaries: [
        { param: 7, adjFace: 'right', adjRow: 0, adjCol: 7, shiftX: CORNER_SHIFT,  shiftZ: 0 },
        { param: 0, adjFace: 'left',  adjRow: 0, adjCol: 0, shiftX: -CORNER_SHIFT, shiftZ: 0 },
      ] },

    // ③ Top col=7 ↔ Right row=0  (top-right edge, +y/+x)
    // Top col=7 → x=+3.9375. Right row=0 → y=+3.9375.
    // Top row=r ↔ Right col=7−r  (z matches: −3.9375+r·ps = 3.9375−(7−r)·ps ✓)
    { id: 'top-right', faceA: 'top', faceB: 'right',
      isEdgeA: (_unusedR, c) => c === 7, paramFromA: (r, _unusedC) => r,
      rowBfromP: (_p) => 0,         colBfromP: (p) => 7 - p,
      isEdgeB: (r, _unusedC) => r === 0, paramFromB: (_unusedR, c) => 7 - c,
      rowAfromP: (p) => p,           colAfromP: (_p) => 7,
      clipADim: 'w', clipAPos: (p) => ({ ...p, x: p.x + CORNER_SHIFT }),  // top w→x, x=+3.9375, clip toward −x
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y + CORNER_SHIFT }),  // right h→y
      capW: THICKNESS, capH: THICKNESS, capD: pixelSize,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: pOfsB + THICKNESS / 2, y: pOfsA + THICKNESS / 2, z: -gridOffset + p * pixelSize }),
      boundaries: [
        { param: 7, adjFace: 'front', adjRow: 0, adjCol: 7, shiftX: 0, shiftZ: CORNER_SHIFT  },
        { param: 0, adjFace: 'back',  adjRow: 0, adjCol: 0, shiftX: 0, shiftZ: -CORNER_SHIFT },
      ] },

    // ④ Top col=0 ↔ Left row=0  (top-left edge, +y/−x)
    // Top col=0 → x=−3.9375. Left row=0 → y=+3.9375.
    // Top row=r ↔ Left col=r  (z matches: −3.9375+r·ps = −3.9375+r·ps ✓)
    { id: 'top-left', faceA: 'top', faceB: 'left',
      isEdgeA: (_unusedR, c) => c === 0, paramFromA: (r, _unusedC) => r,
      rowBfromP: (_p) => 0,         colBfromP: (p) => p,
      isEdgeB: (r, _unusedC) => r === 0, paramFromB: (_unusedR, c) => c,
      rowAfromP: (p) => p,           colAfromP: (_p) => 0,
      clipADim: 'w', clipAPos: (p) => ({ ...p, x: p.x - CORNER_SHIFT }),  // x=−3.9375, clip toward +x → shift +0.25
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y + CORNER_SHIFT }),
      capW: THICKNESS, capH: THICKNESS, capD: pixelSize,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: -(pOfsB + THICKNESS / 2), y: pOfsA + THICKNESS / 2, z: -gridOffset + p * pixelSize }),
      boundaries: [
        { param: 7, adjFace: 'front', adjRow: 0, adjCol: 0, shiftX: 0, shiftZ: CORNER_SHIFT  },
        { param: 0, adjFace: 'back',  adjRow: 0, adjCol: 7, shiftX: 0, shiftZ: -CORNER_SHIFT },
      ] },

    // ⑤ Bottom row=7 ↔ Front row=7  (bottom-front edge, −y/+z)
    // Bottom row=7 → z=+3.9375. Front row=7 → y=−3.9375.
    // Bottom col=7−c ↔ Front col=c  (x matches: 3.9375−(7−c)·ps = −3.9375+c·ps ✓)
    { id: 'bottom-front', faceA: 'bottom', faceB: 'front',
      isEdgeA: (r, _unusedC) => r === 7, paramFromA: (_unusedR, c) => 7 - c,
      rowBfromP: (_p) => 7,         colBfromP: (p) => p,
      isEdgeB: (r, _unusedC) => r === 7, paramFromB: (_unusedR, c) => c,
      rowAfromP: (_p) => 7,         colAfromP: (p) => 7 - p,
      clipADim: 'h', clipAPos: (p) => ({ ...p, z: p.z + CORNER_SHIFT }),  // z=+3.9375, clip toward −z
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y - CORNER_SHIFT }),  // y=−3.9375, clip toward +y → shift +0.25
      capW: pixelSize, capH: THICKNESS, capD: THICKNESS,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: -gridOffset + p * pixelSize, y: -(pOfsA + THICKNESS / 2), z: pOfsB + THICKNESS / 2 }),
      boundaries: [
        { param: 7, adjFace: 'right', adjRow: 7, adjCol: 0, shiftX: CORNER_SHIFT,  shiftZ: 0 },
        { param: 0, adjFace: 'left',  adjRow: 7, adjCol: 7, shiftX: -CORNER_SHIFT, shiftZ: 0 },
      ] },

    // ⑥ Bottom row=0 ↔ Back row=7  (bottom-back edge, −y/−z)
    // Bottom row=0 → z=−3.9375. Back row=7 → y=−3.9375.
    // Bottom col=c ↔ Back col=c  (x: 3.9375−c·ps = 3.9375−c·ps ✓)
    { id: 'bottom-back', faceA: 'bottom', faceB: 'back',
      isEdgeA: (r, _unusedC) => r === 0, paramFromA: (_unusedR, c) => c,
      rowBfromP: (_p) => 7,         colBfromP: (p) => p,
      isEdgeB: (r, _unusedC) => r === 7, paramFromB: (_unusedR, c) => c,
      rowAfromP: (_p) => 0,         colAfromP: (p) => p,
      clipADim: 'h', clipAPos: (p) => ({ ...p, z: p.z - CORNER_SHIFT }),  // z=−3.9375, clip toward +z
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y - CORNER_SHIFT }),  // y=−3.9375, clip toward +y
      capW: pixelSize, capH: THICKNESS, capD: THICKNESS,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: gridOffset - p * pixelSize, y: -(pOfsA + THICKNESS / 2), z: -(pOfsB + THICKNESS / 2) }),
      boundaries: [
        { param: 0, adjFace: 'right', adjRow: 7, adjCol: 7, shiftX: CORNER_SHIFT,  shiftZ: 0 },
        { param: 7, adjFace: 'left',  adjRow: 7, adjCol: 0, shiftX: -CORNER_SHIFT, shiftZ: 0 },
      ] },

    // ⑦ Bottom col=0 ↔ Right row=7  (bottom-right edge, −y/+x)
    // Bottom col=0 → x=+3.9375. Right row=7 → y=−3.9375.
    // Bottom row=r ↔ Right col=7−r  (z: −3.9375+r·ps = 3.9375−(7−r)·ps ✓)
    { id: 'bottom-right', faceA: 'bottom', faceB: 'right',
      isEdgeA: (_unusedR, c) => c === 0, paramFromA: (r, _unusedC) => r,
      rowBfromP: (_p) => 7,         colBfromP: (p) => 7 - p,
      isEdgeB: (r, _unusedC) => r === 7, paramFromB: (_unusedR, c) => 7 - c,
      rowAfromP: (p) => p,           colAfromP: (_p) => 0,
      clipADim: 'w', clipAPos: (p) => ({ ...p, x: p.x + CORNER_SHIFT }),  // x=+3.9375, clip toward −x
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y - CORNER_SHIFT }),
      capW: THICKNESS, capH: THICKNESS, capD: pixelSize,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: pOfsB + THICKNESS / 2, y: -(pOfsA + THICKNESS / 2), z: -gridOffset + p * pixelSize }),
      boundaries: [
        { param: 7, adjFace: 'front', adjRow: 7, adjCol: 7, shiftX: 0, shiftZ: CORNER_SHIFT  },
        { param: 0, adjFace: 'back',  adjRow: 7, adjCol: 0, shiftX: 0, shiftZ: -CORNER_SHIFT },
      ] },

    // ⑧ Bottom col=7 ↔ Left row=7  (bottom-left edge, −y/−x)
    // Bottom col=7 → x=−3.9375. Left row=7 → y=−3.9375.
    // Bottom row=r ↔ Left col=r  (z: −3.9375+r·ps = −3.9375+r·ps ✓)
    { id: 'bottom-left', faceA: 'bottom', faceB: 'left',
      isEdgeA: (_unusedR, c) => c === 7, paramFromA: (r, _unusedC) => r,
      rowBfromP: (_p) => 7,         colBfromP: (p) => p,
      isEdgeB: (r, _unusedC) => r === 7, paramFromB: (_unusedR, c) => c,
      rowAfromP: (p) => p,           colAfromP: (_p) => 7,
      clipADim: 'w', clipAPos: (p) => ({ ...p, x: p.x - CORNER_SHIFT }),  // x=−3.9375, clip toward +x
      clipBDim: 'h', clipBPos: (p) => ({ ...p, y: p.y - CORNER_SHIFT }),
      capW: THICKNESS, capH: THICKNESS, capD: pixelSize,
      getCapCenter: (p, pOfsA, pOfsB) => ({
        x: -(pOfsB + THICKNESS / 2), y: -(pOfsA + THICKNESS / 2), z: -gridOffset + p * pixelSize }),
      boundaries: [
        { param: 7, adjFace: 'front', adjRow: 7, adjCol: 0, shiftX: 0, shiftZ: CORNER_SHIFT  },
        { param: 0, adjFace: 'back',  adjRow: 7, adjCol: 7, shiftX: 0, shiftZ: -CORNER_SHIFT },
      ] },
  ];

  // Track emitted caps (both vertical corner caps and horizontal edge caps share one set)
  const emittedCaps = new Set<string>();

  // ─── Pass 2: Generate geometry ────────────────────────────────────────────
  faces.forEach((face) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const info = overlayMask[face.key][row][col];
        if (!info.active) continue;

        // Occupied-set check (prevents duplicate voxels across faces sharing a grid slot)
        const d = 1;
        const coord = face.getGridCoord(col, row, d);
        const coordKey = `${coord.gx},${coord.gy},${coord.gz}`;
        if (occupied.has(coordKey)) continue;
        occupied.add(coordKey);

        // Accumulate clip flags and position adjustments from all applicable collisions.
        // A pixel at a tri-corner (e.g. front row=0 col=7) will accumulate BOTH
        // a vertical-corner clip (on w) and a horizontal-edge clip (on h) simultaneously.
        let clipW = false;
        let clipH = false;
        let pos = face.getPos(col, row, THICKNESS, info.pixelOffset);

        // ── Vertical corner check ──────────────────────────────────────────
        const vcr = vcLookup.get(`${face.key}:${col}`);
        if (vcr) {
          const { def, role } = vcr;
          const adjFaceKey = role === 'A' ? def.faceB : def.faceA;
          const adjCol     = role === 'A' ? def.colB  : def.colA;
          const adjInfo    = overlayMask[adjFaceKey]?.[row]?.[adjCol];
          if (adjInfo?.active) {
            clipW = true;
            pos = role === 'A' ? def.clipAPos(pos) : def.clipBPos(pos);

            const vcCapKey = `vc:${def.faceA}:${def.faceB}:${row}`;
            if (!emittedCaps.has(vcCapKey)) {
              emittedCaps.add(vcCapKey);
              const piA = overlayMask[def.faceA][row][def.colA];
              const piB = overlayMask[def.faceB][row][def.colB];
              const cpi = role === 'A' ? piA : piB;
              // Tri-corner: if top or bottom face also has overlay at the corner pixel,
              // clip the cap's Y so it stops at ±4.0 (the top/bottom face boundary).
              let capH = pixelSize;
              let capYShift = 0;
              if (row === 0) {
                const tpx = (def as any).topPixel;
                if (tpx && overlayMask['top']?.[tpx.row]?.[tpx.col]?.active) {
                  capH = CORNER_CLIP_W; capYShift = CORNER_SHIFT;
                }
              } else if (row === 7) {
                const bpx = (def as any).bottomPixel;
                if (bpx && overlayMask['bottom']?.[bpx.row]?.[bpx.col]?.active) {
                  capH = CORNER_CLIP_W; capYShift = -CORNER_SHIFT;
                }
              }
              const rawCapPos = def.capPos(row, piA.pixelOffset, piB.pixelOffset, THICKNESS);
              const capPos = { ...rawCapPos, y: rawCapPos.y + capYShift };
              const capFaceBounds: Partial<Record<number, SolidPixelUVBounds>> = {};
              assignAxisFacePixels(capFaceBounds, def.faceA, piA, def.faceA !== 'top' && def.faceA !== 'bottom');
              assignAxisFacePixels(capFaceBounds, def.faceB, piB, def.faceB !== 'top' && def.faceB !== 'bottom');
              if (row === 0) {
                const tpx = (def as any).topPixel;
                const topInfo = tpx ? overlayMask['top']?.[tpx.row]?.[tpx.col] : null;
                if (topInfo?.active) {
                  assignAxisFacePixels(capFaceBounds, 'top', topInfo, false);
                }
              } else if (row === 7) {
                const bpx = (def as any).bottomPixel;
                const bottomInfo = bpx ? overlayMask['bottom']?.[bpx.row]?.[bpx.col] : null;
                if (bottomInfo?.active) {
                  assignAxisFacePixels(capFaceBounds, 'bottom', bottomInfo, false);
                }
              }
              const capGeom = buildBoxGeometryWithFacePixels(
                THICKNESS,
                capH,
                THICKNESS,
                cpi,
                capFaceBounds
              );
              capGeom.translate(capPos.x, capPos.y, capPos.z);
              geometries.push(capGeom);
            }
          }
        }

        // ── Horizontal edge checks (iterate all 8 defs; a pixel may match >1) ──
        for (const hDef of heDefs) {
          let heRole: 'A' | 'B' | null = null;
          let param = 0;

          if (hDef.faceA === face.key && hDef.isEdgeA(row, col)) {
            param = hDef.paramFromA(row, col);
            const adjInfo = overlayMask[hDef.faceB]?.[hDef.rowBfromP(param)]?.[hDef.colBfromP(param)];
            if (adjInfo?.active) heRole = 'A';
          } else if (hDef.faceB === face.key && hDef.isEdgeB(row, col)) {
            param = hDef.paramFromB(row, col);
            const adjInfo = overlayMask[hDef.faceA]?.[hDef.rowAfromP(param)]?.[hDef.colAfromP(param)];
            if (adjInfo?.active) heRole = 'B';
          }

          if (heRole !== null) {
            if (heRole === 'A') {
              if (hDef.clipADim === 'w') clipW = true; else clipH = true;
              pos = hDef.clipAPos(pos);
            } else {
              if (hDef.clipBDim === 'w') clipW = true; else clipH = true;
              pos = hDef.clipBPos(pos);
            }

            const heCapKey = `he:${hDef.id}:${param}`;
            if (!emittedCaps.has(heCapKey)) {
              emittedCaps.add(heCapKey);
              const rA = hDef.rowAfromP(param), cA = hDef.colAfromP(param);
              const rB = hDef.rowBfromP(param), cB = hDef.colBfromP(param);
              const piA = overlayMask[hDef.faceA]?.[rA]?.[cA];
              const piB = overlayMask[hDef.faceB]?.[rB]?.[cB];
              if (piA?.active && piB?.active) {
                const cpi = heRole === 'A' ? piA : piB;
                // Tri-corner: if this cap's long dimension is at a boundary parameter
                // (0 or 7) and the adjacent vertical-corner face also has overlay,
                // clip the long dimension to stop at the ±4.0 boundary.
                let cW = hDef.capW, cD = hDef.capD;
                let xAdj = 0, zAdj = 0;
                const bnd = hDef.boundaries.find(b => b.param === param);
                if (bnd) {
                  const adjActive = overlayMask[bnd.adjFace]?.[bnd.adjRow]?.[bnd.adjCol]?.active;
                  if (adjActive) {
                    if (hDef.capW === pixelSize) { cW = CORNER_CLIP_W; xAdj = bnd.shiftX; }
                    if (hDef.capD === pixelSize) { cD = CORNER_CLIP_W; zAdj = bnd.shiftZ; }
                  }
                }
                const rawCPos = hDef.getCapCenter(param, piA.pixelOffset, piB.pixelOffset);
                const cPos = { x: rawCPos.x + xAdj, y: rawCPos.y, z: rawCPos.z + zAdj };
                const capFaceBounds: Partial<Record<number, SolidPixelUVBounds>> = {};
                assignAxisFacePixels(capFaceBounds, hDef.faceA, piA, hDef.faceA !== 'top' && hDef.faceA !== 'bottom');
                assignAxisFacePixels(capFaceBounds, hDef.faceB, piB, hDef.faceB !== 'top' && hDef.faceB !== 'bottom');
                const capGeom = buildBoxGeometryWithFacePixels(
                  cW,
                  hDef.capH,
                  cD,
                  cpi,
                  capFaceBounds
                );
                capGeom.translate(cPos.x, cPos.y, cPos.z);
                geometries.push(capGeom);
              }
            }
          }
        }

        // ── Build the main voxel (dimensions clipped where needed) ──────────
        const voxelW = clipW ? CORNER_CLIP_W : pixelSize;
        const voxelH = clipH ? CORNER_CLIP_W : pixelSize;
        const geom = buildBoxGeometry(voxelW, voxelH, THICKNESS, info.uMin, info.uMax, info.vMin, info.vMax);
        face.applyRotation(geom);
        geom.translate(pos.x, pos.y, pos.z);
        geometries.push(geom);
      }
    }
  });

  // ─── Pass 3: Tri-corner cubes ─────────────────────────────────────────────
  // At each of the 8 head corners where 3 faces meet, if all 3 faces have
  // overlay at the corner pixel, place a THICKNESS³ cube at the exact corner.
  // This fills the gap left by the 3 clipped caps (each of which now stops
  // exactly at the ±4.0 boundary on its clipped axis).
  const triCorners = [
    // front-top-right
    { f1: 'front', r1: 0, c1: 7, f2: 'right', r2: 0, c2: 0, f3: 'top', r3: 7, c3: 7,
      sx:  1, sy:  1, sz:  1 },
    // front-top-left
    { f1: 'front', r1: 0, c1: 0, f2: 'left', r2: 0, c2: 7, f3: 'top', r3: 7, c3: 0,
      sx: -1, sy:  1, sz:  1 },
    // front-bottom-right
    { f1: 'front', r1: 7, c1: 7, f2: 'right', r2: 7, c2: 0, f3: 'bottom', r3: 7, c3: 0,
      sx:  1, sy: -1, sz:  1 },
    // front-bottom-left
    { f1: 'front', r1: 7, c1: 0, f2: 'left', r2: 7, c2: 7, f3: 'bottom', r3: 7, c3: 7,
      sx: -1, sy: -1, sz:  1 },
    // back-top-right
    { f1: 'back', r1: 0, c1: 0, f2: 'right', r2: 0, c2: 7, f3: 'top', r3: 0, c3: 7,
      sx:  1, sy:  1, sz: -1 },
    // back-top-left
    { f1: 'back', r1: 0, c1: 7, f2: 'left', r2: 0, c2: 0, f3: 'top', r3: 0, c3: 0,
      sx: -1, sy:  1, sz: -1 },
    // back-bottom-right
    { f1: 'back', r1: 7, c1: 0, f2: 'right', r2: 7, c2: 7, f3: 'bottom', r3: 0, c3: 0,
      sx:  1, sy: -1, sz: -1 },
    // back-bottom-left
    { f1: 'back', r1: 7, c1: 7, f2: 'left', r2: 7, c2: 0, f3: 'bottom', r3: 0, c3: 7,
      sx: -1, sy: -1, sz: -1 },
  ];

  for (const tc of triCorners) {
    const i1 = overlayMask[tc.f1]?.[tc.r1]?.[tc.c1];
    const i2 = overlayMask[tc.f2]?.[tc.r2]?.[tc.c2];
    const i3 = overlayMask[tc.f3]?.[tc.r3]?.[tc.c3];
    if (i1?.active && i2?.active && i3?.active) {
      // Use f1's pixel for UV, and compute the per-axis offset from each face's pixelOffset
      const xOfs = i2.pixelOffset;  // right/left face provides x position
      const yOfs = i3.pixelOffset;  // top/bottom face provides y position
      const zOfs = i1.pixelOffset;  // front/back face provides z position
      const tcFaceBounds: Partial<Record<number, SolidPixelUVBounds>> = {};
      assignAxisFacePixels(tcFaceBounds, tc.f1, i1, tc.f1 !== 'top' && tc.f1 !== 'bottom');
      assignAxisFacePixels(tcFaceBounds, tc.f2, i2, tc.f2 !== 'top' && tc.f2 !== 'bottom');
      assignAxisFacePixels(tcFaceBounds, tc.f3, i3, tc.f3 !== 'top' && tc.f3 !== 'bottom');
      const tcFaceGeom = buildBoxGeometryWithFacePixels(
        THICKNESS,
        THICKNESS,
        THICKNESS,
        i1,
        tcFaceBounds
      );
      tcFaceGeom.translate(
        tc.sx * (xOfs + THICKNESS / 2),
        tc.sy * (yOfs + THICKNESS / 2),
        tc.sz * (zOfs + THICKNESS / 2)
      );
      geometries.push(tcFaceGeom);
    }
  }


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
