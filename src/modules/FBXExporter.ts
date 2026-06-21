import * as THREE from 'three';
import { exportFbx } from 'three-js-fbx-exporter';
import { buildBaseHead, buildVoxelizedOverlay, dilateTexture } from './OBJExporter';

/**
 * Downloads a binary buffer as a file in the browser.
 */
function downloadBinaryFile(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
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
 * Exports the Three.js head model to a binary FBX file.
 * Voxelizes the base head and overlay as flat planes/quads to ensure correct transparency and look in Roblox.
 * Employs dilated textures scaled to 1024x1024 to prevent filtering seams.
 *
 * @param _input The THREE.Object3D (head group) - ignored, we rebuild voxelized geometry like OBJ.
 * @param skinImage The HTMLImageElement containing the skin
 */
export function exportToFBX(_input: THREE.Object3D, skinImage: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Prepare the skin texture as a 1024x1024 Nearest-Neighbor scaled data URL for embedding
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto 2D para la textura.'));
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
      
      // Scale the dilated 64x64 texture to 1024x1024 using NEAREST NEIGHBOR interpolation
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
      const skinDataUrl = canvas.toDataURL('image/png');

      const img = new Image();
      img.onload = () => {
        try {
          // Create the custom texture to assign to the Three.js materials
          const texture = new THREE.Texture(img);
          texture.name = 'textura.png';
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          (texture as any).sourceFile = 'textura.png';
          texture.needsUpdate = true;

          // Create the voxelized export group
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

          // Export the cloned model to binary FBX with Blender-compatible settings
          const fbxBytes = exportFbx(exportGroup, {
            format: 'binary',
            target: 'blender',
            embedTextures: true,
            onWarning: (warning) => {
              console.warn('[FBX Export Warning]', warning.message || warning.code);
            },
          });

          downloadBinaryFile(fbxBytes, 'cabeza.fbx');
          resolve();
        } catch (exportError) {
          reject(exportError);
        }
      };

      img.onerror = () => {
        reject(new Error('No se pudo cargar la imagen de la textura escalada.'));
      };

      img.src = skinDataUrl;
    } catch (error) {
      reject(error);
    }
  });
}
