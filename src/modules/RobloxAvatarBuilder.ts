import * as THREE from 'three';
import { 
  generateRobloxShirtCanvas, 
  generateRobloxPantsCanvas 
} from './RobloxClothingExporter';

// Roblox Classic Template Destination coordinates
const ROBLOX_TORSO = {
  top:    { x: 231, y: 8,   w: 128, h: 64 },
  left:   { x: 361, y: 74,  w: 64,  h: 128 },
  front:  { x: 231, y: 74,  w: 128, h: 128 },
  right:  { x: 165, y: 74,  w: 64,  h: 128 },
  back:   { x: 427, y: 74,  w: 128, h: 128 },
  bottom: { x: 231, y: 204, w: 128, h: 64 },
};

const ROBLOX_RIGHT_LIMB = {
  top:    { x: 217, y: 289, w: 64, h: 64 },
  left:   { x: 19,  y: 355, w: 64, h: 128 },
  back:   { x: 85,  y: 355, w: 64, h: 128 },
  right:  { x: 151, y: 355, w: 64, h: 128 },
  front:  { x: 217, y: 355, w: 64, h: 128 },
  bottom: { x: 217, y: 485, w: 64, h: 64 },
};

const ROBLOX_LEFT_LIMB = {
  top:    { x: 308, y: 289, w: 64, h: 64 },
  front:  { x: 308, y: 355, w: 64, h: 128 },
  left:   { x: 374, y: 355, w: 64, h: 128 },
  back:   { x: 440, y: 355, w: 64, h: 128 },
  right:  { x: 506, y: 355, w: 64, h: 128 },
  bottom: { x: 308, y: 485, w: 64, h: 64 },
};

// Head coordinates on a composited 32x16 head canvas (base + overlay blended)
const ROBLOX_HEAD_COORDS = {
  left:   { x: 16, y: 8, w: 8, h: 8 },
  right:  { x: 0,  y: 8, w: 8, h: 8 },
  top:    { x: 8,  y: 0, w: 8, h: 8 },
  bottom: { x: 16, y: 0, w: 8, h: 8 },
  front:  { x: 8,  y: 8, w: 8, h: 8 },
  back:   { x: 24, y: 8, w: 8, h: 8 },
};

function generateHeadCanvas(skinImage: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // 1. Draw head base layer (0,0 to 32,16)
  ctx.drawImage(skinImage, 0, 0, 32, 16, 0, 0, 32, 16);

  // 2. Composite head overlay layer (32,0 to 64,16) on top
  ctx.drawImage(skinImage, 32, 0, 32, 16, 0, 0, 32, 16);

  return canvas;
}

/**
 * Builds a 3D Roblox R6 Avatar dummy and applies the generated Shirt
 * and Pants textures onto its parts in real-time.
 */
export function buildRobloxAvatar(skinImage: HTMLImageElement | HTMLCanvasElement, isSlimOverride?: boolean): THREE.Group {
  const group = new THREE.Group();
  
  // 1. Generate the shirt, pants, and head templates from the Minecraft skin
  const shirtCanvas = generateRobloxShirtCanvas(skinImage, isSlimOverride);
  const pantsCanvas = generateRobloxPantsCanvas(skinImage);
  const headCanvas = generateHeadCanvas(skinImage);
  
  // Helper to extract a face texture from a template canvas
  const getTexture = (canvas: HTMLCanvasElement, rect: { x: number; y: number; w: number; h: number }) => {
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = rect.w;
    faceCanvas.height = rect.h;
    const ctx = faceCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    
    const texture = new THREE.CanvasTexture(faceCanvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Helper to create materials for a box using specific coordinates on a canvas
  const createMaterials = (canvas: HTMLCanvasElement, coords: any) => {
    return [
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.left), transparent: true, side: THREE.DoubleSide }),   // +X (Left side of character)
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.right), transparent: true, side: THREE.DoubleSide }),  // -X (Right side of character)
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.top), transparent: true, side: THREE.DoubleSide }),    // +Y (Top)
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.bottom), transparent: true, side: THREE.DoubleSide }), // -Y (Bottom)
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.front), transparent: true, side: THREE.DoubleSide }),  // +Z (Front)
      new THREE.MeshBasicMaterial({ map: getTexture(canvas, coords.back), transparent: true, side: THREE.DoubleSide }),   // -Z (Back)
    ];
  };

  // ── Torso (layering shirt and pants to support both seamlessly) ──
  // Base Layer: Torso Shirt
  const torsoGeomShirt = new THREE.BoxGeometry(2, 2, 1);
  const torsoMaterialsShirt = createMaterials(shirtCanvas, ROBLOX_TORSO);
  const torsoMeshShirt = new THREE.Mesh(torsoGeomShirt, torsoMaterialsShirt);
  torsoMeshShirt.position.set(0, 1, 0);
  torsoMeshShirt.userData = { meshName: 'torso', isPants: false };
  torsoMeshShirt.userData.baseY = torsoMeshShirt.position.y;
  group.add(torsoMeshShirt);

  // Outer Layer: Torso Pants (very slightly larger to avoid z-fighting)
  const torsoGeomPants = new THREE.BoxGeometry(2.01, 2.01, 1.01);
  const torsoMaterialsPants = createMaterials(pantsCanvas, ROBLOX_TORSO);
  const torsoMeshPants = new THREE.Mesh(torsoGeomPants, torsoMaterialsPants);
  torsoMeshPants.position.set(0, 1, 0);
  torsoMeshPants.userData = { meshName: 'torso', isPants: true };
  torsoMeshPants.userData.baseY = torsoMeshPants.position.y;
  group.add(torsoMeshPants);

  // ── Right Arm (Shirt) ──
  const rightArmGeom = new THREE.BoxGeometry(1, 2, 1);
  const rightArmMaterials = createMaterials(shirtCanvas, ROBLOX_RIGHT_LIMB);
  const rightArmMesh = new THREE.Mesh(rightArmGeom, rightArmMaterials);
  rightArmMesh.position.set(-1.5, 1, 0);
  rightArmMesh.userData = { meshName: 'rightArm' };
  group.add(rightArmMesh);

  // ── Left Arm (Shirt) ──
  const leftArmGeom = new THREE.BoxGeometry(1, 2, 1);
  const leftArmMaterials = createMaterials(shirtCanvas, ROBLOX_LEFT_LIMB);
  const leftArmMesh = new THREE.Mesh(leftArmGeom, leftArmMaterials);
  leftArmMesh.position.set(1.5, 1, 0);
  leftArmMesh.userData = { meshName: 'leftArm' };
  group.add(leftArmMesh);

  // ── Right Leg (Pants) ──
  const rightLegGeom = new THREE.BoxGeometry(1, 2, 1);
  const rightLegMaterials = createMaterials(pantsCanvas, ROBLOX_RIGHT_LIMB);
  const rightLegMesh = new THREE.Mesh(rightLegGeom, rightLegMaterials);
  rightLegMesh.position.set(-0.5, -1, 0);
  rightLegMesh.userData = { meshName: 'rightLeg' };
  group.add(rightLegMesh);

  // ── Left Leg (Pants) ──
  const leftLegGeom = new THREE.BoxGeometry(1, 2, 1);
  const leftLegMaterials = createMaterials(pantsCanvas, ROBLOX_LEFT_LIMB);
  const leftLegMesh = new THREE.Mesh(leftLegGeom, leftLegMaterials);
  leftLegMesh.position.set(0.5, -1, 0);
  leftLegMesh.userData = { meshName: 'leftLeg' };
  group.add(leftLegMesh);

  // ── Head (Textured Head) ──
  const headGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const headMaterials = createMaterials(headCanvas, ROBLOX_HEAD_COORDS);
  const headMesh = new THREE.Mesh(headGeom, headMaterials);
  headMesh.position.set(0, 2.6, 0);
  headMesh.userData = { meshName: 'head' };
  headMesh.userData.baseY = headMesh.position.y;
  group.add(headMesh);

  // Roblox Classic Head Stud
  const studGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
  const studMaterial = new THREE.MeshBasicMaterial({ color: 0xe4a07a });
  const studMesh = new THREE.Mesh(studGeom, studMaterial);
  studMesh.position.set(0, 3.25, 0);
  studMesh.userData = { meshName: 'head' };
  studMesh.userData.baseY = studMesh.position.y;
  group.add(studMesh);

  return group;
}

