import { n as useTranslation } from "../main.mjs";
import { i as dilateTexture } from "./OBJExporter-DH3WzVke.js";
import { t as ThreeViewer } from "./ThreeViewer-CRwfpc2W.js";
import { Head } from "vite-react-ssg";
import { useEffect, useRef, useState } from "react";
import { Download, FileJson, Grid, RotateCw, Upload } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
import * as THREE from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
import { exportFbx } from "three-js-fbx-exporter";
//#region src/modules/BlockbenchParser.ts
/**
* Loads a base64 image string into an HTMLImageElement.
*/
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error("Failed to load embedded texture"));
		img.src = src;
	});
}
/**
* Generates a default 64x64 grid texture to use as a fallback if no textures are provided.
*/
function generateFallbackTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, 64, 64);
	ctx.fillStyle = "#27272a";
	for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 0) ctx.fillRect(x * 8, y * 8, 8, 8);
	const img = new Image();
	img.src = canvas.toDataURL();
	return img;
}
function buildPlaneGeometry(w, h, uMin, uMax, vMin, vMax) {
	const geom = new THREE.PlaneGeometry(w, h);
	const uvAttr = geom.attributes.uv;
	uvAttr.setXY(0, uMin, vMax);
	uvAttr.setXY(1, uMax, vMax);
	uvAttr.setXY(2, uMin, vMin);
	uvAttr.setXY(3, uMax, vMin);
	uvAttr.needsUpdate = true;
	const nonIndexed = geom.toNonIndexed();
	geom.dispose();
	return nonIndexed;
}
function mergeBufferGeometries(geometries) {
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
	mergedGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	mergedGeom.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
	mergedGeom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
	const indices = new Uint16Array(totalVertices);
	for (let i = 0; i < totalVertices; i++) indices[i] = i;
	mergedGeom.setIndex(new THREE.BufferAttribute(indices, 1));
	return mergedGeom;
}
function buildVoxelizedBoxGeometry(width, height, depth, facesData, getTextureByRef) {
	const geometries = [];
	const faceVertexCounts = [
		0,
		0,
		0,
		0,
		0,
		0
	];
	const faceDefs = [
		{
			key: "east",
			idx: 0,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = depth / w_seg;
				const segH = height / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				geom.rotateY(Math.PI / 2);
				const px = width / 2;
				const py = height / 2 - segH / 2 - row * segH;
				const pz = depth / 2 - segW / 2 - col * segW;
				geom.translate(px, py, pz);
				return geom;
			}
		},
		{
			key: "west",
			idx: 1,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = depth / w_seg;
				const segH = height / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				geom.rotateY(-Math.PI / 2);
				const px = -width / 2;
				const py = height / 2 - segH / 2 - row * segH;
				const pz = -depth / 2 + segW / 2 + col * segW;
				geom.translate(px, py, pz);
				return geom;
			}
		},
		{
			key: "up",
			idx: 2,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = width / w_seg;
				const segH = depth / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				geom.rotateX(-Math.PI / 2);
				const px = -width / 2 + segW / 2 + col * segW;
				const py = height / 2;
				const pz = -depth / 2 + segH / 2 + row * segH;
				geom.translate(px, py, pz);
				return geom;
			}
		},
		{
			key: "down",
			idx: 3,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = width / w_seg;
				const segH = depth / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				geom.rotateX(Math.PI / 2);
				const px = -width / 2 + segW / 2 + col * segW;
				const py = -height / 2;
				const pz = depth / 2 - segH / 2 - row * segH;
				geom.translate(px, py, pz);
				return geom;
			}
		},
		{
			key: "south",
			idx: 4,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = width / w_seg;
				const segH = height / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				const px = -width / 2 + segW / 2 + col * segW;
				const py = height / 2 - segH / 2 - row * segH;
				const pz = depth / 2;
				geom.translate(px, py, pz);
				return geom;
			}
		},
		{
			key: "north",
			idx: 5,
			buildQuad: (col, row, u, v, w_seg, h_seg) => {
				const segW = width / w_seg;
				const segH = height / h_seg;
				const geom = buildPlaneGeometry(segW, segH, u, u, v, v);
				geom.rotateY(Math.PI);
				const px = width / 2 - segW / 2 - col * segW;
				const py = height / 2 - segH / 2 - row * segH;
				const pz = -depth / 2;
				geom.translate(px, py, pz);
				return geom;
			}
		}
	];
	for (const fDef of faceDefs) {
		const fData = facesData ? facesData[fDef.key] : null;
		let texWidth = 64;
		let texHeight = 64;
		let hasTexture = false;
		if (fData && fData.texture !== void 0 && fData.texture !== null) {
			const tex = getTextureByRef(fData.texture);
			texWidth = tex.width;
			texHeight = tex.height;
			hasTexture = true;
		}
		const uv = fData && fData.uv || [
			0,
			0,
			16,
			16
		];
		const u1 = uv[0];
		const v1 = uv[1];
		const u2 = uv[2];
		const v2 = uv[3];
		const uMin = Math.min(u1, u2);
		const uMax = Math.max(u1, u2);
		const vMin = Math.min(v1, v2);
		const vMax = Math.max(v1, v2);
		const uv_w = Math.max(1, Math.round(uMax - uMin));
		const uv_h = Math.max(1, Math.round(vMax - vMin));
		const rot = fData && fData.rotation || 0;
		let w_seg = uv_w;
		let h_seg = uv_h;
		if (rot === 90 || rot === 270) {
			w_seg = uv_h;
			h_seg = uv_w;
		}
		for (let row = 0; row < h_seg; row++) for (let col = 0; col < w_seg; col++) {
			const f_u = (col + .5) / w_seg;
			const f_v = (row + .5) / h_seg;
			let r_u = f_u;
			let r_v = f_v;
			if (rot === 90) {
				r_u = f_v;
				r_v = 1 - f_u;
			} else if (rot === 180) {
				r_u = 1 - f_u;
				r_v = 1 - f_v;
			} else if (rot === 270) {
				r_u = 1 - f_v;
				r_v = f_u;
			}
			const px_u = u1 + r_u * (u2 - u1);
			const px_v = v1 + r_v * (v2 - v1);
			if (hasTexture) {
				const tex = getTextureByRef(fData.texture);
				if (tex && tex.imgData) {
					const px_x = Math.min(tex.width - 1, Math.max(0, Math.floor(px_u)));
					const pixelIdx = (Math.min(tex.height - 1, Math.max(0, Math.floor(px_v))) * tex.width + px_x) * 4;
					if (tex.imgData.data[pixelIdx + 3] < 10) continue;
				}
			}
			const uNorm = hasTexture ? px_u / texWidth : .5 / texWidth;
			const vNorm = hasTexture ? 1 - px_v / texHeight : 1 - .5 / texHeight;
			const quadGeom = fDef.buildQuad(col, row, uNorm, vNorm, w_seg, h_seg);
			geometries.push(quadGeom);
			faceVertexCounts[fDef.idx] += 6;
		}
	}
	if (geometries.length === 0) return new THREE.BufferGeometry();
	const merged = mergeBufferGeometries(geometries);
	geometries.forEach((g) => g.dispose());
	let start = 0;
	for (let i = 0; i < 6; i++) {
		const count = faceVertexCounts[i];
		if (count > 0) {
			merged.addGroup(start, count, i);
			start += count;
		}
	}
	return merged;
}
/**
* Builds a customBufferGeometry for Blockbench 'mesh' type elements.
*/
function buildMeshGeometry(el, getTextureByRef, defaultMaterial, transparentMaterial) {
	const facesList = [];
	if (el.faces) for (const faceId in el.faces) {
		const faceData = el.faces[faceId];
		if (faceData) facesList.push(faceData);
	}
	const localMaterials = [];
	const textureToMatIndex = /* @__PURE__ */ new Map();
	const getMaterialIndexForFace = (faceData) => {
		if (faceData.texture === void 0 || faceData.texture === null) {
			const idx = localMaterials.indexOf(transparentMaterial);
			if (idx !== -1) return idx;
			localMaterials.push(transparentMaterial);
			return localMaterials.length - 1;
		}
		const tex = getTextureByRef(faceData.texture);
		const key = tex.id;
		if (textureToMatIndex.has(key)) return textureToMatIndex.get(key);
		const mat = tex.threeMaterial || defaultMaterial;
		localMaterials.push(mat);
		const idx = localMaterials.length - 1;
		textureToMatIndex.set(key, idx);
		return idx;
	};
	const facesByMatIndex = /* @__PURE__ */ new Map();
	for (const face of facesList) {
		const matIdx = getMaterialIndexForFace(face);
		if (!facesByMatIndex.has(matIdx)) facesByMatIndex.set(matIdx, []);
		facesByMatIndex.get(matIdx).push(face);
	}
	const positionsList = [];
	const uvsList = [];
	const groupOffsets = [];
	let vertexCount = 0;
	for (const [matIdx, faces] of facesByMatIndex.entries()) {
		const groupStart = vertexCount;
		for (const face of faces) {
			const faceVertKeys = face.vertices || [];
			if (faceVertKeys.length < 3) continue;
			const tex = getTextureByRef(face.texture);
			const texWidth = tex.width || 64;
			const texHeight = tex.height || 64;
			for (let i = 1; i < faceVertKeys.length - 1; i++) {
				const keys = [
					faceVertKeys[0],
					faceVertKeys[i],
					faceVertKeys[i + 1]
				];
				for (const key of keys) {
					const pt = el.vertices[key] || [
						0,
						0,
						0
					];
					positionsList.push(pt[0], pt[1], pt[2]);
					const uv = face.uv && face.uv[key] || [0, 0];
					uvsList.push(uv[0] / texWidth, 1 - uv[1] / texHeight);
					vertexCount++;
				}
			}
		}
		const groupCount = vertexCount - groupStart;
		if (groupCount > 0) groupOffsets.push({
			start: groupStart,
			count: groupCount,
			materialIndex: matIdx
		});
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positionsList, 3));
	geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvsList, 2));
	geometry.computeVertexNormals();
	for (const group of groupOffsets) geometry.addGroup(group.start, group.count, group.materialIndex);
	return {
		geometry,
		materials: localMaterials
	};
}
/**
* Scales an image up to 1024x1024 using Nearest-Neighbor interpolation on a canvas.
*/
function scaleImageTo1024(image) {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			resolve(image);
			return;
		}
		ctx.imageSmoothingEnabled = false;
		ctx.mozImageSmoothingEnabled = false;
		ctx.webkitImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		const tempCanvas = document.createElement("canvas");
		const w = image.naturalWidth || image.width || 64;
		const h = image.naturalHeight || image.height || 64;
		tempCanvas.width = w;
		tempCanvas.height = h;
		const tempCtx = tempCanvas.getContext("2d");
		if (tempCtx) {
			tempCtx.drawImage(image, 0, 0);
			try {
				const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, w, h));
				tempCtx.putImageData(dilatedData, 0, 0);
				ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, 1024, 1024);
			} catch (e) {
				console.warn("Failed to dilate texture, falling back to simple scale:", e);
				ctx.drawImage(image, 0, 0, w, h, 0, 0, 1024, 1024);
			}
		} else ctx.drawImage(image, 0, 0, w, h, 0, 0, 1024, 1024);
		const scaledImg = new Image();
		scaledImg.onload = () => resolve(scaledImg);
		scaledImg.onerror = () => resolve(image);
		scaledImg.src = canvas.toDataURL("image/png");
	});
}
/**
* Parses the raw .bbmodel JSON and builds the corresponding 3D meshes.
*/
async function parseBlockbenchModel(jsonText) {
	const data = JSON.parse(jsonText);
	if (!data.elements || !Array.isArray(data.elements)) throw new Error("Invalid .bbmodel structure: elements array is missing.");
	const modelGroup = new THREE.Group();
	modelGroup.name = "BlockbenchModel";
	const parsedTextures = [];
	const rawTextures = data.textures || [];
	for (const tex of rawTextures) {
		let img;
		if (tex.source && tex.source.startsWith("data:")) try {
			img = await loadImage(tex.source);
		} catch (err) {
			console.warn("Failed to load embedded texture:", tex.name, err);
			img = generateFallbackTexture();
		}
		else img = generateFallbackTexture();
		const tempCanvas = document.createElement("canvas");
		const w = img.naturalWidth || img.width || 64;
		const h = img.naturalHeight || img.height || 64;
		tempCanvas.width = w;
		tempCanvas.height = h;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.drawImage(img, 0, 0);
		const imgData = tempCtx.getImageData(0, 0, w, h);
		const scaledImg = await scaleImageTo1024(img);
		const texture = new THREE.Texture(scaledImg);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.name = tex.name || "texture.png";
		texture.sourceFile = tex.name || "texture.png";
		texture.needsUpdate = true;
		const material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			transparent: true,
			side: THREE.DoubleSide
		});
		material.name = `mat_${tex.name || tex.id}`;
		parsedTextures.push({
			id: String(tex.id),
			uuid: tex.uuid,
			name: tex.name || "texture.png",
			source: tex.source || "",
			width: w,
			height: h,
			loadedImage: scaledImg,
			threeMaterial: material,
			imgData
		});
	}
	if (parsedTextures.length === 0) {
		const fallbackImg = generateFallbackTexture();
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = 64;
		tempCanvas.height = 64;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.drawImage(fallbackImg, 0, 0);
		const imgData = tempCtx.getImageData(0, 0, 64, 64);
		const scaledFallbackImg = await scaleImageTo1024(fallbackImg);
		const texture = new THREE.Texture(scaledFallbackImg);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;
		texture.generateMipmaps = false;
		texture.name = "fallback.png";
		texture.needsUpdate = true;
		const material = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			transparent: true,
			side: THREE.DoubleSide
		});
		material.name = "mat_fallback";
		parsedTextures.push({
			id: "fallback",
			name: "fallback.png",
			source: "",
			width: 64,
			height: 64,
			loadedImage: scaledFallbackImg,
			threeMaterial: material,
			imgData
		});
	}
	const transparentMaterial = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0,
		depthWrite: false
	});
	transparentMaterial.name = "mat_transparent";
	const getTextureByRef = (ref) => {
		if (ref === void 0 || ref === null) return parsedTextures[0];
		const refStr = String(ref).replace("#", "");
		return parsedTextures.find((t) => t.id === refStr || t.uuid === refStr) || parsedTextures[0];
	};
	for (let i = 0; i < data.elements.length; i++) {
		const el = data.elements[i];
		if (el.visibility === false) continue;
		let hasTexturedFace = false;
		if (el.faces) for (const faceId in el.faces) {
			const faceData = el.faces[faceId];
			if (faceData && faceData.texture !== void 0 && faceData.texture !== null) {
				hasTexturedFace = true;
				break;
			}
		}
		if (!hasTexturedFace) continue;
		const origin = el.origin || [
			0,
			0,
			0
		];
		const rotation = el.rotation || [
			0,
			0,
			0
		];
		let geometry;
		let materials;
		if (el.type === "mesh") {
			const meshData = buildMeshGeometry(el, getTextureByRef, parsedTextures[0].threeMaterial, transparentMaterial);
			geometry = meshData.geometry;
			materials = meshData.materials;
		} else {
			const from = el.from || [
				0,
				0,
				0
			];
			const to = el.to || [
				1,
				1,
				1
			];
			geometry = buildVoxelizedBoxGeometry(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]), Math.abs(to[2] - from[2]), el.faces, getTextureByRef);
			const faceOrder = [
				{
					key: "east",
					idx: 0
				},
				{
					key: "west",
					idx: 1
				},
				{
					key: "up",
					idx: 2
				},
				{
					key: "down",
					idx: 3
				},
				{
					key: "south",
					idx: 4
				},
				{
					key: "north",
					idx: 5
				}
			];
			materials = [];
			for (const faceInfo of faceOrder) {
				const faceData = el.faces ? el.faces[faceInfo.key] : null;
				if (faceData && faceData.texture !== void 0 && faceData.texture !== null) {
					const tex = getTextureByRef(faceData.texture);
					materials.push(tex.threeMaterial || parsedTextures[0].threeMaterial);
				} else materials.push(transparentMaterial);
			}
		}
		const mesh = new THREE.Mesh(geometry, materials);
		mesh.name = el.name || `element_${i}`;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		if (el.type === "mesh") mesh.position.set(0, 0, 0);
		else {
			const from = el.from || [
				0,
				0,
				0
			];
			const to = el.to || [
				1,
				1,
				1
			];
			const centerX = (from[0] + to[0]) / 2;
			const centerY = (from[1] + to[1]) / 2;
			const centerZ = (from[2] + to[2]) / 2;
			mesh.position.set(centerX - origin[0], centerY - origin[1], centerZ - origin[2]);
		}
		const pivot = new THREE.Group();
		pivot.name = `pivot_${el.name || i}`;
		pivot.position.set(origin[0], origin[1], origin[2]);
		pivot.add(mesh);
		pivot.rotation.order = "ZXY";
		pivot.rotation.set(THREE.MathUtils.degToRad(rotation[0]), THREE.MathUtils.degToRad(rotation[1]), THREE.MathUtils.degToRad(rotation[2]));
		modelGroup.add(pivot);
	}
	const bbox = new THREE.Box3().setFromObject(modelGroup);
	const center = new THREE.Vector3();
	bbox.getCenter(center);
	modelGroup.children.forEach((child) => {
		child.position.sub(center);
	});
	return {
		group: modelGroup,
		textures: parsedTextures
	};
}
//#endregion
//#region src/modules/BlockbenchExporter.ts
/**
* Downloads text content as a file in the browser.
*/
function downloadTextFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
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
* Downloads a texture image as a PNG file.
*/
function downloadTextureImage(image, filename) {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		canvas.width = image.naturalWidth || image.width || 64;
		canvas.height = image.naturalHeight || image.height || 64;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			resolve();
			return;
		}
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(image, 0, 0);
		canvas.toBlob((blob) => {
			if (!blob) {
				resolve();
				return;
			}
			const link = document.createElement("a");
			link.style.display = "none";
			document.body.appendChild(link);
			link.href = URL.createObjectURL(blob);
			link.download = filename;
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(link.href);
			resolve();
		}, "image/png");
	});
}
/**
* Exports a parsed Blockbench model group to OBJ + MTL + PNG.
*/
function exportToOBJ(modelGroup, textures, filenamePrefix) {
	return new Promise(async (resolve, reject) => {
		try {
			const rawObj = new OBJExporter().parse(modelGroup);
			const objFilename = `${filenamePrefix}.obj`;
			const mtlFilename = `${filenamePrefix}.mtl`;
			const objText = `mtllib ${mtlFilename}\n${rawObj}`;
			let mtlText = `# Blockbench Model - Material Template Library\n# Generated by SkinBridge Blockbench Converter\n\n`;
			mtlText += `newmtl mat_transparent\n`;
			mtlText += `Ka 0.000 0.000 0.000\n`;
			mtlText += `Kd 0.000 0.000 0.000\n`;
			mtlText += `Ks 0.000 0.000 0.000\n`;
			mtlText += `Ns 10.000\n`;
			mtlText += `d 0.000\n`;
			mtlText += `illum 2\n\n`;
			const texturesToDownload = [];
			textures.forEach((tex) => {
				const matName = `mat_${tex.name || tex.id}`;
				const texName = `skinbridge_${tex.name || `${tex.id}.png`}`;
				mtlText += `newmtl ${matName}\n`;
				mtlText += `Ka 1.000 1.000 1.000\n`;
				mtlText += `Kd 1.000 1.000 1.000\n`;
				mtlText += `Ks 0.000 0.000 0.000\n`;
				mtlText += `Ns 10.000\n`;
				mtlText += `d 1.000\n`;
				mtlText += `illum 2\n`;
				mtlText += `map_Kd ${texName}\n\n`;
				if (tex.loadedImage) texturesToDownload.push({
					name: texName,
					img: tex.loadedImage
				});
			});
			downloadTextFile(objText, objFilename, "text/plain");
			await new Promise((r) => setTimeout(r, 200));
			downloadTextFile(mtlText, mtlFilename, "text/plain");
			for (const texInfo of texturesToDownload) {
				await new Promise((r) => setTimeout(r, 200));
				await downloadTextureImage(texInfo.img, texInfo.name);
			}
			resolve();
		} catch (err) {
			reject(err);
		}
	});
}
/**
* Exports a parsed Blockbench model group to a binary FBX file with embedded textures.
*/
function exportToFBX(modelGroup, filenamePrefix) {
	return new Promise((resolve, reject) => {
		try {
			downloadBinaryFile(exportFbx(modelGroup, {
				format: "binary",
				target: "blender",
				embedTextures: true,
				onWarning: (warning) => {
					console.warn("[FBX Export Warning]", warning.message || warning.code);
				}
			}), `${filenamePrefix}.fbx`);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
}
//#endregion
//#region src/components/BlockbenchWorkspace.tsx
function BlockbenchWorkspace({ showToast, logExport }) {
	const { t } = useTranslation();
	const [model, setModel] = useState(null);
	const [filenamePrefix, setFilenamePrefix] = useState("blockbench_model");
	const [elementCount, setElementCount] = useState(0);
	const [dragActive, setDragActive] = useState(false);
	const [showGrid, setShowGrid] = useState(true);
	const [autoRotate, setAutoRotate] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const fileInputRef = useRef(null);
	const containerRef = useRef(null);
	const viewerRef = useRef(null);
	const [debugLogs, setDebugLogs] = useState([]);
	useEffect(() => {
		const handleGlobalError = (event) => {
			setDebugLogs((prev) => [...prev, `[Global Error] ${event.message} at ${event.filename}:${event.lineno}`]);
		};
		const handleUnhandledRejection = (event) => {
			setDebugLogs((prev) => [...prev, `[Promise Rejection] ${event.reason?.message || event.reason}`]);
		};
		const originalConsoleError = console.error;
		console.error = (...args) => {
			setDebugLogs((prev) => [...prev, `[Console Error] ${args.map((a) => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")}`]);
			originalConsoleError.apply(console, args);
		};
		window.addEventListener("error", handleGlobalError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		return () => {
			window.removeEventListener("error", handleGlobalError);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
			console.error = originalConsoleError;
		};
	}, []);
	useEffect(() => {
		if (containerRef.current && !viewerRef.current) {
			const viewer = new ThreeViewer(containerRef.current);
			viewerRef.current = viewer;
			viewer.setGridY(-5);
		}
		if (viewerRef.current) {
			viewerRef.current.autoRotate = autoRotate;
			viewerRef.current.setGridVisible(showGrid);
			if (model) {
				viewerRef.current.setHeadModel(model.group, true);
				const bbox = new THREE.Box3().setFromObject(model.group);
				viewerRef.current.setGridY(bbox.min.y - .5);
			}
		}
	}, [
		model,
		autoRotate,
		showGrid
	]);
	useEffect(() => {
		return () => {
			if (viewerRef.current) {
				viewerRef.current.destroy();
				viewerRef.current = null;
			}
		};
	}, []);
	const handleFile = async (file) => {
		setIsLoading(true);
		try {
			const text = await file.text();
			const parsed = await parseBlockbenchModel(text);
			let numElements = 0;
			try {
				const data = JSON.parse(text);
				if (data.elements) numElements = data.elements.length;
			} catch (e) {}
			setElementCount(numElements);
			setModel(parsed);
			setFilenamePrefix(file.name.replace(/\.[^/.]+$/, ""));
			showToast("success", t("toast_bb_load_success"));
		} catch (err) {
			console.error(err);
			showToast("error", t("toast_bb_parse_error", { error: err.message || err }));
		} finally {
			setIsLoading(false);
		}
	};
	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
		else if (e.type === "dragleave") setDragActive(false);
	};
	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];
			if (file.name.endsWith(".bbmodel") || file.name.endsWith(".json")) handleFile(file);
			else showToast("error", t("bb_upload_format_hint"));
		}
	};
	const handleFileChange = (e) => {
		if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
	};
	const triggerUploadClick = () => {
		fileInputRef.current?.click();
	};
	const handleExportOBJ = async () => {
		if (!model) return;
		try {
			await exportToOBJ(model.group, model.textures, `skinbridge_${filenamePrefix}`);
			showToast("success", t("toast_bb_export_success"));
			logExport("OBJ", `skinbridge_${filenamePrefix}.obj`);
		} catch (err) {
			showToast("error", t("toast_bb_export_error", { error: err.message || err }));
		}
	};
	const handleExportFBX = async () => {
		if (!model) return;
		try {
			await exportToFBX(model.group, `skinbridge_${filenamePrefix}`);
			showToast("success", t("toast_bb_export_success"));
			logExport("FBX", `skinbridge_${filenamePrefix}.fbx`);
		} catch (err) {
			showToast("error", t("toast_bb_export_error", { error: err.message || err }));
		}
	};
	return /* @__PURE__ */ jsxs("main", {
		className: "main-grid",
		children: [
			/* @__PURE__ */ jsxs(Head, { children: [
				/* @__PURE__ */ jsx("title", { children: "Minecraft Skin Blockbench Export | Convert bbmodel to OBJ/FBX" }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: "Convert Minecraft skins and Blockbench bbmodel files to OBJ and FBX format. Optimize your models with physical alpha-cutout textures for Roblox."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: "Minecraft Skin Blockbench Export & Converter"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: "Convert Minecraft skins and Blockbench bbmodel files to OBJ and FBX format."
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: "https://skinbridge.vercel.app/blockbench"
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
							children: t("bb_upload_title")
						}),
						/* @__PURE__ */ jsx("p", {
							style: {
								margin: "0 0 16px 0",
								fontSize: "0.85rem",
								color: "#a1a1aa"
							},
							children: t("bb_upload_desc")
						}),
						/* @__PURE__ */ jsx("input", {
							ref: fileInputRef,
							type: "file",
							accept: ".bbmodel,.json",
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
							style: { cursor: "pointer" },
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
									children: t("bb_upload_btn")
								}),
								/* @__PURE__ */ jsx("p", {
									style: {
										margin: 0,
										fontSize: "0.75rem",
										color: "#71717a"
									},
									children: t("bb_upload_format_hint")
								})
							]
						})
					] }),
					isLoading && /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "12px",
							padding: "24px 0"
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
							children: "Procesando archivo..."
						})]
					}),
					model && !isLoading && /* @__PURE__ */ jsxs("div", {
						className: "skin-preview-section",
						style: {
							borderTop: "1px solid rgba(255,255,255,0.05)",
							paddingTop: "20px"
						},
						children: [
							/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "8px",
									marginBottom: "12px"
								},
								children: [/* @__PURE__ */ jsx(FileJson, {
									size: 20,
									style: { color: "#818cf8" }
								}), /* @__PURE__ */ jsx("h3", {
									style: {
										margin: 0,
										fontSize: "1rem",
										fontWeight: 600
									},
									children: t("bb_model_info")
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "8px",
									fontSize: "0.85rem",
									color: "#e4e4e7"
								},
								children: [
									/* @__PURE__ */ jsxs("div", {
										style: {
											display: "flex",
											justifyContent: "space-between",
											borderBottom: "1px solid rgba(255,255,255,0.03)",
											paddingBottom: "6px"
										},
										children: [/* @__PURE__ */ jsxs("span", {
											style: { color: "#a1a1aa" },
											children: [t("bb_model_name"), ":"]
										}), /* @__PURE__ */ jsx("span", {
											style: {
												fontWeight: 600,
												color: "#f4f4f5"
											},
											children: filenamePrefix
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										style: {
											display: "flex",
											justifyContent: "space-between",
											borderBottom: "1px solid rgba(255,255,255,0.03)",
											paddingBottom: "6px"
										},
										children: [/* @__PURE__ */ jsxs("span", {
											style: { color: "#a1a1aa" },
											children: [t("bb_model_elements"), ":"]
										}), /* @__PURE__ */ jsx("span", {
											style: {
												fontWeight: 600,
												color: "#f4f4f5"
											},
											children: elementCount
										})]
									}),
									/* @__PURE__ */ jsxs("div", {
										style: {
											display: "flex",
											justifyContent: "space-between",
											borderBottom: "1px solid rgba(255,255,255,0.03)",
											paddingBottom: "6px"
										},
										children: [/* @__PURE__ */ jsxs("span", {
											style: { color: "#a1a1aa" },
											children: [t("bb_model_textures"), ":"]
										}), /* @__PURE__ */ jsx("span", {
											style: {
												fontWeight: 600,
												color: "#f4f4f5"
											},
											children: model.textures.length
										})]
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								style: { marginTop: "16px" },
								children: [/* @__PURE__ */ jsx("h4", {
									style: {
										margin: "0 0 8px 0",
										fontSize: "0.85rem",
										color: "#a1a1aa",
										fontWeight: 600
									},
									children: "Texturas del Modelo:"
								}), /* @__PURE__ */ jsx("div", {
									style: {
										display: "flex",
										flexDirection: "column",
										gap: "6px",
										maxHeight: "160px",
										overflowY: "auto",
										paddingRight: "4px"
									},
									children: model.textures.map((tex, index) => /* @__PURE__ */ jsxs("div", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "8px",
											background: "rgba(255, 255, 255, 0.02)",
											padding: "6px 8px",
											borderRadius: "6px",
											border: "1px solid rgba(255, 255, 255, 0.03)"
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												style: {
													width: "20px",
													height: "20px",
													borderRadius: "3px",
													overflow: "hidden",
													background: "#1c1917",
													flexShrink: 0
												},
												children: tex.loadedImage && /* @__PURE__ */ jsx("img", {
													src: tex.loadedImage.src,
													alt: tex.name,
													style: {
														width: "100%",
														height: "100%",
														objectFit: "contain",
														imageRendering: "pixelated"
													}
												})
											}),
											/* @__PURE__ */ jsx("span", {
												style: {
													fontSize: "0.75rem",
													color: "#e4e4e7",
													textOverflow: "ellipsis",
													overflow: "hidden",
													whiteSpace: "nowrap",
													flex: 1
												},
												children: tex.name
											}),
											/* @__PURE__ */ jsxs("span", {
												style: {
													fontSize: "0.7rem",
													color: "#71717a"
												},
												children: [
													tex.width,
													"x",
													tex.height
												]
											})
										]
									}, index))
								})]
							})
						]
					}),
					debugLogs.length > 0 && /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: "20px",
							borderTop: "1px solid rgba(239, 68, 68, 0.2)",
							paddingTop: "16px",
							display: "flex",
							flexDirection: "column",
							gap: "8px"
						},
						children: [/* @__PURE__ */ jsx("h4", {
							style: {
								margin: 0,
								fontSize: "0.85rem",
								color: "#f87171",
								fontWeight: 600
							},
							children: "Diagnóstico de Errores:"
						}), /* @__PURE__ */ jsx("div", {
							style: {
								background: "rgba(239, 68, 68, 0.05)",
								border: "1px solid rgba(239, 68, 68, 0.15)",
								borderRadius: "6px",
								padding: "8px",
								maxHeight: "120px",
								overflowY: "auto",
								fontSize: "0.75rem",
								color: "#fca5a5",
								fontFamily: "monospace",
								whiteSpace: "pre-wrap",
								display: "flex",
								flexDirection: "column",
								gap: "4px"
							},
							children: debugLogs.map((log, idx) => /* @__PURE__ */ jsx("div", {
								style: {
									borderBottom: idx < debugLogs.length - 1 ? "1px solid rgba(239, 68, 68, 0.08)" : "none",
									paddingBottom: "4px"
								},
								children: log
							}, idx))
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "glass-panel viewer-panel",
				style: { minHeight: "680px" },
				children: [/* @__PURE__ */ jsxs("div", {
					className: "viewer-canvas-container",
					style: {
						position: "relative",
						width: "100%",
						height: "100%"
					},
					children: [/* @__PURE__ */ jsx("div", {
						ref: containerRef,
						style: {
							width: "100%",
							height: "100%"
						}
					}), !model && /* @__PURE__ */ jsxs("div", {
						style: {
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: "12px",
							padding: "20px",
							textAlign: "center",
							color: "#71717a",
							zIndex: 10
						},
						children: [/* @__PURE__ */ jsx(Upload, {
							size: 48,
							style: { color: "#3f3f46" }
						}), /* @__PURE__ */ jsx("p", {
							style: {
								margin: 0,
								fontSize: "0.95rem"
							},
							children: t("bb_no_model")
						})]
					})]
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
						children: [/* @__PURE__ */ jsxs("button", {
							className: "glow-btn-secondary",
							onClick: handleExportOBJ,
							disabled: !model,
							style: {
								opacity: model ? 1 : .5,
								cursor: model ? "pointer" : "not-allowed"
							},
							children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " OBJ"]
						}), /* @__PURE__ */ jsxs("button", {
							className: "glow-btn",
							onClick: handleExportFBX,
							disabled: !model,
							style: {
								opacity: model ? 1 : .5,
								cursor: model ? "pointer" : "not-allowed"
							},
							children: [/* @__PURE__ */ jsx(Download, { size: 18 }), " FBX"]
						})]
					})]
				})]
			})
		]
	});
}
//#endregion
export { BlockbenchWorkspace as default };
