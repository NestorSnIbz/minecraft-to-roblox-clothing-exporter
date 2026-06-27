import * as THREE from 'three';
import { OBJExporter as ThreeOBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { buildVoxelizedOverlayWithReliefForExport } from './HeadBuilder';

/**
 * Downloads text content as a file in the browser.
 */
function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
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
 * Expands (dilates) the borders of opaque pixels in the texture into the transparent regions.
 * This completely eliminates the black outline (alpha bleeding) caused by bilinear filtering in Roblox Studio.
 */
export function dilateTexture(imgData: ImageData): ImageData {
  const width = imgData.width;
  const height = imgData.height;
  const data = imgData.data;
  
  // Perform 4 iterations of pixel dilation to cover filtering margin
  for (let iter = 0; iter < 4; iter++) {
    const nextData = new Uint8ClampedArray(data);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // If current pixel is transparent
        if (data[idx + 3] < 10) {
          // Check 4-neighborhood neighbors
          const neighbors = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 }
          ];
          for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
              const nIdx = (n.y * width + n.x) * 4;
              // If neighbor is opaque, copy its color
              if (data[nIdx + 3] >= 10) {
                nextData[idx] = data[nIdx];
                nextData[idx + 1] = data[nIdx + 1];
                nextData[idx + 2] = data[nIdx + 2];
                nextData[idx + 3] = data[idx + 3]; // Preserve original transparency (alpha < 10)
                break;
              }
            }
          }
        }
      }
    }
    data.set(nextData);
  }
  return imgData;
}

/**
 * Downloads the skin image as a PNG file (textura.png).
 * Crops only the head region (top 64x16 pixels) and scales it to 1024x1024.
 * Applies dilation to fix alpha bleeding / black outlines.
 */
function downloadSkinImage(image: HTMLImageElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(); return; }
    
    // Draw the full 64x64 skin onto a temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64;
    tempCanvas.height = 64;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(image, 0, 0, 64, 64, 0, 0, 64, 64);
    
    const imgData = tempCtx.getImageData(0, 0, 64, 64);
    const dilatedData = dilateTexture(imgData);
    tempCtx.putImageData(dilatedData, 0, 0);
    
    // Scale the dilated 64x64 texture to 1024x1024 using NEAREST NEIGHBOR interpolation
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
    
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

/**
 * Helper to build custom PlaneGeometry for a single voxel face with UV coordinates mapping to a single pixel.
 * Converts to non-indexed geometry so it can be merged directly.
 */
function buildPlaneGeometry(
  w: number,
  h: number,
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(w, h);
  const uvAttr = geom.attributes.uv as THREE.BufferAttribute;
  uvAttr.setXY(0, uMin, vMax);
  uvAttr.setXY(1, uMax, vMax);
  uvAttr.setXY(2, uMin, vMin);
  uvAttr.setXY(3, uMax, vMin);
  uvAttr.needsUpdate = true;
  
  const nonIndexed = geom.toNonIndexed();
  geom.dispose();
  return nonIndexed;
}

/**
 * Builds a BoxGeometry (non-indexed) with all UV coordinates mapped to a single pixel center
 * to ensure that all 6 sides of the voxel cube render as a solid pixel color.
 */
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
  const uCenter = (uMin + uMax) / 2;
  const vCenter = (vMin + vMax) / 2;
  
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(i, uCenter, vCenter);
  }
  uvAttr.needsUpdate = true;

  const nonIndexed = geom.toNonIndexed();
  geom.dispose();
  return nonIndexed;
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

  // Generate a sequential index array so the geometry is indexed
  // This resolves corruption and import errors in strict FBX parsers (like Roblox Studio)
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
 * Builds the base head model (8x8x8) as a grid of individual quads to enable sharp color borders in Roblox.
 */