/**
 * Updates the textures of an existing Roblox Avatar group in real-time,
 * without recreating geometry or resetting the camera/rotation.
 */
export function updateRobloxAvatarTextures(avatarGroup: THREE.Group, skinImage: HTMLImageElement | HTMLCanvasElement, isSlim: boolean) {
  const shirtCanvas = generateRobloxShirtCanvas(skinImage, isSlim);
  const pantsCanvas = generateRobloxPantsCanvas(skinImage);
  const headCanvas = generateHeadCanvas(skinImage);

  // Helper to update a CanvasTexture from a template rect
  const updateTexture = (material: THREE.MeshBasicMaterial, templateCanvas: HTMLCanvasElement, rect: { x: number; y: number; w: number; h: number }) => {
    const texture = material.map as THREE.CanvasTexture;
    if (texture && texture.image) {
      const faceCanvas = texture.image as HTMLCanvasElement;
      const ctx = faceCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
      ctx.drawImage(templateCanvas, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      texture.needsUpdate = true;
    }
  };

  const updateMeshMaterials = (mesh: THREE.Mesh, templateCanvas: HTMLCanvasElement, coords: any) => {
    const materials = mesh.material;
    if (Array.isArray(materials)) {
      updateTexture(materials[0] as THREE.MeshBasicMaterial, templateCanvas, coords.left);   // +X
      updateTexture(materials[1] as THREE.MeshBasicMaterial, templateCanvas, coords.right);  // -X
      updateTexture(materials[2] as THREE.MeshBasicMaterial, templateCanvas, coords.top);    // +Y
      updateTexture(materials[3] as THREE.MeshBasicMaterial, templateCanvas, coords.bottom); // -Y
      updateTexture(materials[4] as THREE.MeshBasicMaterial, templateCanvas, coords.front);  // +Z
      updateTexture(materials[5] as THREE.MeshBasicMaterial, templateCanvas, coords.back);   // -Z
    }
  };

  avatarGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const name = child.userData?.meshName || child.name;
      if (name === 'torso') {
        const isPants = child.userData?.isPants;
        updateMeshMaterials(child, isPants ? pantsCanvas : shirtCanvas, ROBLOX_TORSO);
      } else if (name === 'rightArm') {
        updateMeshMaterials(child, shirtCanvas, ROBLOX_RIGHT_LIMB);
      } else if (name === 'leftArm') {
        updateMeshMaterials(child, shirtCanvas, ROBLOX_LEFT_LIMB);
      } else if (name === 'rightLeg') {
        updateMeshMaterials(child, pantsCanvas, ROBLOX_RIGHT_LIMB);
      } else if (name === 'leftLeg') {
        updateMeshMaterials(child, pantsCanvas, ROBLOX_LEFT_LIMB);
      } else if (name === 'head') {
        // Only update textured head box mesh
        if (Array.isArray(child.material) && child.material.length === 6) {
          updateMeshMaterials(child, headCanvas, ROBLOX_HEAD_COORDS);
        }
      }
    }
  });
}
