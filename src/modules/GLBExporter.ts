import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
 * 
 * @param input The THREE.Object3D (head group) to export
 * @returns Promise that resolves when the export triggers download
 */
export function exportToGLB(input: THREE.Object3D): Promise<void> {
  return new Promise((resolve, reject) => {
    // Clone the entire model hierarchy to avoid modifying the active Three.js preview
    const clonedInput = input.clone();
    
    clonedInput.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone geometry to keep mutations isolated to this export
        child.geometry = child.geometry.clone();
        
        const uvAttribute = child.geometry.attributes.uv as THREE.BufferAttribute;
        const isOverlay = child.name === 'HeadOverlay';
        const offset = isOverlay ? 32 : 0;
        
        const textureSize = 64;
        const coords = { x: 16 + offset, y: 0, w: 8, h: 8 };
        
        const uMin = coords.x / textureSize;
        const uMax = (coords.x + coords.w) / textureSize;
        const vMin = (textureSize - (coords.y + coords.h)) / textureSize;
        const vMax = (textureSize - coords.y) / textureSize;
        
        // Face index 3: bottom face mapped standardly [16, 0, 24, 8] / [48, 0, 56, 8] to match BBModel
        const startIdx = 3 * 4;
        uvAttribute.setXY(startIdx, uMin, vMax);
        uvAttribute.setXY(startIdx + 1, uMax, vMax);
        uvAttribute.setXY(startIdx + 2, uMin, vMin);
        uvAttribute.setXY(startIdx + 3, uMax, vMin);
        
        uvAttribute.needsUpdate = true;
      }
    });

    const exporter = new GLTFExporter();

    exporter.parse(
      clonedInput,
      (gltf) => {
        try {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            downloadBlob(blob, 'cabeza.glb');
            // Clean up cloned geometries to prevent memory leaks
            clonedInput.traverse((child) => {
              if (child instanceof THREE.Mesh && child.geometry) {
                child.geometry.dispose();
              }
            });
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
  });
}