export function buildBaseHead(skinImage: HTMLImageElement): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HeadVoxelized';

  // Read skin pixels
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skinImage, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64);

  const pixelSize = 1.0; // Base head size is 8x8x8, so pixel size is 1.0
  const offset = 4.0;
  const gridOffset = 3.5;

  const faces = [
    { // Face 0 (Right, +X)
      faceIndex: 0,
      startX: 16, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(Math.PI / 2);
      },
      getPos: (col: number, row: number) => ({
        x: offset,
        y: gridOffset - row * pixelSize,
        z: gridOffset - col * pixelSize
      })
    },
    { // Face 1 (Left, -X)
      faceIndex: 1,
      startX: 0, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(-Math.PI / 2);
      },
      getPos: (col: number, row: number) => ({
        x: -offset,
        y: gridOffset - row * pixelSize,
        z: -gridOffset + col * pixelSize
      })
    },
    { // Face 2 (Top, +Y)
      faceIndex: 2,
      startX: 8, startY: 0,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateX(-Math.PI / 2);
      },
      getPos: (col: number, row: number) => ({
        x: -gridOffset + col * pixelSize,
        y: offset,
        z: -gridOffset + row * pixelSize
      })
    },
    { // Face 3 (Bottom, -Y)
      faceIndex: 3,
      startX: 16, startY: 0,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateZ(Math.PI);
        geom.rotateX(Math.PI / 2);
      },
      getPos: (col: number, row: number) => ({
        x: -gridOffset + col * pixelSize,
        y: -offset,
        z: -gridOffset + row * pixelSize
      })
    },
    { // Face 4 (Front, +Z)
      faceIndex: 4,
      startX: 8, startY: 8,
      applyRotation: (_geom: THREE.BufferGeometry) => {},
      getPos: (col: number, row: number) => ({
        x: -gridOffset + col * pixelSize,
        y: gridOffset - row * pixelSize,
        z: offset
      })
    },
    { // Face 5 (Back, -Z)
      faceIndex: 5,
      startX: 24, startY: 8,
      applyRotation: (geom: THREE.BufferGeometry) => {
        geom.rotateY(Math.PI);
      },
      getPos: (col: number, row: number) => ({
        x: gridOffset - col * pixelSize,
        y: gridOffset - row * pixelSize,
        z: -offset
      })
    }
  ];

  const geometries: THREE.BufferGeometry[] = [];

  faces.forEach((face) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const px = face.startX + col;
        const py = face.startY + row;
        const idx = (py * 64 + px) * 4;
        const alpha = imgData.data[idx + 3];

        if (alpha > 10) {
          const uMin = px / 64;
          const uMax = (px + 1) / 64;
          const vMin = (64 - (py + 1)) / 64;
          const vMax = (64 - py) / 64;

          // Map the entire quad to the exact center of the pixel to completely eliminate bilinear bleeding (orange lines)
          const uCenter = (uMin + uMax) / 2;
          const vCenter = (vMin + vMax) / 2;

          const geom = buildPlaneGeometry(pixelSize, pixelSize, uCenter, uCenter, vCenter, vCenter);
          
          // Apply rotation
          face.applyRotation(geom);
          
          // Apply translation
          const pos = face.getPos(col, row);
          geom.translate(pos.x, pos.y, pos.z);
          
          geometries.push(geom);
        }
      }
    }
  });

  const baseMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  if (geometries.length > 0) {
    const mergedGeom = mergeBufferGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(mergedGeom, baseMaterial);
    mesh.name = 'Head';
    group.add(mesh);
  }

  return group;
}

/**
 * Builds a 3D group representing only the non-transparent pixels in the skin's overlay layer.
 * Supports optional 3D voxel relief (thickness/depth) when a heightmap is provided.
 * Merges all voxels/planes into a single consolidated mesh named 'HeadOverlay' to preserve 3D relief in Roblox Studio.
 */
