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
    const exporter = new GLTFExporter();

    exporter.parse(
      input,
      (gltf) => {
        try {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            downloadBlob(blob, 'cabeza.glb');
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
