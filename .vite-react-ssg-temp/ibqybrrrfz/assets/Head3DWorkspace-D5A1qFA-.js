import { n as useTranslation, t as supabase } from "../main.mjs";
import { a as exportToOBJClassic, i as dilateTexture, n as buildReliefExportGroup, o as exportToOBJWithRelief, r as buildVoxelizedOverlay, s as build3DHead, t as buildBaseHead } from "./OBJExporter-DH3WzVke.js";
import { t as ThreeViewer } from "./ThreeViewer-CRwfpc2W.js";
import { n as checkRateLimit, t as RateLimitError } from "./rateLimit-BgQdUSFi.js";
import { Head } from "vite-react-ssg";
import { useEffect, useRef, useState } from "react";
import { Download, Grid, RotateCw, Upload } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
import * as THREE from "three";
import { exportFbx } from "three-js-fbx-exporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { nanoid } from "nanoid";
//#region src/modules/GLBExporter.ts
/**
* Downloads a Blob file in the browser.
*/
function downloadBlob(blob, filename) {
	const link = document.createElement("a");
	link.style.display = "none";
	document.body.appendChild(link);
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
function applyClassicGlbMaterials(group, texture) {
	group.traverse((child) => {
		if (!(child instanceof THREE.Mesh)) return;
		const isOverlay = child.name !== "Head";
		child.material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			side: THREE.DoubleSide,
			transparent: isOverlay,
			alphaTest: isOverlay ? .1 : 0
		});
		child.material.name = isOverlay ? "OverlayMaterial" : "HeadMaterial";
	});
}
function convertClassicUvsToGlbSpace(group) {
	group.traverse((child) => {
		if (!(child instanceof THREE.Mesh) || !child.geometry) return;
		const uvAttr = child.geometry.getAttribute("uv");
		if (!uvAttr || !(uvAttr instanceof THREE.BufferAttribute)) return;
		for (let i = 0; i < uvAttr.count; i++) uvAttr.setY(i, 1 - uvAttr.getY(i));
		uvAttr.needsUpdate = true;
	});
}
function createClassicGlbTexture(skinImage) {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			reject(/* @__PURE__ */ new Error("No se pudo crear el contexto 2D para la textura GLB."));
			return;
		}
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = 64;
		tempCanvas.height = 64;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);
		const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, 64, 64));
		tempCtx.putImageData(dilatedData, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
		const texture = new THREE.CanvasTexture(canvas);
		texture.name = "textura.png";
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.flipY = false;
		texture.needsUpdate = true;
		resolve(texture);
	});
}
function finalizeClassicGlbExport(group) {
	return new Promise((resolve, reject) => {
		new GLTFExporter().parse(group, (gltf) => {
			try {
				if (gltf instanceof ArrayBuffer) {
					downloadBlob(new Blob([gltf], { type: "application/octet-stream" }), "skinbridge_cabeza.glb");
					resolve();
				} else reject(/* @__PURE__ */ new Error("Formato de exportación inválido (esperaba binario GLB)."));
			} catch (err) {
				reject(err);
			}
		}, (error) => {
			reject(error);
		}, {
			binary: true,
			animations: [],
			includeCustomExtensions: true
		});
	});
}
function exportToGLBClassic(input, skinImage) {
	return new Promise((resolve, reject) => {
		if (skinImage) createClassicGlbTexture(skinImage).then((texture) => {
			const exportGroup = new THREE.Group();
			exportGroup.name = "MinecraftHead";
			const voxelizedHead = buildBaseHead(skinImage);
			voxelizedHead.name = "HeadVoxelized";
			exportGroup.add(voxelizedHead);
			const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
			voxelizedOverlay.name = "HeadOverlayVoxelized";
			exportGroup.add(voxelizedOverlay);
			applyClassicGlbMaterials(exportGroup, texture);
			convertClassicUvsToGlbSpace(exportGroup);
			return finalizeClassicGlbExport(exportGroup);
		}).then(() => resolve()).catch(reject);
		else finalizeClassicGlbExport(input).then(() => resolve()).catch(reject);
	});
}
function createReliefGlbTexture(skinImage) {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			reject(/* @__PURE__ */ new Error("No se pudo crear el contexto 2D para la textura GLB con relieve."));
			return;
		}
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = 64;
		tempCanvas.height = 64;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);
		const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, 64, 64));
		tempCtx.putImageData(dilatedData, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
		const texture = new THREE.CanvasTexture(canvas);
		texture.name = "textura_relieve.png";
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.flipY = false;
		texture.needsUpdate = true;
		resolve(texture);
	});
}
function buildReliefGlbExportGroup(skinImage, heightmap) {
	return buildReliefExportGroup(skinImage, heightmap);
}
function applyReliefGlbMaterials(group, texture) {
	group.traverse((child) => {
		if (!(child instanceof THREE.Mesh)) return;
		const isOverlay = child.name !== "Head";
		child.material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			side: THREE.DoubleSide,
			transparent: isOverlay,
			alphaTest: isOverlay ? .1 : 0
		});
		child.material.name = isOverlay ? "OverlayMaterial" : "HeadMaterial";
	});
}
function convertReliefUvsToGlbSpace(group) {
	group.traverse((child) => {
		if (!(child instanceof THREE.Mesh) || !child.geometry) return;
		const uvAttr = child.geometry.getAttribute("uv");
		if (!uvAttr || !(uvAttr instanceof THREE.BufferAttribute)) return;
		for (let i = 0; i < uvAttr.count; i++) uvAttr.setY(i, 1 - uvAttr.getY(i));
		uvAttr.needsUpdate = true;
	});
}
function finalizeReliefGlbExport(group) {
	return new Promise((resolve, reject) => {
		new GLTFExporter().parse(group, (gltf) => {
			try {
				if (gltf instanceof ArrayBuffer) {
					downloadBlob(new Blob([gltf], { type: "application/octet-stream" }), "skinbridge_cabeza.glb");
					resolve();
				} else reject(/* @__PURE__ */ new Error("Formato de exportación inválido para GLB con relieve."));
			} catch (err) {
				reject(err);
			}
		}, (error) => {
			reject(error);
		}, {
			binary: true,
			animations: [],
			includeCustomExtensions: true
		});
	});
}
function exportToGLBWithRelief(skinImage, heightmap) {
	return new Promise((resolve, reject) => {
		createReliefGlbTexture(skinImage).then((texture) => {
			const exportGroup = buildReliefGlbExportGroup(skinImage, heightmap);
			applyReliefGlbMaterials(exportGroup, texture);
			convertReliefUvsToGlbSpace(exportGroup);
			return finalizeReliefGlbExport(exportGroup);
		}).then(() => resolve()).catch(reject);
	});
}
//#endregion
//#region src/modules/BBModelExporter.ts
/**
* BBModelExporter.ts
* Module to programmatically export the Minecraft Head as a Blockbench .bbmodel file.
*/
function generateUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0;
		return (c === "x" ? r : r & 3 | 8).toString(16);
	});
}
/**
* Converts the skin image element to a base64 encoded data URI.
*/
function getBase64Image(image) {
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, 0, 0, 64, 64);
	return canvas.toDataURL("image/png");
}
/**
* Triggers a browser download of the bbmodel content.
*/
function downloadBBModelFile(content, filename) {
	const blob = new Blob([content], { type: "application/json" });
	const link = document.createElement("a");
	link.style.display = "none";
	document.body.appendChild(link);
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
function createSinglePixelFaces(px, py) {
	const uv = [
		px,
		py,
		px + 1,
		py + 1
	];
	return {
		north: {
			uv,
			texture: 0
		},
		south: {
			uv,
			texture: 0
		},
		west: {
			uv,
			texture: 0
		},
		east: {
			uv,
			texture: 0
		},
		up: {
			uv,
			texture: 0
		},
		down: {
			uv,
			texture: 0
		}
	};
}
function buildClassicBBModel(skinImage) {
	const textureUuid = generateUUID();
	const headCubeUuid = generateUUID();
	const overlayCubeUuid = generateUUID();
	const boneUuid = generateUUID();
	return {
		meta: {
			format_version: "4.9",
			model_format: "free",
			box_uv: false
		},
		name: "cabeza_minecraft",
		model_identifier: "cabeza_minecraft",
		resolution: {
			width: 64,
			height: 64
		},
		textures: [{
			name: "skin",
			folder: "textures",
			namespace: "minecraft",
			id: "0",
			path: "",
			uuid: textureUuid,
			source: getBase64Image(skinImage)
		}],
		elements: [{
			name: "Head",
			type: "cube",
			box_uv: false,
			from: [
				-4,
				0,
				-4
			],
			to: [
				4,
				8,
				4
			],
			origin: [
				0,
				0,
				0
			],
			uuid: headCubeUuid,
			color: 0,
			locked: false,
			visibility: true,
			faces: {
				north: {
					uv: [
						8,
						8,
						16,
						16
					],
					texture: 0
				},
				south: {
					uv: [
						24,
						8,
						32,
						16
					],
					texture: 0
				},
				west: {
					uv: [
						16,
						8,
						24,
						16
					],
					texture: 0
				},
				east: {
					uv: [
						0,
						8,
						8,
						16
					],
					texture: 0
				},
				up: {
					uv: [
						16,
						8,
						8,
						0
					],
					texture: 0
				},
				down: {
					uv: [
						16,
						0,
						24,
						8
					],
					texture: 0
				}
			}
		}, {
			name: "HeadOverlay",
			type: "cube",
			box_uv: false,
			from: [
				-4.5,
				-.5,
				-4.5
			],
			to: [
				4.5,
				8.5,
				4.5
			],
			origin: [
				0,
				0,
				0
			],
			uuid: overlayCubeUuid,
			color: 5,
			locked: false,
			visibility: true,
			faces: {
				north: {
					uv: [
						40,
						8,
						48,
						16
					],
					texture: 0
				},
				south: {
					uv: [
						56,
						8,
						64,
						16
					],
					texture: 0
				},
				west: {
					uv: [
						48,
						8,
						56,
						16
					],
					texture: 0
				},
				east: {
					uv: [
						32,
						8,
						40,
						16
					],
					texture: 0
				},
				up: {
					uv: [
						48,
						8,
						40,
						0
					],
					texture: 0
				},
				down: {
					uv: [
						48,
						0,
						56,
						8
					],
					texture: 0
				}
			}
		}],
		outliner: [{
			name: "head",
			type: "group",
			origin: [
				0,
				0,
				0
			],
			color: 0,
			uuid: boneUuid,
			export: true,
			isOpen: true,
			locked: false,
			visibility: true,
			children: [headCubeUuid, overlayCubeUuid]
		}]
	};
}
function buildReliefBBModel(skinImage, heightmap) {
	const textureUuid = generateUUID();
	const headCubeUuid = generateUUID();
	const boneUuid = generateUUID();
	const overlayChildren = [];
	const base64Texture = getBase64Image(skinImage);
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("No se pudo crear el contexto 2D para BBModel.");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 64, 64);
	const imgData = ctx.getImageData(0, 0, 64, 64);
	const pixelSize = 1.125;
	const gridOffset = 3.9375;
	const thickness = .35;
	const offsets = heightmap?.offsets ?? {
		right: 4,
		left: 4,
		top: 4,
		bottom: 4,
		front: 4,
		back: 4
	};
	const faceDefs = [
		{
			key: "right",
			startX: 48,
			startY: 8,
			getBox: (col, row, pixelOffset) => ({
				center: [
					pixelOffset + thickness / 2,
					gridOffset - row * pixelSize,
					gridOffset - col * pixelSize
				],
				size: [
					thickness,
					pixelSize,
					pixelSize
				]
			})
		},
		{
			key: "left",
			startX: 32,
			startY: 8,
			getBox: (col, row, pixelOffset) => ({
				center: [
					-(pixelOffset + thickness / 2),
					gridOffset - row * pixelSize,
					-3.9375 + col * pixelSize
				],
				size: [
					thickness,
					pixelSize,
					pixelSize
				]
			})
		},
		{
			key: "top",
			startX: 40,
			startY: 0,
			getBox: (col, row, pixelOffset) => ({
				center: [
					-3.9375 + col * pixelSize,
					pixelOffset + thickness / 2,
					-3.9375 + row * pixelSize
				],
				size: [
					pixelSize,
					thickness,
					pixelSize
				]
			})
		},
		{
			key: "bottom",
			startX: 48,
			startY: 0,
			getBox: (col, row, pixelOffset) => ({
				center: [
					gridOffset - col * pixelSize,
					-(pixelOffset + thickness / 2),
					-3.9375 + row * pixelSize
				],
				size: [
					pixelSize,
					thickness,
					pixelSize
				]
			})
		},
		{
			key: "front",
			startX: 40,
			startY: 8,
			getBox: (col, row, pixelOffset) => ({
				center: [
					-3.9375 + col * pixelSize,
					gridOffset - row * pixelSize,
					pixelOffset + thickness / 2
				],
				size: [
					pixelSize,
					pixelSize,
					thickness
				]
			})
		},
		{
			key: "back",
			startX: 56,
			startY: 8,
			getBox: (col, row, pixelOffset) => ({
				center: [
					gridOffset - col * pixelSize,
					gridOffset - row * pixelSize,
					-(pixelOffset + thickness / 2)
				],
				size: [
					pixelSize,
					pixelSize,
					thickness
				]
			})
		}
	];
	const elements = [{
		name: "Head",
		type: "cube",
		box_uv: false,
		from: [
			-4,
			0,
			-4
		],
		to: [
			4,
			8,
			4
		],
		origin: [
			0,
			0,
			0
		],
		uuid: headCubeUuid,
		color: 0,
		locked: false,
		visibility: true,
		faces: {
			north: {
				uv: [
					8,
					8,
					16,
					16
				],
				texture: 0
			},
			south: {
				uv: [
					24,
					8,
					32,
					16
				],
				texture: 0
			},
			west: {
				uv: [
					16,
					8,
					24,
					16
				],
				texture: 0
			},
			east: {
				uv: [
					0,
					8,
					8,
					16
				],
				texture: 0
			},
			up: {
				uv: [
					16,
					8,
					8,
					0
				],
				texture: 0
			},
			down: {
				uv: [
					16,
					0,
					24,
					8
				],
				texture: 0
			}
		}
	}];
	for (const face of faceDefs) {
		const faceHeightmap = heightmap?.[face.key];
		const faceDefaultOffset = offsets[face.key] ?? 4;
		for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
			const px = face.startX + col;
			const py = face.startY + row;
			const idx = (py * 64 + px) * 4;
			if (imgData.data[idx + 3] <= 10) continue;
			let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
			if (heightVal === 0) heightVal = 1;
			const pixelOffset = heightVal === 3 || heightVal === 4 ? faceDefaultOffset + .175 : faceDefaultOffset;
			const { center, size } = face.getBox(col, row, pixelOffset);
			const [cx, cy, cz] = center;
			const [sx, sy, sz] = size;
			const uuid = generateUUID();
			overlayChildren.push(uuid);
			elements.push({
				name: `overlay_${face.key}_${row}_${col}`,
				type: "cube",
				box_uv: false,
				from: [
					cx - sx / 2,
					cy - sy / 2,
					cz - sz / 2
				],
				to: [
					cx + sx / 2,
					cy + sy / 2,
					cz + sz / 2
				],
				origin: [
					0,
					0,
					0
				],
				uuid,
				color: 5,
				locked: false,
				visibility: true,
				faces: createSinglePixelFaces(px, py)
			});
		}
	}
	return {
		meta: {
			format_version: "4.9",
			model_format: "free",
			box_uv: false
		},
		name: "cabeza_minecraft_relieve",
		model_identifier: "cabeza_minecraft_relieve",
		resolution: {
			width: 64,
			height: 64
		},
		textures: [{
			name: "skin",
			folder: "textures",
			namespace: "minecraft",
			id: "0",
			path: "",
			uuid: textureUuid,
			source: base64Texture
		}],
		elements,
		outliner: [{
			name: "head",
			type: "group",
			origin: [
				0,
				0,
				0
			],
			color: 0,
			uuid: boneUuid,
			export: true,
			isOpen: true,
			locked: false,
			visibility: true,
			children: [headCubeUuid, ...overlayChildren]
		}]
	};
}
/**
* Exports the Minecraft head (and overlay) as a .bbmodel JSON file.
* 
* @param skinImage The original uploaded 64x64 skin image element
*/
function exportToBBModelClassic(skinImage) {
	downloadBBModelFile(JSON.stringify(buildClassicBBModel(skinImage), null, 2), "skinbridge_cabeza.bbmodel");
}
function exportToBBModelWithRelief(skinImage, heightmap) {
	downloadBBModelFile(JSON.stringify(buildReliefBBModel(skinImage, heightmap), null, 2), "skinbridge_cabeza.bbmodel");
}
//#endregion
//#region src/modules/FBXExporter.ts
/**
* Downloads a binary buffer as a file in the browser.
*/
function downloadBinaryFile(data, filename) {
	const blob = new Blob([data.buffer], { type: "application/octet-stream" });
	const link = document.createElement("a");
	link.style.display = "none";
	document.body.appendChild(link);
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}
/**
* Exports the Three.js head model to a binary FBX file.
* Voxelizes the base head and overlay as flat planes/quads (or 3D voxel cubes if heightmap is provided) to ensure correct look in Roblox.
* Employs dilated textures scaled to 1024x1024 to prevent filtering seams.
*
* @param _input The THREE.Object3D (head group) - ignored, we rebuild voxelized geometry like OBJ.
* @param skinImage The HTMLImageElement containing the skin
* @param heightmap Optional heightmap for overlay relief
*/
function applyExportMaterials(group, texture) {
	group.traverse((child) => {
		if (!(child instanceof THREE.Mesh)) return;
		const isOverlay = child.name !== "Head";
		child.material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			side: THREE.DoubleSide,
			transparent: isOverlay,
			alphaTest: isOverlay ? .1 : 0
		});
		child.material.name = isOverlay ? "OverlayMaterial" : "HeadMaterial";
	});
}
function exportToFBXClassic(skinImage) {
	return new Promise((resolve, reject) => {
		try {
			const canvas = document.createElement("canvas");
			canvas.width = 1024;
			canvas.height = 1024;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(/* @__PURE__ */ new Error("No se pudo crear el contexto 2D para la textura."));
				return;
			}
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = 64;
			tempCanvas.height = 64;
			const tempCtx = tempCanvas.getContext("2d");
			tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);
			const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, 64, 64));
			tempCtx.putImageData(dilatedData, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
			const skinDataUrl = canvas.toDataURL("image/png");
			const img = new Image();
			img.onload = () => {
				try {
					const texture = new THREE.Texture(img);
					texture.name = "textura.png";
					texture.minFilter = THREE.NearestFilter;
					texture.magFilter = THREE.NearestFilter;
					texture.generateMipmaps = false;
					texture.colorSpace = THREE.SRGBColorSpace;
					texture.sourceFile = "textura.png";
					texture.needsUpdate = true;
					const exportGroup = new THREE.Group();
					exportGroup.name = "MinecraftHead";
					const voxelizedHead = buildBaseHead(skinImage);
					voxelizedHead.name = "HeadVoxelized";
					voxelizedHead.traverse((child) => {
						if (child instanceof THREE.Mesh) {
							child.material = new THREE.MeshStandardMaterial({
								map: texture,
								roughness: .6,
								metalness: .1,
								side: THREE.DoubleSide
							});
							child.material.name = "HeadMaterial";
						}
					});
					exportGroup.add(voxelizedHead);
					const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
					voxelizedOverlay.name = "HeadOverlayVoxelized";
					voxelizedOverlay.traverse((child) => {
						if (child instanceof THREE.Mesh) {
							child.material = new THREE.MeshStandardMaterial({
								map: texture,
								roughness: .6,
								metalness: .1,
								side: THREE.DoubleSide,
								transparent: true,
								alphaTest: .1
							});
							child.material.name = "OverlayMaterial";
						}
					});
					exportGroup.add(voxelizedOverlay);
					downloadBinaryFile(exportFbx(exportGroup, {
						format: "binary",
						target: "blender",
						embedTextures: true,
						onWarning: (warning) => {
							console.warn("[FBX Export Warning]", warning.message || warning.code);
						}
					}), "skinbridge_cabeza.fbx");
					resolve();
				} catch (exportError) {
					reject(exportError);
				}
			};
			img.onerror = () => {
				reject(/* @__PURE__ */ new Error("No se pudo cargar la imagen de la textura escalada."));
			};
			img.src = skinDataUrl;
		} catch (error) {
			reject(error);
		}
	});
}
function exportToFBXWithRelief(skinImage, heightmap) {
	return new Promise((resolve, reject) => {
		try {
			const canvas = document.createElement("canvas");
			canvas.width = 1024;
			canvas.height = 1024;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(/* @__PURE__ */ new Error("No se pudo crear el contexto 2D para la textura."));
				return;
			}
			const tempCanvas = document.createElement("canvas");
			tempCanvas.width = 64;
			tempCanvas.height = 64;
			const tempCtx = tempCanvas.getContext("2d");
			tempCtx.drawImage(skinImage, 0, 0, 64, 64, 0, 0, 64, 64);
			const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, 64, 64));
			tempCtx.putImageData(dilatedData, 0, 0);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
			const skinDataUrl = canvas.toDataURL("image/png");
			const img = new Image();
			img.onload = () => {
				try {
					const texture = new THREE.Texture(img);
					texture.name = "textura.png";
					texture.minFilter = THREE.NearestFilter;
					texture.magFilter = THREE.NearestFilter;
					texture.generateMipmaps = false;
					texture.colorSpace = THREE.SRGBColorSpace;
					texture.sourceFile = "textura.png";
					texture.needsUpdate = true;
					const exportGroup = buildReliefExportGroup(skinImage, heightmap);
					applyExportMaterials(exportGroup, texture);
					downloadBinaryFile(exportFbx(exportGroup, {
						format: "binary",
						target: "blender",
						embedTextures: true,
						onWarning: (warning) => {
							console.warn("[FBX Export Warning]", warning.message || warning.code);
						}
					}), "skinbridge_cabeza.fbx");
					resolve();
				} catch (exportError) {
					reject(exportError);
				}
			};
			img.onerror = () => {
				reject(/* @__PURE__ */ new Error("No se pudo cargar la imagen de la textura escalada."));
			};
			img.src = skinDataUrl;
		} catch (error) {
			reject(error);
		}
	});
}
//#endregion
//#region src/hooks/useShareHead3d.ts
function useShareHead3d() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [shareUrl, setShareUrl] = useState(null);
	const [minutesLeft, setMinutesLeft] = useState(null);
	const share = async (previewCanvas, skinSrc, extractedFaces, creatorName, description) => {
		setLoading(true);
		setError(null);
		setShareUrl(null);
		setMinutesLeft(null);
		try {
			if (!skinSrc || !extractedFaces) throw new Error("Skin source and face textures are required.");
			await checkRateLimit("head3d");
			const slug = nanoid(10);
			const skinBlob = await dataUrlToBlob(skinSrc);
			const { error: skinUploadErr } = await supabase.storage.from("conversions").upload(`head3d/${slug}/skin.png`, skinBlob, { contentType: "image/png" });
			if (skinUploadErr) throw skinUploadErr;
			const previewBlob = await getPreviewBlob(previewCanvas);
			const { error: previewUploadErr } = await supabase.storage.from("conversions").upload(`head3d/${slug}/preview.png`, previewBlob, { contentType: "image/png" });
			if (previewUploadErr) throw previewUploadErr;
			const faceUrls = {
				head: {},
				overlay: {}
			};
			for (const [key, face] of Object.entries(extractedFaces.head)) {
				const faceBlob = await dataUrlToBlob(face.dataUrl);
				const path = `head3d/${slug}/faces/head/${key}.png`;
				const { error: uploadErr } = await supabase.storage.from("conversions").upload(path, faceBlob, { contentType: "image/png" });
				if (uploadErr) throw uploadErr;
				const { data } = supabase.storage.from("conversions").getPublicUrl(path);
				faceUrls.head[key] = data.publicUrl;
			}
			for (const [key, face] of Object.entries(extractedFaces.overlay)) {
				const faceBlob = await dataUrlToBlob(face.dataUrl);
				const path = `head3d/${slug}/faces/overlay/${key}.png`;
				const { error: uploadErr } = await supabase.storage.from("conversions").upload(path, faceBlob, { contentType: "image/png" });
				if (uploadErr) throw uploadErr;
				const { data } = supabase.storage.from("conversions").getPublicUrl(path);
				faceUrls.overlay[key] = data.publicUrl;
			}
			const { data: skinUrlData } = supabase.storage.from("conversions").getPublicUrl(`head3d/${slug}/skin.png`);
			const { data: previewUrlData } = supabase.storage.from("conversions").getPublicUrl(`head3d/${slug}/preview.png`);
			const { error: dbErr } = await supabase.from("shares_head3d").insert({
				slug,
				preview_url: previewUrlData.publicUrl,
				skin_url: skinUrlData.publicUrl,
				face_urls: faceUrls,
				creator_name: creatorName || null,
				description: description || null
			});
			if (dbErr) throw dbErr;
			const generatedUrl = `${window.location.origin}/share/head3d/${slug}`;
			setShareUrl(generatedUrl);
			return generatedUrl;
		} catch (err) {
			console.error("Error during Head3D share:", err);
			if (err instanceof RateLimitError) {
				setMinutesLeft(err.minutesLeft);
				setError(err.message);
			} else setError(err instanceof Error ? err.message : "An unexpected error occurred while sharing.");
			throw err;
		} finally {
			setLoading(false);
		}
	};
	return {
		shareUrl,
		loading,
		error,
		minutesLeft,
		share
	};
}
function canvasToBlob(canvas) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(/* @__PURE__ */ new Error("Failed to capture canvas image"));
		}, "image/png");
	});
}
async function dataUrlToBlob(dataUrl) {
	if (dataUrl.startsWith("data:")) try {
		const parts = dataUrl.split(",");
		const mimeMatch = parts[0].match(/:(.*?);/);
		const mime = mimeMatch ? mimeMatch[1] : "image/png";
		const isBase64 = parts[0].indexOf("base64") >= 0;
		const dataStr = parts[1];
		if (isBase64) {
			const bstr = atob(dataStr);
			let n = bstr.length;
			const u8arr = new Uint8Array(n);
			while (n--) u8arr[n] = bstr.charCodeAt(n);
			return new Blob([u8arr], { type: mime });
		} else return new Blob([decodeURIComponent(dataStr)], { type: mime });
	} catch (e) {
		console.warn("Failed to parse data URL synchronously, falling back to fetch:", e);
	}
	return await (await fetch(dataUrl)).blob();
}
async function getPreviewBlob(previewCanvas) {
	if (previewCanvas) try {
		return await canvasToBlob(previewCanvas);
	} catch (e) {
		console.warn("Failed to convert preview canvas to blob:", e);
	}
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	return new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob), "image/png");
	});
}
//#endregion
//#region src/components/Head3DWorkspace.tsx
/**
* Minecraft skin face layout (pixel coordinates on a 64×64 sheet).
* baseX/Y = top-left of the base (inner) layer.
* overlayX/Y = top-left of the overlay (outer) layer.
*/
var FACE_LAYOUT = [
	{
		key: "right",
		baseX: 16,
		baseY: 8,
		overlayX: 48,
		overlayY: 8
	},
	{
		key: "left",
		baseX: 0,
		baseY: 8,
		overlayX: 32,
		overlayY: 8
	},
	{
		key: "top",
		baseX: 8,
		baseY: 0,
		overlayX: 40,
		overlayY: 0
	},
	{
		key: "bottom",
		baseX: 16,
		baseY: 0,
		overlayX: 48,
		overlayY: 0
	},
	{
		key: "front",
		baseX: 8,
		baseY: 8,
		overlayX: 40,
		overlayY: 8
	},
	{
		key: "back",
		baseX: 24,
		baseY: 8,
		overlayX: 56,
		overlayY: 8
	}
];
/**
* Reads an 8×8 block of RGBA pixels from the skin image at (originX, originY).
* Assumes the image is 64×64 (or a multiple thereof).
*/
function readBlock(ctx, originX, originY, scale) {
	const rows = [];
	for (let r = 0; r < 8; r++) {
		const rowData = new Uint8ClampedArray(32);
		for (let c = 0; c < 8; c++) {
			const px = Math.floor(originX * scale + c * scale);
			const py = Math.floor(originY * scale + r * scale);
			const d = ctx.getImageData(px, py, 1, 1).data;
			rowData[c * 4] = d[0];
			rowData[c * 4 + 1] = d[1];
			rowData[c * 4 + 2] = d[2];
			rowData[c * 4 + 3] = d[3];
		}
		rows.push(rowData);
	}
	return rows;
}
/**
* Algorithmic heightmap generator.
*
* For each overlay pixel:
*   alpha < 10  → 0 (transparent / empty — no voxel)
*   alpha ≥ 10  → 1 (flush relief — same height as base, no gap)
*
* All opaque overlay pixels produce uniform flush relief.
* The Corner Alignment Pass below ensures seamless seams at the 4 vertical corners.
*/
function generateAlgorithmicHeightmap(skinImg) {
	const canvas = document.createElement("canvas");
	canvas.width = skinImg.naturalWidth || skinImg.width;
	canvas.height = skinImg.naturalHeight || skinImg.height;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	ctx.drawImage(skinImg, 0, 0);
	const scale = canvas.width / 64;
	const ALPHA_THRESHOLD = 10;
	const result = {
		offsets: {},
		right: [],
		left: [],
		top: [],
		bottom: [],
		front: [],
		back: []
	};
	for (const faceDef of FACE_LAYOUT) {
		const overlayRows = readBlock(ctx, faceDef.overlayX, faceDef.overlayY, scale);
		result.offsets[faceDef.key] = 4;
		const matrix = [];
		for (let r = 0; r < 8; r++) {
			const row = [];
			for (let c = 0; c < 8; c++) {
				const alpha = overlayRows[r][c * 4 + 3];
				row.push(alpha >= ALPHA_THRESHOLD ? 1 : 0);
			}
			matrix.push(row);
		}
		result[faceDef.key] = matrix;
	}
	const fM = result.front, lM = result.left, rM = result.right, bM = result.back;
	if (fM.length === 8 && lM.length === 8 && rM.length === 8 && bM.length === 8) for (let row = 0; row < 8; row++) {
		const maxFL = Math.max(fM[row][0], lM[row][7]);
		fM[row][0] = maxFL;
		lM[row][7] = maxFL;
		const maxFR = Math.max(fM[row][7], rM[row][0]);
		fM[row][7] = maxFR;
		rM[row][0] = maxFR;
		const maxBR = Math.max(bM[row][0], rM[row][7]);
		bM[row][0] = maxBR;
		rM[row][7] = maxBR;
		const maxBL = Math.max(bM[row][7], lM[row][0]);
		bM[row][7] = maxBL;
		lM[row][0] = maxBL;
	}
	return result;
}
function Head3DWorkspace({ skinImage, skinSrc, extractedFaces, fileInputRef, handleFileChange, dragActive, handleDrag, handleDrop, triggerUploadClick, showToast, logExport }) {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState("head");
	const [showGrid, setShowGrid] = useState(true);
	const [autoRotate, setAutoRotate] = useState(false);
	const { share: shareHead3d, minutesLeft } = useShareHead3d();
	const [showShareModal, setShowShareModal] = useState(false);
	const [shareLoading, setShareLoading] = useState(false);
	const [shareError, setShareError] = useState(null);
	const [shareUrl, setShareUrl] = useState(null);
	const [copied, setCopied] = useState(false);
	const [creatorName, setCreatorName] = useState("");
	const [description, setDescription] = useState("");
	const [puzzleA, setPuzzleA] = useState(0);
	const [puzzleB, setPuzzleB] = useState(0);
	const [puzzleAnswer, setPuzzleAnswer] = useState("");
	const [captchaError, setCaptchaError] = useState(false);
	const [heightmap, setHeightmap] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("custom_heightmap");
			if (saved) try {
				return JSON.parse(saved);
			} catch {
				return null;
			}
		}
		return null;
	});
	const [useRelief, setUseRelief] = useState(false);
	const [reliefLoading, setReliefLoading] = useState(false);
	const handleHeightmapChange = (map) => {
		setHeightmap(map);
		if (typeof window !== "undefined") if (map) localStorage.setItem("custom_heightmap", JSON.stringify(map));
		else localStorage.removeItem("custom_heightmap");
	};
	/** Generates the overlay heightmap using the deterministic pixel algorithm. */
	const handleGenerateRelief = async () => {
		if (!skinImage) {
			showToast("error", t("toast_load_skin_first"));
			return;
		}
		setReliefLoading(true);
		try {
			await new Promise((r) => setTimeout(r, 20));
			handleHeightmapChange(generateAlgorithmicHeightmap(skinImage));
			setUseRelief(true);
			showToast("success", t("toast_relief_success"));
		} catch (err) {
			console.error(err);
			showToast("error", t("toast_relief_error", { error: err.message || err }));
		} finally {
			setReliefLoading(false);
		}
	};
	const generatePuzzle = () => {
		setPuzzleA(Math.floor(Math.random() * 8) + 2);
		setPuzzleB(Math.floor(Math.random() * 8) + 2);
		setPuzzleAnswer("");
	};
	const handleShareClick = () => {
		setShowShareModal(true);
		setShareUrl(null);
		setShareError(null);
		setShareLoading(false);
		setCreatorName("");
		setDescription("");
		setCaptchaError(false);
		generatePuzzle();
	};
	const handleConfirmShare = async () => {
		const expected = puzzleA + puzzleB;
		if (parseInt(puzzleAnswer, 10) !== expected) {
			setCaptchaError(true);
			generatePuzzle();
			return;
		}
		setCaptchaError(false);
		setShareLoading(true);
		setShareError(null);
		try {
			let previewCanvas = null;
			if (viewerRef.current) {
				viewerRef.current.renderOnce();
				previewCanvas = viewerRef.current.getCanvas();
			}
			const url = await shareHead3d(previewCanvas, skinSrc, extractedFaces, creatorName, description);
			setShareUrl(url);
			const historyStr = localStorage.getItem("shared_history") || "[]";
			const history = JSON.parse(historyStr);
			let previewUrl = "";
			if (previewCanvas) previewUrl = previewCanvas.toDataURL("image/png");
			const newHistoryItem = {
				slug: url.split("/").pop() || "",
				type: "head3d",
				creatorName: creatorName.trim() || "Anonymous",
				description: description.trim() || "",
				previewUrl,
				createdAt: Date.now(),
				skinUrl: skinSrc
			};
			localStorage.setItem("shared_history", JSON.stringify([newHistoryItem, ...history]));
			window.dispatchEvent(new Event("storage"));
		} catch (err) {
			setShareError(err.message || "Error occurred while sharing");
		} finally {
			setShareLoading(false);
		}
	};
	const handleCopyLink = () => {
		if (shareUrl) {
			navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		}
	};
	const containerRef = useRef(null);
	const viewerRef = useRef(null);
	useEffect(() => {
		setHeightmap(null);
		setUseRelief(false);
		if (typeof window !== "undefined") localStorage.removeItem("custom_heightmap");
	}, [skinImage]);
	useEffect(() => {
		if (containerRef.current && !viewerRef.current) {
			const viewer = new ThreeViewer(containerRef.current);
			viewerRef.current = viewer;
			viewer.setGridY(-5);
		}
		if (viewerRef.current) {
			viewerRef.current.autoRotate = autoRotate;
			viewerRef.current.setGridVisible(showGrid);
			if (skinImage) {
				const headGroup = build3DHead(skinImage, useRelief && heightmap ? heightmap : void 0);
				viewerRef.current.setHeadModel(headGroup);
			}
		}
		return () => {
			if (viewerRef.current) {
				viewerRef.current.destroy();
				viewerRef.current = null;
			}
		};
	}, [
		skinImage,
		autoRotate,
		showGrid,
		useRelief,
		heightmap
	]);
	const handleExportOBJ = async () => {
		if (!skinImage) {
			showToast("error", t("toast_load_skin_first"));
			return;
		}
		try {
			if (useRelief && heightmap) await exportToOBJWithRelief(skinImage, heightmap);
			else await exportToOBJClassic(skinImage);
			showToast("success", t("toast_obj_success"));
			logExport("OBJ", "skinbridge_cabeza.obj");
		} catch (err) {
			showToast("error", t("toast_obj_error", { error: err.message }));
		}
	};
	const handleExportFBX = async () => {
		if (!skinImage) {
			showToast("error", t("toast_load_skin_first"));
			return;
		}
		try {
			if (useRelief && heightmap) await exportToFBXWithRelief(skinImage, heightmap);
			else await exportToFBXClassic(skinImage);
			showToast("success", t("toast_fbx_success"));
			logExport("FBX", "skinbridge_cabeza.fbx");
		} catch (err) {
			showToast("error", t("toast_fbx_error", { error: err.message }));
		}
	};
	const handleExportGLB = async () => {
		if (!viewerRef.current) return;
		const headModel = viewerRef.current.getHeadModel();
		if (!headModel) {
			showToast("error", t("toast_no_3d_model"));
			return;
		}
		try {
			if (skinImage && useRelief && heightmap) await exportToGLBWithRelief(skinImage, heightmap);
			else await exportToGLBClassic(headModel, skinImage || void 0);
			showToast("success", t("toast_glb_success"));
			logExport("GLB", "skinbridge_cabeza.glb");
		} catch (err) {
			showToast("error", t("toast_glb_error", { error: err.message }));
		}
	};
	const handleExportBBModel = () => {
		if (!skinImage) {
			showToast("error", t("toast_bbmodel_load_skin"));
			return;
		}
		try {
			if (useRelief && heightmap) exportToBBModelWithRelief(skinImage, heightmap);
			else exportToBBModelClassic(skinImage);
			showToast("success", t("toast_bbmodel_success"));
			logExport("BBMODEL", "skinbridge_cabeza.bbmodel");
		} catch (err) {
			showToast("error", t("toast_bbmodel_error", { error: err.message }));
		}
	};
	const currentFaces = (activeTab === "head" || activeTab === "overlay") && extractedFaces ? extractedFaces[activeTab] : null;
	return /* @__PURE__ */ jsxs("main", {
		className: "main-grid",
		children: [
			/* @__PURE__ */ jsxs(Head, { children: [
				/* @__PURE__ */ jsx("title", { children: "Minecraft Skin 3D Head Viewer & Exporter | SkinBridge" }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: "View your Minecraft skin as an interactive 3D head model. Export all 6 face textures (top, bottom, left, right, front, back) from your skin online."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: "Minecraft Skin 3D Head Viewer & Exporter"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: "View your Minecraft skin as an interactive 3D head model and export all face textures online."
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: "https://skinbridge.vercel.app/head3d"
				})
			] }),
			/* @__PURE__ */ jsxs("section", {
				className: "glass-panel sidebar-panel",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("h2", {
							style: {
								margin: "0 0 4px 0",
								fontSize: "1.2rem",
								fontWeight: 700
							},
							children: t("upload_title")
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: "0 0 16px 0",
								fontSize: "0.85rem",
								color: "#a1a1aa"
							},
							children: t("upload_desc")
						}),
						/* @__PURE__ */ jsx("input", {
							ref: fileInputRef,
							type: "file",
							accept: ".png",
							style: { display: "none" },
							onChange: handleFileChange
						}),
						/* @__PURE__ */ jsxs("div", {
							className: `upload-area ${dragActive ? "drag-active" : ""}`,
							onDragEnter: handleDrag,
							onDragOver: handleDrag,
							onDragLeave: handleDrag,
							onDrop: handleDrop,
							onClick: triggerUploadClick,
							children: [
								/* @__PURE__ */ jsx(Upload, {
									size: 36,
									style: {
										color: "#818cf8",
										marginBottom: "8px"
									}
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: "0 0 4px 0",
										fontSize: "0.9rem",
										fontWeight: 600
									},
									children: t("upload_btn")
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.75rem",
										color: "#71717a"
									},
									children: t("upload_format_hint")
								})
							]
						})
					] }),
					skinSrc && /* @__PURE__ */ jsxs("div", {
						className: "skin-preview-section",
						children: [/* @__PURE__ */ jsx("h3", {
							style: {
								margin: "0 0 4px 0",
								fontSize: "1rem",
								fontWeight: 600
							},
							children: t("skin_original")
						}), /* @__PURE__ */ jsx("div", {
							className: "skin-canvas-container",
							children: /* @__PURE__ */ jsx("img", {
								src: skinSrc,
								alt: "Minecraft Skin Preview",
								className: "skin-preview-img"
							})
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [
						/* @__PURE__ */ jsx("h3", {
							style: {
								margin: "0 0 12px 0",
								fontSize: "1rem",
								fontWeight: 600
							},
							children: t("extracted_faces")
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "tabs-container",
							children: [/* @__PURE__ */ jsx("button", {
								className: `tab-btn ${activeTab === "head" ? "active" : ""}`,
								onClick: () => setActiveTab("head"),
								children: t("tab_base_layer")
							}), /* @__PURE__ */ jsx("button", {
								className: `tab-btn ${activeTab === "overlay" ? "active" : ""}`,
								onClick: () => setActiveTab("overlay"),
								children: t("tab_outer_layer")
							})]
						}),
						currentFaces && /* @__PURE__ */ jsx("div", {
							className: "faces-grid",
							children: Object.entries(currentFaces).map(([key, face]) => /* @__PURE__ */ jsxs("div", {
								className: "face-card",
								children: [
									/* @__PURE__ */ jsx("div", {
										className: "face-img-container",
										children: /* @__PURE__ */ jsx("img", {
											src: face.dataUrl,
											alt: face.name,
											className: "face-img"
										})
									}),
									/* @__PURE__ */ jsx("span", {
										className: "face-label",
										children: face.name.split(" ")[0]
									}),
									/* @__PURE__ */ jsxs("span", {
										className: "face-coords",
										children: [
											"x:",
											face.x,
											" y:",
											face.y
										]
									})
								]
							}, key))
						})
					] }),
					skinImage && /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: "20px",
							display: "flex",
							flexDirection: "column",
							gap: "12px"
						},
						children: [
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "0.75rem",
									color: "#a1a1aa",
									lineHeight: "1.4"
								},
								children: t("relief_description")
							}),
							/* @__PURE__ */ jsx("button", {
								className: "glow-btn",
								onClick: handleGenerateRelief,
								disabled: reliefLoading,
								style: {
									padding: "8px 12px",
									fontSize: "0.8rem",
									fontWeight: 600,
									width: "100%",
									justifyContent: "center"
								},
								children: reliefLoading ? t("btn_generating_relief") : t("btn_generate_relief")
							}),
							heightmap && /* @__PURE__ */ jsxs("label", {
								className: "toggle-container",
								style: { marginTop: "4px" },
								children: [
									/* @__PURE__ */ jsx("input", {
										type: "checkbox",
										checked: useRelief,
										onChange: (e) => setUseRelief(e.target.checked),
										style: { display: "none" }
									}),
									/* @__PURE__ */ jsx("span", { className: "checkbox-custom" }),
									/* @__PURE__ */ jsx("span", {
										style: { fontSize: "0.8rem" },
										children: t("toggle_relief_label")
									})
								]
							}),
							heightmap && useRelief && heightmap.offsets && /* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(3, 1fr)",
									gap: "6px",
									padding: "10px",
									borderRadius: "6px",
									backgroundColor: "rgba(0,0,0,0.2)",
									border: "1px solid rgba(255,255,255,0.05)"
								},
								children: Object.entries(heightmap.offsets).map(([face, val]) => {
									const faceMatrix = heightmap[face];
									const hasFloating = faceMatrix ? faceMatrix.some((row) => row.some((v) => v === 3)) : false;
									const isFloating = val > 4 || hasFloating;
									return /* @__PURE__ */ jsxs("div", {
										style: {
											padding: "4px 6px",
											borderRadius: "4px",
											backgroundColor: "rgba(255,255,255,0.02)",
											border: "1px solid rgba(255,255,255,0.05)",
											fontSize: "0.7rem",
											color: "#a1a1aa",
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											justifyContent: "center"
										},
										children: [/* @__PURE__ */ jsx("span", {
											style: {
												textTransform: "capitalize",
												fontWeight: "bold",
												color: "#e4e4e7",
												marginBottom: "2px"
											},
											children: t(`face_${face}`) || face
										}), /* @__PURE__ */ jsx("span", {
											style: {
												color: isFloating ? "#38bdf8" : "#a1a1aa",
												fontWeight: isFloating ? "bold" : "normal"
											},
											children: isFloating ? t("offset_gap") : t("offset_flush")
										})]
									}, face);
								})
							}),
							/* @__PURE__ */ jsx("p", {
								style: {
									margin: 0,
									fontSize: "0.7rem",
									color: "#71717a",
									lineHeight: "1.3"
								},
								children: t("relief_export_note")
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "glass-panel viewer-panel",
				children: [/* @__PURE__ */ jsx("div", {
					ref: containerRef,
					className: "viewer-canvas-container"
				}), /* @__PURE__ */ jsxs("div", {
					className: "viewer-toolbar",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "toolbar-controls",
						children: [/* @__PURE__ */ jsxs("label", {
							className: "toggle-container",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: showGrid,
									onChange: (e) => setShowGrid(e.target.checked),
									style: { display: "none" }
								}),
								/* @__PURE__ */ jsx("span", { className: "checkbox-custom" }),
								/* @__PURE__ */ jsxs("span", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "4px"
									},
									children: [
										/* @__PURE__ */ jsx(Grid, { size: 16 }),
										" ",
										t("opt_grid")
									]
								})
							]
						}), /* @__PURE__ */ jsxs("label", {
							className: "toggle-container",
							children: [
								/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									checked: autoRotate,
									onChange: (e) => setAutoRotate(e.target.checked),
									style: { display: "none" }
								}),
								/* @__PURE__ */ jsx("span", { className: "checkbox-custom" }),
								/* @__PURE__ */ jsxs("span", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "4px"
									},
									children: [
										/* @__PURE__ */ jsx(RotateCw, { size: 16 }),
										" ",
										t("opt_rotate")
									]
								})
							]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "viewer-actions",
						children: [
							/* @__PURE__ */ jsxs("button", {
								className: "glow-btn-secondary",
								onClick: handleExportOBJ,
								children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " OBJ"]
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "glow-btn-secondary",
								onClick: handleExportFBX,
								children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " FBX"]
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "glow-btn-secondary",
								onClick: handleExportGLB,
								children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " GLB"]
							}),
							/* @__PURE__ */ jsxs("button", {
								className: "glow-btn",
								onClick: handleExportBBModel,
								children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " BBMODEL"]
							}),
							skinImage && /* @__PURE__ */ jsxs("button", {
								className: "glow-btn-secondary",
								onClick: handleShareClick,
								style: {
									display: "flex",
									alignItems: "center",
									gap: "6px"
								},
								children: [/* @__PURE__ */ jsxs("svg", {
									viewBox: "0 0 24 24",
									width: "16",
									height: "16",
									stroke: "currentColor",
									strokeWidth: "2",
									fill: "none",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									children: [
										/* @__PURE__ */ jsx("circle", {
											cx: "18",
											cy: "5",
											r: "3"
										}),
										/* @__PURE__ */ jsx("circle", {
											cx: "6",
											cy: "12",
											r: "3"
										}),
										/* @__PURE__ */ jsx("circle", {
											cx: "18",
											cy: "19",
											r: "3"
										}),
										/* @__PURE__ */ jsx("line", {
											x1: "8.59",
											y1: "13.51",
											x2: "15.42",
											y2: "17.49"
										}),
										/* @__PURE__ */ jsx("line", {
											x1: "15.41",
											y1: "6.51",
											x2: "8.59",
											y2: "10.49"
										})
									]
								}), t("btn_share_workspace")]
							})
						]
					})]
				})]
			}),
			showShareModal && /* @__PURE__ */ jsx("div", {
				className: "modal-overlay",
				style: {
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0, 0, 0, 0.7)",
					backdropFilter: "blur(8px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: 1e3
				},
				children: /* @__PURE__ */ jsxs("div", {
					className: "glass-panel",
					style: {
						padding: "28px",
						maxWidth: "450px",
						width: "90%",
						display: "flex",
						flexDirection: "column",
						gap: "20px",
						border: "2px solid rgba(255, 255, 255, 0.05)",
						boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
					},
					children: [
						/* @__PURE__ */ jsx("h3", {
							style: {
								margin: 0,
								fontSize: "1.25rem",
								fontWeight: 700,
								color: "#f3f4f6"
							},
							children: t("share_title")
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								fontSize: "0.9rem",
								color: "#9ca3af",
								lineHeight: "1.5"
							},
							children: t("share_desc")
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								fontSize: "0.8rem",
								color: "#fca5a5",
								backgroundColor: "rgba(239, 68, 68, 0.08)",
								border: "1px solid rgba(239, 68, 68, 0.15)",
								padding: "10px 12px",
								borderRadius: "8px",
								lineHeight: "1.4"
							},
							children: ["⚠️ ", t("share_disclaimer")]
						}),
						shareLoading ? /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "12px",
								padding: "20px 0"
							},
							children: [/* @__PURE__ */ jsx("div", { style: {
								width: "32px",
								height: "32px",
								borderRadius: "50%",
								border: "3px solid rgba(129, 140, 248, 0.2)",
								borderTopColor: "#818cf8",
								animation: "spin 1s linear infinite"
							} }), /* @__PURE__ */ jsx("span", {
								style: {
									fontSize: "0.85rem",
									color: "#a1a1aa"
								},
								children: t("share_uploading")
							})]
						}) : shareError ? /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "12px"
							},
							children: [/* @__PURE__ */ jsx("div", {
								style: {
									padding: "12px",
									backgroundColor: "rgba(239, 68, 68, 0.1)",
									borderRadius: "8px",
									border: "1px solid rgba(239, 68, 68, 0.2)",
									color: "#f87171",
									fontSize: "0.85rem"
								},
								children: shareError
							}), /* @__PURE__ */ jsx("button", {
								className: "glow-btn-secondary",
								style: { padding: "10px" },
								onClick: () => setShowShareModal(false),
								children: t("btn_close")
							})]
						}) : shareUrl ? /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "12px"
							},
							children: [/* @__PURE__ */ jsx("div", {
								style: {
									display: "flex",
									gap: "8px",
									background: "rgba(255,255,255,0.03)",
									padding: "8px 12px",
									borderRadius: "8px",
									border: "1px solid rgba(255,255,255,0.08)"
								},
								children: /* @__PURE__ */ jsx("input", {
									type: "text",
									readOnly: true,
									value: shareUrl,
									style: {
										background: "transparent",
										border: "none",
										color: "#e5e7eb",
										fontSize: "0.85rem",
										width: "100%",
										outline: "none"
									}
								})
							}), /* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									gap: "10px"
								},
								children: [/* @__PURE__ */ jsx("button", {
									className: "glow-btn",
									style: {
										flex: 1,
										padding: "10px"
									},
									onClick: handleCopyLink,
									children: copied ? t("share_copied") : t("share_copy_link")
								}), /* @__PURE__ */ jsx("button", {
									className: "glow-btn-secondary",
									style: { padding: "10px" },
									onClick: () => setShowShareModal(false),
									children: t("btn_close")
								})]
							})]
						}) : null,
						!shareLoading && !shareUrl && !shareError && /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "16px"
							},
							children: [
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										flexDirection: "column",
										gap: "6px"
									},
									children: [/* @__PURE__ */ jsx("label", {
										style: {
											fontSize: "0.85rem",
											fontWeight: 600,
											color: "#a1a1aa"
										},
										children: t("share_lbl_name")
									}), /* @__PURE__ */ jsx("input", {
										type: "text",
										maxLength: 32,
										value: creatorName,
										onChange: (e) => setCreatorName(e.target.value),
										placeholder: t("share_ph_name"),
										style: {
											background: "rgba(255, 255, 255, 0.03)",
											border: "1px solid rgba(255, 255, 255, 0.08)",
											borderRadius: "6px",
											padding: "8px 12px",
											color: "#f3f4f6",
											fontSize: "0.9rem",
											outline: "none"
										}
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										flexDirection: "column",
										gap: "6px"
									},
									children: [/* @__PURE__ */ jsx("label", {
										style: {
											fontSize: "0.85rem",
											fontWeight: 600,
											color: "#a1a1aa"
										},
										children: t("share_lbl_desc")
									}), /* @__PURE__ */ jsx("textarea", {
										maxLength: 200,
										rows: 3,
										value: description,
										onChange: (e) => setDescription(e.target.value),
										placeholder: t("share_ph_desc"),
										style: {
											background: "rgba(255, 255, 255, 0.03)",
											border: "1px solid rgba(255, 255, 255, 0.08)",
											borderRadius: "6px",
											padding: "8px 12px",
											color: "#f3f4f6",
											fontSize: "0.9rem",
											outline: "none",
											resize: "none"
										}
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										flexDirection: "column",
										gap: "6px",
										background: "rgba(99, 102, 241, 0.05)",
										padding: "12px",
										borderRadius: "8px",
										border: "1px solid rgba(99, 102, 241, 0.1)"
									},
									children: [
										/* @__PURE__ */ jsxs("label", {
											style: {
												fontSize: "0.85rem",
												fontWeight: 600,
												color: "#a5b4fc",
												display: "flex",
												alignItems: "center",
												gap: "4px"
											},
											children: [/* @__PURE__ */ jsxs("svg", {
												viewBox: "0 0 24 24",
												width: "14",
												height: "14",
												stroke: "currentColor",
												strokeWidth: "2.5",
												fill: "none",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												style: { display: "inline" },
												children: [/* @__PURE__ */ jsx("rect", {
													x: "3",
													y: "11",
													width: "18",
													height: "11",
													rx: "2",
													ry: "2"
												}), /* @__PURE__ */ jsx("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })]
											}), t("share_lbl_puzzle")]
										}),
										/* @__PURE__ */ jsx("span", {
											style: {
												fontSize: "0.85rem",
												color: "#d1d5db",
												margin: "4px 0"
											},
											children: t("share_puzzle_solve").replace("{a}", puzzleA.toString()).replace("{b}", puzzleB.toString())
										}),
										/* @__PURE__ */ jsx("input", {
											type: "number",
											value: puzzleAnswer,
											onChange: (e) => setPuzzleAnswer(e.target.value),
											placeholder: t("share_puzzle_ph"),
											style: {
												background: "rgba(255, 255, 255, 0.03)",
												border: "1px solid rgba(255, 255, 255, 0.08)",
												borderRadius: "6px",
												padding: "8px 12px",
												color: "#f3f4f6",
												fontSize: "0.9rem",
												outline: "none"
											}
										}),
										captchaError && /* @__PURE__ */ jsx("span", {
											style: {
												fontSize: "0.8rem",
												color: "#f87171",
												fontWeight: 600,
												marginTop: "4px"
											},
											children: t("share_err_puzzle")
										})
									]
								}),
								minutesLeft !== null && minutesLeft > 0 && /* @__PURE__ */ jsxs("p", {
									style: {
										color: "#f87171",
										fontSize: "0.85rem",
										textAlign: "center",
										margin: "4px 0 0 0"
									},
									children: [
										"Too many shares. Please wait ",
										minutesLeft,
										" minute",
										minutesLeft !== 1 ? "s" : "",
										"."
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										gap: "10px",
										marginTop: "8px"
									},
									children: [/* @__PURE__ */ jsx("button", {
										className: "glow-btn",
										style: {
											flex: 1,
											padding: "10px"
										},
										onClick: handleConfirmShare,
										disabled: minutesLeft !== null && minutesLeft > 0 || !puzzleAnswer,
										children: t("share_btn_confirm")
									}), /* @__PURE__ */ jsx("button", {
										className: "glow-btn-secondary",
										style: {
											flex: 1,
											padding: "10px"
										},
										onClick: () => setShowShareModal(false),
										children: t("btn_cancel")
									})]
								})
							]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Head3DWorkspace as default };
