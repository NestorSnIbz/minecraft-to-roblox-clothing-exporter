import * as THREE from 'three';
import { exportFbx } from 'three-js-fbx-exporter';

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
 *
 * Uses `three-js-fbx-exporter` which generates a real, standards-compliant
 * binary FBX 7400 file directly in the browser. The exported file preserves:
 * - Mesh hierarchy (Head + HeadOverlay as separate objects)
 * - UV coordinates
 * - Materials with PBR-to-FBX adaptation
 * - Embedded textures
 *
 * Compatible with Blender, Maya, 3ds Max, and other professional DCC tools.
 *
 * @param input The THREE.Object3D (head group) to export
 * @param skinImage The HTMLImageElement containing the skin (used for texture embedding)
 */
export function exportToFBX(input: THREE.Object3D, skinImage: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Prepare the skin texture as a data URL for embedding
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto 2D para la textura.'));
        return;
      }
      ctx.drawImage(skinImage, 0, 0);
      const skinDataUrl = canvas.toDataURL('image/png');

      // Ensure textures have their image source set as data URL for embedding
      input.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material;
          const materials = Array.isArray(mat) ? mat : [mat];
          
          materials.forEach((m) => {
            if (m && m.map) {
              // Set the source as data URL so the exporter can embed it
              if (m.map.image) {
                m.map.image.src = skinDataUrl;
              }
              m.map.sourceFile = 'textura.png';
            }
          });
        }
      });

      // Export to binary FBX with Blender-compatible settings
      const fbxBytes = exportFbx(input, {
        format: 'binary',
        target: 'blender',
        embedTextures: true,
        onWarning: (warning) => {
          console.warn('[FBX Export Warning]', warning.message || warning.code);
        },
      });

      downloadBinaryFile(fbxBytes, 'cabeza.fbx');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
