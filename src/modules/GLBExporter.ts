import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildBaseHead, buildVoxelizedOverlay, dilateTexture } from './OBJExporter';
import { buildVoxelizedOverlayWithRelief } from './HeadBuilder';

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

function applyClassicGlbMaterials(group: THREE.Object3D, texture: THREE.Texture) {
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

function convertClassicUvsToGlbSpace(group: THREE.Object3D) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return;
    }

    const uvAttr = child.geometry.getAttribute('uv');
    if (!uvAttr || !(uvAttr instanceof THREE.BufferAttribute)) {
      return;
    }

    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setY(i, 1 - uvAttr.getY(i));
    }

    uvAttr.needsUpdate = true;
  });
}

function createClassicGlbTexture(skinImage: HTMLImageElement): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = 'textura.png';
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;

    resolve(texture);
  });
}

function finalizeClassicGlbExport(group: THREE.Object3D): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
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
  });
}

export function exportToGLBClassic(
  input: THREE.Object3D,
  skinImage?: HTMLImageElement
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (skinImage) {
      createClassicGlbTexture(skinImage)
        .then((texture) => {
          const exportGroup = new THREE.Group();
          exportGroup.name = 'MinecraftHead';

          const voxelizedHead = buildBaseHead(skinImage);
          voxelizedHead.name = 'HeadVoxelized';
          exportGroup.add(voxelizedHead);

          const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
          voxelizedOverlay.name = 'HeadOverlayVoxelized';
          exportGroup.add(voxelizedOverlay);

          applyClassicGlbMaterials(exportGroup, texture);
          convertClassicUvsToGlbSpace(exportGroup);

          return finalizeClassicGlbExport(exportGroup);
        })
        .then(() => resolve())
        .catch(reject);
    } else {
      finalizeClassicGlbExport(input).then(() => resolve()).catch(reject);
    }
  });
}

function createReliefGlbTexture(skinImage: HTMLImageElement): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('No se pudo crear el contexto 2D para la textura GLB con relieve.'));
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

    const texture = new THREE.CanvasTexture(canvas);
    texture.name = 'textura_relieve.png';
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.needsUpdate = true;

    resolve(texture);
  });
}

function buildReliefGlbExportGroup(
  skinImage: HTMLImageElement,
  heightmap: any
): THREE.Group {
  const exportGroup = new THREE.Group();
  exportGroup.name = 'MinecraftHead';

  const voxelizedHead = buildBaseHead(skinImage);
  voxelizedHead.name = 'HeadVoxelizedReliefGLB';
  exportGroup.add(voxelizedHead);

  const reliefOverlay = buildVoxelizedOverlayWithRelief(skinImage, heightmap);
  reliefOverlay.name = 'HeadOverlayReliefGLB';
  exportGroup.add(reliefOverlay);

  return exportGroup;
}

function applyReliefGlbMaterials(group: THREE.Object3D, texture: THREE.Texture) {
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

function convertReliefUvsToGlbSpace(group: THREE.Object3D) {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return;
    }

    const uvAttr = child.geometry.getAttribute('uv');
    if (!uvAttr || !(uvAttr instanceof THREE.BufferAttribute)) {
      return;
    }

    for (let i = 0; i < uvAttr.count; i++) {
      uvAttr.setY(i, 1 - uvAttr.getY(i));
    }

    uvAttr.needsUpdate = true;
  });
}

function finalizeReliefGlbExport(group: THREE.Object3D): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (gltf) => {
        try {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'application/octet-stream' });
            downloadBlob(blob, 'skinbridge_cabeza.glb');
            resolve();
          } else {
            reject(new Error('Formato de exportación inválido para GLB con relieve.'));
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

export function exportToGLBWithRelief(
  skinImage: HTMLImageElement,
  heightmap: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    createReliefGlbTexture(skinImage)
      .then((texture) => {
        const exportGroup = buildReliefGlbExportGroup(skinImage, heightmap);
        applyReliefGlbMaterials(exportGroup, texture);
        convertReliefUvsToGlbSpace(exportGroup);

        return finalizeReliefGlbExport(exportGroup);
      })
      .then(() => resolve())
      .catch(reject);
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