export function buildVoxelizedOverlay(
  skinImage: HTMLImageElement,
  heightmap?: any
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
  const flatOffset = 4.5; // classic flat plane offset

  // Handle dynamic offsets decided by the AI, or legacy format
  let offsets = { right: 4.0, left: 4.0, top: 4.0, bottom: 4.0, front: 4.0, back: 4.0 };

  if (heightmap && heightmap.offsets) {
    offsets = heightmap.offsets;
  } else if (heightmap) {
    // Legacy support: only front face had 4.15 gap
    offsets = { right: 4.0, left: 4.0, top: 4.0, bottom: 4.0, front: 4.15, back: 4.0 };
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: d,
          y: gridOffset - row * pixelSize,
          z: gridOffset - col * pixelSize
        };
      }
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: -d,
          y: gridOffset - row * pixelSize,
          z: -gridOffset + col * pixelSize
        };
      }
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: -gridOffset + col * pixelSize,
          y: d,
          z: -gridOffset + row * pixelSize
        };
      }
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: -gridOffset + col * pixelSize,
          y: -d,
          z: -gridOffset + row * pixelSize
        };
      }
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: -gridOffset + col * pixelSize,
          y: gridOffset - row * pixelSize,
          z: d
        };
      }
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
      getPos: (col: number, row: number, thickness: number, pixelOffset: number) => {
        const d = thickness > 0 ? (pixelOffset + thickness / 2) : flatOffset;
        return {
          x: gridOffset - col * pixelSize,
          y: gridOffset - row * pixelSize,
          z: -d
        };
      }
    }
  ];

  const geometries: THREE.BufferGeometry[] = [];

  faces.forEach((face) => {
    const faceHeightmap = heightmap ? heightmap[face.key] : null;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const px = face.startX + col;
        const py = face.startY + row;
        const idx = (py * 64 + px) * 4;
        const alpha = imgData.data[idx + 3];

        if (alpha > 10) {
          const uMin = px / 64;
          const uMax = (px + 1) / 64;
          const vMin = (64 - (py + 1)) / 64;
          const vMax = (64 - py) / 64;

          const uCenter = (uMin + uMax) / 2;
          const vCenter = (vMin + vMax) / 2;

          if (heightmap) {
            let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
            if (heightVal === 0) {
              heightVal = 1;
            }
            const faceDefaultOffset = offsets[face.key as keyof typeof offsets] ?? 4.0;
            
            // Determine active layers
            let activeLayers: number[] = [];
            if (heightVal === 1) {
              activeLayers = [1];
            } else if (heightVal === 2) {
              activeLayers = [1, 2];
            } else if (heightVal === 3) {
              activeLayers = [2];
            } else if (heightVal === 4) {
              activeLayers = [2, 3];
            }

            // Check coordinate occupancy
            const freeLayers: number[] = [];
            activeLayers.forEach((d) => {
              const coord = face.getGridCoord(col, row, d);
              const coordKey = `${coord.gx},${coord.gy},${coord.gz}`;
              if (!occupied.has(coordKey)) {
                occupied.add(coordKey);
                freeLayers.push(d);
              }
            });

            if (freeLayers.length === 0) {
              continue;
            }

            const addBox = (thickness: number, pixelOffset: number) => {
              const geom = buildBoxGeometry(pixelSize, pixelSize, thickness, uMin, uMax, vMin, vMax);
              face.applyRotation(geom);
              const pos = face.getPos(col, row, thickness, pixelOffset);
              geom.translate(pos.x, pos.y, pos.z);
              geometries.push(geom);
            };

            if (heightVal === 1) {
              addBox(0.35, faceDefaultOffset);
            } else if (heightVal === 2) {
              const hasL1 = freeLayers.includes(1);
              const hasL2 = freeLayers.includes(2);
              if (hasL1 && hasL2) {
                addBox(0.7, faceDefaultOffset);
              } else if (hasL1) {
                addBox(0.35, faceDefaultOffset);
              } else if (hasL2) {
                addBox(0.35, faceDefaultOffset + 0.35);
              }
            } else if (heightVal === 3) {
              addBox(0.35, 4.15);
            } else if (heightVal === 4) {
              const hasL2 = freeLayers.includes(2);
              const hasL3 = freeLayers.includes(3);
              if (hasL2 && hasL3) {
                addBox(0.7, 4.15);
              } else if (hasL2) {
                addBox(0.35, 4.15);
              } else if (hasL3) {
                addBox(0.35, 4.5);
              }
            }
          } else {
            // Flat quads do not have volume/heightmap, so we just generate them normally
            const geom = buildPlaneGeometry(pixelSize, pixelSize, uCenter, uCenter, vCenter, vCenter);
            face.applyRotation(geom);
            const pos = face.getPos(col, row, 0, 0);
            geom.translate(pos.x, pos.y, pos.z);
            geometries.push(geom);
          }
        }
      }
    }
  });

  // Share a single material for the overlay (render double-sided)
  const voxelMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  if (geometries.length > 0) {
    const mergedGeom = removeExactDuplicateTriangles(mergeBufferGeometries(geometries));
    
    // Dispose of all temporary geometries
    geometries.forEach((g) => g.dispose());
    
    const mesh = new THREE.Mesh(mergedGeom, voxelMaterial);
    mesh.name = 'HeadOverlay';
    group.add(mesh);
  }

  return group;
}

function assignNamedExportMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.material) {
      return;
    }

    const materialName = child.name === 'Head' ? 'HeadMaterial' : 'OverlayMaterial';
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => {
        material.name = materialName;
      });
    } else {
      child.material.name = materialName;
    }
  });
}

export function buildReliefExportGroup(
  skinImage: HTMLImageElement,
  heightmap: any
): THREE.Group {
  const exportGroup = new THREE.Group();
  exportGroup.name = 'MinecraftHead';

  const voxelizedHead = buildBaseHead(skinImage);
  voxelizedHead.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.material.name = 'HeadMaterial';
    }
  });
  exportGroup.add(voxelizedHead);

  const reliefOverlay = buildVoxelizedOverlayWithReliefForExport(skinImage, heightmap);
  reliefOverlay.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      child.material.name = 'OverlayMaterial';
    }
  });
  exportGroup.add(reliefOverlay);

  return exportGroup;
}

/**
 * Exports the Three.js head model to OBJ + MTL + PNG format.
 * Voxelizes the overlay layer as flat quads or 3D voxel cubes (if heightmap is provided) to ensure correct look in Roblox.
 */
export function exportToOBJClassic(skinImage: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary export group
      const exportGroup = new THREE.Group();
      exportGroup.name = 'MinecraftHead';

      // 1. Add the voxelized base head
      const voxelizedHead = buildBaseHead(skinImage);
      voxelizedHead.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material.name = 'HeadMaterial';
          }
        }
      });
      exportGroup.add(voxelizedHead);

      // 2. Add the voxelized overlay (flat planes or relief boxes)
      const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
      voxelizedOverlay.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            child.material.name = 'OverlayMaterial';
          }
        }
      });
      exportGroup.add(voxelizedOverlay);

      const exporter = new ThreeOBJExporter();
      const rawObj = exporter.parse(exportGroup);
      
      // Prepend the mtllib reference so importers can find skinbridge_cabeza.mtl
      const objText = `mtllib skinbridge_cabeza.mtl\n${rawObj}`;
      
      // Generate MTL content with proper material definitions
      const mtlText = `# Minecraft Head - Material Template Library
# Generated by Minecraft 3D Head Creator

newmtl HeadMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png

newmtl OverlayMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png
`;

      // Download all three files with small delays to avoid browser blocking
      downloadTextFile(objText, 'skinbridge_cabeza.obj', 'text/plain');
      
      setTimeout(() => {
        downloadTextFile(mtlText, 'skinbridge_cabeza.mtl', 'text/plain');
      }, 200);

      setTimeout(async () => {
        await downloadSkinImage(skinImage, 'skinbridge_textura.png');
        resolve();
      }, 400);

    } catch (error) {
      reject(error);
    }
  });
}

export function exportToOBJWithRelief(
  skinImage: HTMLImageElement,
  heightmap: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const exportGroup = buildReliefExportGroup(skinImage, heightmap);
      assignNamedExportMaterials(exportGroup);

      const exporter = new ThreeOBJExporter();
      const rawObj = exporter.parse(exportGroup);
      const objText = `mtllib skinbridge_cabeza.mtl\n${rawObj}`;

      const mtlText = `# Minecraft Head - Material Template Library
# Generated by Minecraft 3D Head Creator

newmtl HeadMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png

newmtl OverlayMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png
`;

      downloadTextFile(objText, 'skinbridge_cabeza.obj', 'text/plain');

      setTimeout(() => {
        downloadTextFile(mtlText, 'skinbridge_cabeza.mtl', 'text/plain');
      }, 200);

      setTimeout(async () => {
        await downloadSkinImage(skinImage, 'skinbridge_textura.png');
        resolve();
      }, 400);
    } catch (error) {
      reject(error);
    }
  });
}

export function exportToOBJ(
  _input: THREE.Object3D,
  skinImage: HTMLImageElement,
  heightmap?: any
): Promise<void> {
  return heightmap
    ? exportToOBJWithRelief(skinImage, heightmap)
    : exportToOBJClassic(skinImage);
}
