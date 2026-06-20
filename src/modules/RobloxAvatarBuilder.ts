import * as THREE from 'three';
import { 
  generateRobloxShirtCanvas, 
  generateRobloxPantsCanvas 
} from './RobloxClothingExporter';

/**
 * Builds a 3D Roblox R6 Avatar dummy and applies the generated Shirt
 * and Pants textures onto its parts in real-time.
 */
export function buildRobloxAvatar(skinImage: HTMLImageElement): THREE.Group {
  const group = new THREE.Group();
  
  // 1. Generate the shirt and pants templates from the Minecraft skin
  const shirtCanvas = generateRobloxShirtCanvas(skinImage);
  const pantsCanvas = generateRobloxPantsCanvas(skinImage);
  
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

  // ── Torso (layering shirt and pants to support both seamlessly) ──
  // Base Layer: Torso Shirt
  const torsoGeomShirt = new THREE.BoxGeometry(2, 2, 1);
  const torsoMaterialsShirt = createMaterials(shirtCanvas, ROBLOX_TORSO);
  const torsoMeshShirt = new THREE.Mesh(torsoGeomShirt, torsoMaterialsShirt);
  torsoMeshShirt.position.set(0, 1, 0);
  group.add(torsoMeshShirt);

  // Outer Layer: Torso Pants (very slightly larger to avoid z-fighting)
  const torsoGeomPants = new THREE.BoxGeometry(2.01, 2.01, 1.01);
  const torsoMaterialsPants = createMaterials(pantsCanvas, ROBLOX_TORSO);
  const torsoMeshPants = new THREE.Mesh(torsoGeomPants, torsoMaterialsPants);
  torsoMeshPants.position.set(0, 1, 0);
  group.add(torsoMeshPants);

  // ── Right Arm (Shirt) ──
  const rightArmGeom = new THREE.BoxGeometry(1, 2, 1);
  const rightArmMaterials = createMaterials(shirtCanvas, ROBLOX_RIGHT_LIMB);
  const rightArmMesh = new THREE.Mesh(rightArmGeom, rightArmMaterials);
  rightArmMesh.position.set(-1.5, 1, 0);
  group.add(rightArmMesh);

  // ── Left Arm (Shirt) ──
  const leftArmGeom = new THREE.BoxGeometry(1, 2, 1);
  const leftArmMaterials = createMaterials(shirtCanvas, ROBLOX_LEFT_LIMB);
  const leftArmMesh = new THREE.Mesh(leftArmGeom, leftArmMaterials);
  leftArmMesh.position.set(1.5, 1, 0);
  group.add(leftArmMesh);

  // ── Right Leg (Pants) ──
  const rightLegGeom = new THREE.BoxGeometry(1, 2, 1);
  const rightLegMaterials = createMaterials(pantsCanvas, ROBLOX_RIGHT_LIMB);
  const rightLegMesh = new THREE.Mesh(rightLegGeom, rightLegMaterials);
  rightLegMesh.position.set(-0.5, -1, 0);
  group.add(rightLegMesh);

  // ── Left Leg (Pants) ──
  const leftLegGeom = new THREE.BoxGeometry(1, 2, 1);
  const leftLegMaterials = createMaterials(pantsCanvas, ROBLOX_LEFT_LIMB);
  const leftLegMesh = new THREE.Mesh(leftLegGeom, leftLegMaterials);
  leftLegMesh.position.set(0.5, -1, 0);
  group.add(leftLegMesh);

  // ── Head (Roblox Classic Head in Yellowish skin tone) ──
  const headGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const headMaterial = new THREE.MeshBasicMaterial({ color: 0xf5c270 });
  const headMesh = new THREE.Mesh(headGeom, headMaterial);
  headMesh.position.set(0, 2.6, 0);
  group.add(headMesh);

  // Roblox Classic Head Stud
  const studGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
  const studMaterial = new THREE.MeshBasicMaterial({ color: 0xf5c270 });
  const studMesh = new THREE.Mesh(studGeom, studMaterial);
  studMesh.position.set(0, 3.25, 0);
  group.add(studMesh);

  return group;
}
