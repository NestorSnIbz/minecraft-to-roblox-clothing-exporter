import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildBaseHead, buildVoxelizedOverlay, buildReliefExportGroup, dilateTexture } from './OBJExporter';

/**
 * Downloads a Blob file in the browser.
 */
function downloadBlob(blob: Blob, filename: string) {
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
 * Exports a Three.js Object3D (e.g. the Head group) to a binary GLB file.
 * If skinImage is provided, it rebuilds a pixel-perfect voxelized head with dilated textures,
 * supporting custom voxel relief heights if a heightmap is provided.
 * 
 * @param input The THREE.Object3D (head group) to export (used if skinImage is not provided)
 * @param skinImage Optional HTMLImageElement containing the skin to rebuild voxelized geometry
 * @param heightmap Optional heightmap for the overlay relief
 * @returns Promise that resolves when the export triggers download
 */
function applyExportMaterials(group: THREE.Object3D, texture: THREE.Texture) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }

    const isOverlay = child.name !== 'Head';
    child.material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: isOverlay,
      alphaTest: isOverlay ? 0.1 : 0,
    });
    child.material.name = isOverlay ? 'OverlayMaterial' : 'HeadMaterial';
  });
}

export function exportToGLBClassic(
  input: THREE.Object3D,
  skinImage?: HTMLImageElement
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parseAndDownload = (objectToExport: THREE.Object3D) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        objectToExport,
        (gltf) => {
          try {
            if (gltf instanceof ArrayBuffer) {
              const blob = new Blob([gltf], { type: 'application/octet-stream' });
              downloadBlob(blob, 'skinbridge_cabeza.glb');
              resolve();
            } else {
              reject(new Error('Formato de exportación inválido (esperaba binario GLB).'));
            }
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          reject(error);
        },
        {
          binary: true,
          animations: [],
          includeCustomExtensions: true
        }
      );
    };

    if (skinImage) {
      try {
        // Prepare the skin texture as a 1024x1024 Nearest-Neighbor scaled data URL for embedding
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto 2D para la textura GLB.'));
          return;
        }

        // Draw the full 64x64 skin onto a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 64;
        tempCanvas.height = 64;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);

        const imgData = tempCtx.getImageData(0, 0, 64, 64);
        const dilatedData = dilateTexture(imgData);
        tempCtx.putImageData(dilatedData, 0, 0);

        // Scale dilated 64x64 texture to 1024x1024 with NEAREST NEIGHBOR interpolation
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
        const skinDataUrl = canvas.toDataURL('image/png');

        const img = new Image();
        img.onload = () => {
          try {
            const texture = new THREE.Texture(img);
            texture.name = 'textura.png';
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;

            const exportGroup = new THREE.Group();
            exportGroup.name = 'MinecraftHead';

            // 1. Build and configure voxelized head
            const voxelizedHead = buildBaseHead(skinImage);
            voxelizedHead.name = 'HeadVoxelized';
            voxelizedHead.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  roughness: 0.6,
                  metalness: 0.1,
                  side: THREE.DoubleSide
                });
                child.material.name = 'HeadMaterial';
              }
            });
            exportGroup.add(voxelizedHead);

            // 2. Build and configure voxelized overlay
            const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
            voxelizedOverlay.name = 'HeadOverlayVoxelized';
            voxelizedOverlay.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  roughness: 0.6,
                  metalness: 0.1,
                  side: THREE.DoubleSide,
                  transparent: true,
                  alphaTest: 0.1
                });
                child.material.name = 'OverlayMaterial';
              }
            });
            exportGroup.add(voxelizedOverlay);

            parseAndDownload(exportGroup);
          } catch (exportError) {
            reject(exportError);
          }
        };

        img.onerror = () => {
          reject(new Error('No se pudo cargar la imagen de la textura escalada para GLB.'));
        };

        img.src = skinDataUrl;
      } catch (err) {
        reject(err);
      }
    } else {
      parseAndDownload(input);
    }
  });
}

export function exportToGLBWithRelief(
  skinImage: HTMLImageElement,
  heightmap: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parseAndDownload = (objectToExport: THREE.Object3D) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        objectToExport,
        (gltf) => {
          try {
            if (gltf instanceof ArrayBuffer) {
              const blob = new Blob([gltf], { type: 'application/octet-stream' });
              downloadBlob(blob, 'skinbridge_cabeza.glb');
              resolve();
            } else {
              reject(new Error('Formato de exportación inválido (esperaba binario GLB).'));
            }
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          reject(error);
        },
        {
          binary: true,
          animations: [],
          includeCustomExtensions: true
        }
      );
    };

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto 2D para la textura GLB.'));
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 64;
      tempCanvas.height = 64;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);

      const imgData = tempCtx.getImageData(0, 0, 64, 64);
      const dilatedData = dilateTexture(imgData);
      tempCtx.putImageData(dilatedData, 0, 0);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
      const skinDataUrl = canvas.toDataURL('image/png');

      const img = new Image();
      img.onload = () => {
        try {
          const texture = new THREE.Texture(img);
          texture.name = 'textura.png';
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;

          const exportGroup = buildReliefExportGroup(skinImage, heightmap);
          applyExportMaterials(exportGroup, texture);

          parseAndDownload(exportGroup);
        } catch (exportError) {
          reject(exportError);
        }
      };

      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen de la textura escalada para GLB.'));
      };

      img.src = skinDataUrl;
    } catch (err) {
      reject(err);
    }
  });
}

export function exportToGLB(
  input: THREE.Object3D,
  skinImage?: HTMLImageElement,
  heightmap?: any
): Promise<void> {
  return skinImage && heightmap
    ? exportToGLBWithRelief(skinImage, heightmap)
    : exportToGLBClassic(input, skinImage);
}
