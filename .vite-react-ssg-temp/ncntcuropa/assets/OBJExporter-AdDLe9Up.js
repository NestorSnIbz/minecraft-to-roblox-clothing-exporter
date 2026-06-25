import * as THREE from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";
//#region src/modules/HeadBuilder.ts
/**
* Sets the UV coordinates for a specific face of a BoxGeometry.
* 
* @param uvAttribute The BufferAttribute representing UVs
* @param faceIndex Index of the face (0-5)
* @param coords Pixel coordinates on the 64x64 texture
*/
function setFaceUVs(uvAttribute, faceIndex, coords) {
	const textureSize = 64;
	const eps = .05;
	const uMin = (coords.x + eps) / textureSize;
	const uMax = (coords.x + coords.w - eps) / textureSize;
	const vMin = (textureSize - (coords.y + coords.h) + eps) / textureSize;
	const vMax = (textureSize - coords.y - eps) / textureSize;
	const startIdx = faceIndex * 4;
	if (faceIndex === 2) {
		uvAttribute.setXY(startIdx, uMin, vMax);
		uvAttribute.setXY(startIdx + 1, uMax, vMax);
		uvAttribute.setXY(startIdx + 2, uMin, vMin);
		uvAttribute.setXY(startIdx + 3, uMax, vMin);
	} else if (faceIndex === 3) {
		uvAttribute.setXY(startIdx, uMax, vMin);
		uvAttribute.setXY(startIdx + 1, uMin, vMin);
		uvAttribute.setXY(startIdx + 2, uMax, vMax);
		uvAttribute.setXY(startIdx + 3, uMin, vMax);
	} else {
		uvAttribute.setXY(startIdx, uMin, vMax);
		uvAttribute.setXY(startIdx + 1, uMax, vMax);
		uvAttribute.setXY(startIdx + 2, uMin, vMin);
		uvAttribute.setXY(startIdx + 3, uMax, vMin);
	}
}
/**
* Applies custom Minecraft head UV coordinates to a BoxGeometry.
* 
* @param geometry The THREE.BoxGeometry to modify
* @param isOverlay Whether to map overlay (Hat Layer) coordinates instead of base head
*/
function applyHeadUVs(geometry, isOverlay) {
	const uvAttribute = geometry.attributes.uv;
	const offset = isOverlay ? 32 : 0;
	const faces = {
		0: {
			x: 16 + offset,
			y: 8,
			w: 8,
			h: 8
		},
		1: {
			x: 0 + offset,
			y: 8,
			w: 8,
			h: 8
		},
		2: {
			x: 8 + offset,
			y: 0,
			w: 8,
			h: 8
		},
		3: {
			x: 16 + offset,
			y: 0,
			w: 8,
			h: 8
		},
		4: {
			x: 8 + offset,
			y: 8,
			w: 8,
			h: 8
		},
		5: {
			x: 24 + offset,
			y: 8,
			w: 8,
			h: 8
		}
	};
	for (let faceIdx = 0; faceIdx < 6; faceIdx++) setFaceUVs(uvAttribute, faceIdx, faces[faceIdx]);
	uvAttribute.needsUpdate = true;
}
/**
* Builds the Minecraft Head 3D model (Group containing Head and HeadOverlay meshes).
* 
* @param skinImage The HTMLImageElement containing the skin
* @returns A THREE.Group containing the 3D Head model
*/
/**
* Builds a BoxGeometry (non-indexed) with all UV coordinates mapped to a single pixel center
* to ensure that all 6 sides of the voxel cube render as a solid pixel color.
*/
function buildBoxGeometry$1(w, h, d, uMin, uMax, vMin, vMax) {
	const geom = new THREE.BoxGeometry(w, h, d);
	const uvAttr = geom.attributes.uv;
	const uCenter = (uMin + uMax) / 2;
	const vCenter = (vMin + vMax) / 2;
	for (let i = 0; i < uvAttr.count; i++) uvAttr.setXY(i, uCenter, vCenter);
	uvAttr.needsUpdate = true;
	const nonIndexed = geom.toNonIndexed();
	geom.dispose();
	return nonIndexed;
}
/**
* Merges multiple BufferGeometries (non-indexed) into a single BufferGeometry.
*/
function mergeBufferGeometries$1(geometries) {
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
/**
* Builds the voxelized head overlay with relief (thickness) based on a heightmap matrix.
*/
function buildVoxelizedOverlayWithRelief(skinImage, heightmap) {
	const group = new THREE.Group();
	group.name = "HeadOverlayVoxelized";
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 64, 64);
	const imgData = ctx.getImageData(0, 0, 64, 64);
	const pixelSize = 1.125;
	const gridOffset = 3.9375;
	let offsets = {
		right: 4,
		left: 4,
		top: 4,
		bottom: 4,
		front: 4,
		back: 4
	};
	let faceHeightmapSource = heightmap;
	if (heightmap && heightmap.offsets) offsets = heightmap.offsets;
	else if (heightmap) offsets = {
		right: 4,
		left: 4,
		top: 4,
		bottom: 4,
		front: 4.15,
		back: 4
	};
	const occupied = /* @__PURE__ */ new Set();
	for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) for (let z = 0; z < 8; z++) occupied.add(`${x},${y},${z}`);
	const faces = [
		{
			key: "right",
			startX: 48,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 + d,
				gy: 7 - row,
				gz: 7 - col
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: pixelOffset + thickness / 2,
				y: gridOffset - row * pixelSize,
				z: gridOffset - col * pixelSize
			})
		},
		{
			key: "left",
			startX: 32,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(-Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 0 - d,
				gy: 7 - row,
				gz: col
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: -(pixelOffset + thickness / 2),
				y: gridOffset - row * pixelSize,
				z: -3.9375 + col * pixelSize
			})
		},
		{
			key: "top",
			startX: 40,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateX(-Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: col,
				gy: 7 + d,
				gz: row
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: -3.9375 + col * pixelSize,
				y: pixelOffset + thickness / 2,
				z: -3.9375 + row * pixelSize
			})
		},
		{
			key: "bottom",
			startX: 48,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateZ(Math.PI);
				geom.rotateX(Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 - col,
				gy: 0 - d,
				gz: row
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: gridOffset - col * pixelSize,
				y: -(pixelOffset + thickness / 2),
				z: -3.9375 + row * pixelSize
			})
		},
		{
			key: "front",
			startX: 40,
			startY: 8,
			applyRotation: (_geom) => {},
			getGridCoord: (col, row, d) => ({
				gx: col,
				gy: 7 - row,
				gz: 7 + d
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: -3.9375 + col * pixelSize,
				y: gridOffset - row * pixelSize,
				z: pixelOffset + thickness / 2
			})
		},
		{
			key: "back",
			startX: 56,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 - col,
				gy: 7 - row,
				gz: 0 - d
			}),
			getPos: (col, row, thickness, pixelOffset) => ({
				x: gridOffset - col * pixelSize,
				y: gridOffset - row * pixelSize,
				z: -(pixelOffset + thickness / 2)
			})
		}
	];
	const geometries = [];
	const overlayMask = {};
	faces.forEach((face) => {
		const faceHeightmap = faceHeightmapSource ? faceHeightmapSource[face.key] : null;
		const faceDefaultOffset = offsets[face.key] ?? 4;
		const faceMatrix = [];
		for (let row = 0; row < 8; row++) {
			const rowArr = [];
			for (let col = 0; col < 8; col++) {
				const px = face.startX + col;
				const py = face.startY + row;
				const idx = (py * 64 + px) * 4;
				if (imgData.data[idx + 3] > 10) {
					let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
					if (heightVal === 0) heightVal = 1;
					const pixelOffset = heightVal === 3 || heightVal === 4 ? faceDefaultOffset + .175 : faceDefaultOffset;
					const uMin = px / 64;
					const uMax = (px + 1) / 64;
					const vMin = (64 - (py + 1)) / 64;
					const vMax = (64 - py) / 64;
					rowArr.push({
						active: true,
						heightVal,
						pixelOffset,
						uMin,
						uMax,
						vMin,
						vMax
					});
				} else rowArr.push({
					active: false,
					heightVal: 0,
					pixelOffset: 0,
					uMin: 0,
					uMax: 0,
					vMin: 0,
					vMax: 0
				});
			}
			faceMatrix.push(rowArr);
		}
		overlayMask[face.key] = faceMatrix;
	});
	const THICKNESS = .35;
	const CORNER_CLIP_W = .625;
	const CORNER_SHIFT = -.25;
	const vcDefs = [
		{
			faceA: "front",
			colA: 7,
			faceB: "right",
			colB: 0,
			clipAPos: (p) => ({
				...p,
				x: p.x + CORNER_SHIFT
			}),
			clipBPos: (p) => ({
				...p,
				z: p.z + CORNER_SHIFT
			}),
			capPos: (row, pOfsA, pOfsB, th) => ({
				x: pOfsB + th / 2,
				y: gridOffset - row * pixelSize,
				z: pOfsA + th / 2
			}),
			topPixel: {
				row: 7,
				col: 7
			},
			bottomPixel: {
				row: 7,
				col: 0
			}
		},
		{
			faceA: "front",
			colA: 0,
			faceB: "left",
			colB: 7,
			clipAPos: (p) => ({
				...p,
				x: p.x - CORNER_SHIFT
			}),
			clipBPos: (p) => ({
				...p,
				z: p.z + CORNER_SHIFT
			}),
			capPos: (row, pOfsA, pOfsB, th) => ({
				x: -(pOfsB + th / 2),
				y: gridOffset - row * pixelSize,
				z: pOfsA + th / 2
			}),
			topPixel: {
				row: 7,
				col: 0
			},
			bottomPixel: {
				row: 7,
				col: 7
			}
		},
		{
			faceA: "back",
			colA: 0,
			faceB: "right",
			colB: 7,
			clipAPos: (p) => ({
				...p,
				x: p.x + CORNER_SHIFT
			}),
			clipBPos: (p) => ({
				...p,
				z: p.z - CORNER_SHIFT
			}),
			capPos: (row, pOfsA, pOfsB, th) => ({
				x: pOfsB + th / 2,
				y: gridOffset - row * pixelSize,
				z: -(pOfsA + th / 2)
			}),
			topPixel: {
				row: 0,
				col: 7
			},
			bottomPixel: {
				row: 0,
				col: 0
			}
		},
		{
			faceA: "back",
			colA: 7,
			faceB: "left",
			colB: 0,
			clipAPos: (p) => ({
				...p,
				x: p.x - CORNER_SHIFT
			}),
			clipBPos: (p) => ({
				...p,
				z: p.z - CORNER_SHIFT
			}),
			capPos: (row, pOfsA, pOfsB, th) => ({
				x: -(pOfsB + th / 2),
				y: gridOffset - row * pixelSize,
				z: -(pOfsA + th / 2)
			}),
			topPixel: {
				row: 0,
				col: 0
			},
			bottomPixel: {
				row: 0,
				col: 7
			}
		}
	];
	const vcLookup = /* @__PURE__ */ new Map();
	vcDefs.forEach((def) => {
		vcLookup.set(`${def.faceA}:${def.colA}`, {
			def,
			role: "A"
		});
		vcLookup.set(`${def.faceB}:${def.colB}`, {
			def,
			role: "B"
		});
	});
	const heDefs = [
		{
			id: "top-front",
			faceA: "top",
			faceB: "front",
			isEdgeA: (r, _c) => r === 7,
			paramFromA: (_r, c) => c,
			rowBfromP: (_p) => 0,
			colBfromP: (p) => p,
			isEdgeB: (r, _c) => r === 0,
			paramFromB: (_r, c) => c,
			rowAfromP: (_p) => 7,
			colAfromP: (p) => p,
			clipADim: "h",
			clipAPos: (p) => ({
				...p,
				z: p.z + CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y + CORNER_SHIFT
			}),
			capW: pixelSize,
			capH: THICKNESS,
			capD: THICKNESS,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: -3.9375 + p * pixelSize,
				y: pOfsA + THICKNESS / 2,
				z: pOfsB + THICKNESS / 2
			}),
			boundaries: [{
				param: 7,
				adjFace: "right",
				adjRow: 0,
				adjCol: 0,
				shiftX: CORNER_SHIFT,
				shiftZ: 0
			}, {
				param: 0,
				adjFace: "left",
				adjRow: 0,
				adjCol: 7,
				shiftX: .25,
				shiftZ: 0
			}]
		},
		{
			id: "top-back",
			faceA: "top",
			faceB: "back",
			isEdgeA: (r, _c) => r === 0,
			paramFromA: (_r, c) => c,
			rowBfromP: (_p) => 0,
			colBfromP: (p) => 7 - p,
			isEdgeB: (r, _c) => r === 0,
			paramFromB: (_r, c) => 7 - c,
			rowAfromP: (_p) => 0,
			colAfromP: (p) => p,
			clipADim: "h",
			clipAPos: (p) => ({
				...p,
				z: p.z - CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y + CORNER_SHIFT
			}),
			capW: pixelSize,
			capH: THICKNESS,
			capD: THICKNESS,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: -3.9375 + p * pixelSize,
				y: pOfsA + THICKNESS / 2,
				z: -(pOfsB + THICKNESS / 2)
			}),
			boundaries: [{
				param: 7,
				adjFace: "right",
				adjRow: 0,
				adjCol: 7,
				shiftX: CORNER_SHIFT,
				shiftZ: 0
			}, {
				param: 0,
				adjFace: "left",
				adjRow: 0,
				adjCol: 0,
				shiftX: .25,
				shiftZ: 0
			}]
		},
		{
			id: "top-right",
			faceA: "top",
			faceB: "right",
			isEdgeA: (_r, c) => c === 7,
			paramFromA: (r, _c) => r,
			rowBfromP: (_p) => 0,
			colBfromP: (p) => 7 - p,
			isEdgeB: (r, _c) => r === 0,
			paramFromB: (_r, c) => 7 - c,
			rowAfromP: (p) => p,
			colAfromP: (_p) => 7,
			clipADim: "w",
			clipAPos: (p) => ({
				...p,
				x: p.x + CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y + CORNER_SHIFT
			}),
			capW: THICKNESS,
			capH: THICKNESS,
			capD: pixelSize,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: pOfsB + THICKNESS / 2,
				y: pOfsA + THICKNESS / 2,
				z: -3.9375 + p * pixelSize
			}),
			boundaries: [{
				param: 7,
				adjFace: "front",
				adjRow: 0,
				adjCol: 7,
				shiftX: 0,
				shiftZ: CORNER_SHIFT
			}, {
				param: 0,
				adjFace: "back",
				adjRow: 0,
				adjCol: 0,
				shiftX: 0,
				shiftZ: .25
			}]
		},
		{
			id: "top-left",
			faceA: "top",
			faceB: "left",
			isEdgeA: (_r, c) => c === 0,
			paramFromA: (r, _c) => r,
			rowBfromP: (_p) => 0,
			colBfromP: (p) => p,
			isEdgeB: (r, _c) => r === 0,
			paramFromB: (_r, c) => c,
			rowAfromP: (p) => p,
			colAfromP: (_p) => 0,
			clipADim: "w",
			clipAPos: (p) => ({
				...p,
				x: p.x - CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y + CORNER_SHIFT
			}),
			capW: THICKNESS,
			capH: THICKNESS,
			capD: pixelSize,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: -(pOfsB + THICKNESS / 2),
				y: pOfsA + THICKNESS / 2,
				z: -3.9375 + p * pixelSize
			}),
			boundaries: [{
				param: 7,
				adjFace: "front",
				adjRow: 0,
				adjCol: 0,
				shiftX: 0,
				shiftZ: CORNER_SHIFT
			}, {
				param: 0,
				adjFace: "back",
				adjRow: 0,
				adjCol: 7,
				shiftX: 0,
				shiftZ: .25
			}]
		},
		{
			id: "bottom-front",
			faceA: "bottom",
			faceB: "front",
			isEdgeA: (r, _c) => r === 7,
			paramFromA: (_r, c) => 7 - c,
			rowBfromP: (_p) => 7,
			colBfromP: (p) => p,
			isEdgeB: (r, _c) => r === 7,
			paramFromB: (_r, c) => c,
			rowAfromP: (_p) => 7,
			colAfromP: (p) => 7 - p,
			clipADim: "h",
			clipAPos: (p) => ({
				...p,
				z: p.z + CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y - CORNER_SHIFT
			}),
			capW: pixelSize,
			capH: THICKNESS,
			capD: THICKNESS,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: -3.9375 + p * pixelSize,
				y: -(pOfsA + THICKNESS / 2),
				z: pOfsB + THICKNESS / 2
			}),
			boundaries: [{
				param: 7,
				adjFace: "right",
				adjRow: 7,
				adjCol: 0,
				shiftX: CORNER_SHIFT,
				shiftZ: 0
			}, {
				param: 0,
				adjFace: "left",
				adjRow: 7,
				adjCol: 7,
				shiftX: .25,
				shiftZ: 0
			}]
		},
		{
			id: "bottom-back",
			faceA: "bottom",
			faceB: "back",
			isEdgeA: (r, _c) => r === 0,
			paramFromA: (_r, c) => c,
			rowBfromP: (_p) => 7,
			colBfromP: (p) => p,
			isEdgeB: (r, _c) => r === 7,
			paramFromB: (_r, c) => c,
			rowAfromP: (_p) => 0,
			colAfromP: (p) => p,
			clipADim: "h",
			clipAPos: (p) => ({
				...p,
				z: p.z - CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y - CORNER_SHIFT
			}),
			capW: pixelSize,
			capH: THICKNESS,
			capD: THICKNESS,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: gridOffset - p * pixelSize,
				y: -(pOfsA + THICKNESS / 2),
				z: -(pOfsB + THICKNESS / 2)
			}),
			boundaries: [{
				param: 0,
				adjFace: "right",
				adjRow: 7,
				adjCol: 7,
				shiftX: CORNER_SHIFT,
				shiftZ: 0
			}, {
				param: 7,
				adjFace: "left",
				adjRow: 7,
				adjCol: 0,
				shiftX: .25,
				shiftZ: 0
			}]
		},
		{
			id: "bottom-right",
			faceA: "bottom",
			faceB: "right",
			isEdgeA: (_r, c) => c === 0,
			paramFromA: (r, _c) => r,
			rowBfromP: (_p) => 7,
			colBfromP: (p) => 7 - p,
			isEdgeB: (r, _c) => r === 7,
			paramFromB: (_r, c) => 7 - c,
			rowAfromP: (p) => p,
			colAfromP: (_p) => 0,
			clipADim: "w",
			clipAPos: (p) => ({
				...p,
				x: p.x + CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y - CORNER_SHIFT
			}),
			capW: THICKNESS,
			capH: THICKNESS,
			capD: pixelSize,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: pOfsB + THICKNESS / 2,
				y: -(pOfsA + THICKNESS / 2),
				z: -3.9375 + p * pixelSize
			}),
			boundaries: [{
				param: 7,
				adjFace: "front",
				adjRow: 7,
				adjCol: 7,
				shiftX: 0,
				shiftZ: CORNER_SHIFT
			}, {
				param: 0,
				adjFace: "back",
				adjRow: 7,
				adjCol: 0,
				shiftX: 0,
				shiftZ: .25
			}]
		},
		{
			id: "bottom-left",
			faceA: "bottom",
			faceB: "left",
			isEdgeA: (_r, c) => c === 7,
			paramFromA: (r, _c) => r,
			rowBfromP: (_p) => 7,
			colBfromP: (p) => p,
			isEdgeB: (r, _c) => r === 7,
			paramFromB: (_r, c) => c,
			rowAfromP: (p) => p,
			colAfromP: (_p) => 7,
			clipADim: "w",
			clipAPos: (p) => ({
				...p,
				x: p.x - CORNER_SHIFT
			}),
			clipBDim: "h",
			clipBPos: (p) => ({
				...p,
				y: p.y - CORNER_SHIFT
			}),
			capW: THICKNESS,
			capH: THICKNESS,
			capD: pixelSize,
			getCapCenter: (p, pOfsA, pOfsB) => ({
				x: -(pOfsB + THICKNESS / 2),
				y: -(pOfsA + THICKNESS / 2),
				z: -3.9375 + p * pixelSize
			}),
			boundaries: [{
				param: 7,
				adjFace: "front",
				adjRow: 7,
				adjCol: 0,
				shiftX: 0,
				shiftZ: CORNER_SHIFT
			}, {
				param: 0,
				adjFace: "back",
				adjRow: 7,
				adjCol: 7,
				shiftX: 0,
				shiftZ: .25
			}]
		}
	];
	const emittedCaps = /* @__PURE__ */ new Set();
	faces.forEach((face) => {
		for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
			const info = overlayMask[face.key][row][col];
			if (!info.active) continue;
			const coord = face.getGridCoord(col, row, 1);
			const coordKey = `${coord.gx},${coord.gy},${coord.gz}`;
			if (occupied.has(coordKey)) continue;
			occupied.add(coordKey);
			let clipW = false;
			let clipH = false;
			let pos = face.getPos(col, row, THICKNESS, info.pixelOffset);
			const vcr = vcLookup.get(`${face.key}:${col}`);
			if (vcr) {
				const { def, role } = vcr;
				const adjFaceKey = role === "A" ? def.faceB : def.faceA;
				const adjCol = role === "A" ? def.colB : def.colA;
				if ((overlayMask[adjFaceKey]?.[row]?.[adjCol])?.active) {
					clipW = true;
					pos = role === "A" ? def.clipAPos(pos) : def.clipBPos(pos);
					const vcCapKey = `vc:${def.faceA}:${def.faceB}:${row}`;
					if (!emittedCaps.has(vcCapKey)) {
						emittedCaps.add(vcCapKey);
						const piA = overlayMask[def.faceA][row][def.colA];
						const piB = overlayMask[def.faceB][row][def.colB];
						const cpi = role === "A" ? piA : piB;
						let capH = pixelSize;
						let capYShift = 0;
						if (row === 0) {
							const tpx = def.topPixel;
							if (tpx && overlayMask["top"]?.[tpx.row]?.[tpx.col]?.active) {
								capH = CORNER_CLIP_W;
								capYShift = CORNER_SHIFT;
							}
						} else if (row === 7) {
							const bpx = def.bottomPixel;
							if (bpx && overlayMask["bottom"]?.[bpx.row]?.[bpx.col]?.active) {
								capH = CORNER_CLIP_W;
								capYShift = .25;
							}
						}
						const rawCapPos = def.capPos(row, piA.pixelOffset, piB.pixelOffset, THICKNESS);
						const capPos = {
							...rawCapPos,
							y: rawCapPos.y + capYShift
						};
						const capGeom = buildBoxGeometry$1(THICKNESS, capH, THICKNESS, cpi.uMin, cpi.uMax, cpi.vMin, cpi.vMax);
						capGeom.translate(capPos.x, capPos.y, capPos.z);
						geometries.push(capGeom);
					}
				}
			}
			for (const hDef of heDefs) {
				let heRole = null;
				let param = 0;
				if (hDef.faceA === face.key && hDef.isEdgeA(row, col)) {
					param = hDef.paramFromA(row, col);
					if ((overlayMask[hDef.faceB]?.[hDef.rowBfromP(param)]?.[hDef.colBfromP(param)])?.active) heRole = "A";
				} else if (hDef.faceB === face.key && hDef.isEdgeB(row, col)) {
					param = hDef.paramFromB(row, col);
					if ((overlayMask[hDef.faceA]?.[hDef.rowAfromP(param)]?.[hDef.colAfromP(param)])?.active) heRole = "B";
				}
				if (heRole !== null) {
					if (heRole === "A") {
						if (hDef.clipADim === "w") clipW = true;
						else clipH = true;
						pos = hDef.clipAPos(pos);
					} else {
						if (hDef.clipBDim === "w") clipW = true;
						else clipH = true;
						pos = hDef.clipBPos(pos);
					}
					const heCapKey = `he:${hDef.id}:${param}`;
					if (!emittedCaps.has(heCapKey)) {
						emittedCaps.add(heCapKey);
						const rA = hDef.rowAfromP(param), cA = hDef.colAfromP(param);
						const rB = hDef.rowBfromP(param), cB = hDef.colBfromP(param);
						const piA = overlayMask[hDef.faceA]?.[rA]?.[cA];
						const piB = overlayMask[hDef.faceB]?.[rB]?.[cB];
						if (piA?.active && piB?.active) {
							const cpi = heRole === "A" ? piA : piB;
							let cW = hDef.capW, cD = hDef.capD;
							let xAdj = 0, zAdj = 0;
							const bnd = hDef.boundaries.find((b) => b.param === param);
							if (bnd) {
								if (overlayMask[bnd.adjFace]?.[bnd.adjRow]?.[bnd.adjCol]?.active) {
									if (hDef.capW === pixelSize) {
										cW = CORNER_CLIP_W;
										xAdj = bnd.shiftX;
									}
									if (hDef.capD === pixelSize) {
										cD = CORNER_CLIP_W;
										zAdj = bnd.shiftZ;
									}
								}
							}
							const rawCPos = hDef.getCapCenter(param, piA.pixelOffset, piB.pixelOffset);
							const cPos = {
								x: rawCPos.x + xAdj,
								y: rawCPos.y,
								z: rawCPos.z + zAdj
							};
							const capGeom = buildBoxGeometry$1(cW, hDef.capH, cD, cpi.uMin, cpi.uMax, cpi.vMin, cpi.vMax);
							capGeom.translate(cPos.x, cPos.y, cPos.z);
							geometries.push(capGeom);
						}
					}
				}
			}
			const geom = buildBoxGeometry$1(clipW ? CORNER_CLIP_W : pixelSize, clipH ? CORNER_CLIP_W : pixelSize, THICKNESS, info.uMin, info.uMax, info.vMin, info.vMax);
			face.applyRotation(geom);
			geom.translate(pos.x, pos.y, pos.z);
			geometries.push(geom);
		}
	});
	for (const tc of [
		{
			f1: "front",
			r1: 0,
			c1: 7,
			f2: "right",
			r2: 0,
			c2: 0,
			f3: "top",
			r3: 7,
			c3: 7,
			sx: 1,
			sy: 1,
			sz: 1
		},
		{
			f1: "front",
			r1: 0,
			c1: 0,
			f2: "left",
			r2: 0,
			c2: 7,
			f3: "top",
			r3: 7,
			c3: 0,
			sx: -1,
			sy: 1,
			sz: 1
		},
		{
			f1: "front",
			r1: 7,
			c1: 7,
			f2: "right",
			r2: 7,
			c2: 0,
			f3: "bottom",
			r3: 7,
			c3: 0,
			sx: 1,
			sy: -1,
			sz: 1
		},
		{
			f1: "front",
			r1: 7,
			c1: 0,
			f2: "left",
			r2: 7,
			c2: 7,
			f3: "bottom",
			r3: 7,
			c3: 7,
			sx: -1,
			sy: -1,
			sz: 1
		},
		{
			f1: "back",
			r1: 0,
			c1: 0,
			f2: "right",
			r2: 0,
			c2: 7,
			f3: "top",
			r3: 0,
			c3: 7,
			sx: 1,
			sy: 1,
			sz: -1
		},
		{
			f1: "back",
			r1: 0,
			c1: 7,
			f2: "left",
			r2: 0,
			c2: 0,
			f3: "top",
			r3: 0,
			c3: 0,
			sx: -1,
			sy: 1,
			sz: -1
		},
		{
			f1: "back",
			r1: 7,
			c1: 0,
			f2: "right",
			r2: 7,
			c2: 7,
			f3: "bottom",
			r3: 0,
			c3: 0,
			sx: 1,
			sy: -1,
			sz: -1
		},
		{
			f1: "back",
			r1: 7,
			c1: 7,
			f2: "left",
			r2: 7,
			c2: 0,
			f3: "bottom",
			r3: 0,
			c3: 7,
			sx: -1,
			sy: -1,
			sz: -1
		}
	]) {
		const i1 = overlayMask[tc.f1]?.[tc.r1]?.[tc.c1];
		const i2 = overlayMask[tc.f2]?.[tc.r2]?.[tc.c2];
		const i3 = overlayMask[tc.f3]?.[tc.r3]?.[tc.c3];
		if (i1?.active && i2?.active && i3?.active) {
			const xOfs = i2.pixelOffset;
			const yOfs = i3.pixelOffset;
			const zOfs = i1.pixelOffset;
			const tcGeom = buildBoxGeometry$1(THICKNESS, THICKNESS, THICKNESS, i1.uMin, i1.uMax, i1.vMin, i1.vMax);
			tcGeom.translate(tc.sx * (xOfs + THICKNESS / 2), tc.sy * (yOfs + THICKNESS / 2), tc.sz * (zOfs + THICKNESS / 2));
			geometries.push(tcGeom);
		}
	}
	const voxelMaterial = new THREE.MeshStandardMaterial({
		roughness: .6,
		metalness: .1,
		side: THREE.DoubleSide
	});
	if (geometries.length > 0) {
		const mergedGeom = mergeBufferGeometries$1(geometries);
		geometries.forEach((g) => g.dispose());
		const mesh = new THREE.Mesh(mergedGeom, voxelMaterial);
		mesh.name = "HeadOverlay";
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		group.add(mesh);
	}
	return group;
}
/**
* Builds the Minecraft Head 3D model (Group containing Head and HeadOverlay meshes).
* Supports optional heightmap relief for the overlay layer.
* 
* @param skinImage The HTMLImageElement containing the skin
* @param heightmap Optional heightmap for the overlay relief
* @returns A THREE.Group containing the 3D Head model
*/
function build3DHead(skinImage, heightmap) {
	const texture = new THREE.CanvasTexture(skinImage);
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	texture.colorSpace = THREE.SRGBColorSpace;
	const headGeo = new THREE.BoxGeometry(8, 8, 8);
	applyHeadUVs(headGeo, false);
	const headMat = new THREE.MeshStandardMaterial({
		map: texture,
		roughness: .6,
		metalness: .1,
		transparent: false
	});
	const headMesh = new THREE.Mesh(headGeo, headMat);
	headMesh.name = "Head";
	headMesh.castShadow = true;
	headMesh.receiveShadow = true;
	let overlayMesh;
	if (heightmap) {
		const voxelizedOverlayGroup = buildVoxelizedOverlayWithRelief(skinImage, heightmap);
		voxelizedOverlayGroup.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.material.map = texture;
				child.material.transparent = true;
				child.material.alphaTest = .1;
				child.material.needsUpdate = true;
			}
		});
		overlayMesh = voxelizedOverlayGroup;
	} else {
		const overlayGeo = new THREE.BoxGeometry(9, 9, 9);
		applyHeadUVs(overlayGeo, true);
		const overlayMat = new THREE.MeshStandardMaterial({
			map: texture,
			roughness: .6,
			metalness: .1,
			transparent: true,
			alphaTest: .1,
			side: THREE.DoubleSide
		});
		const classicMesh = new THREE.Mesh(overlayGeo, overlayMat);
		classicMesh.name = "HeadOverlay";
		classicMesh.castShadow = true;
		classicMesh.receiveShadow = true;
		overlayMesh = classicMesh;
	}
	const group = new THREE.Group();
	group.name = "MinecraftHead";
	group.add(headMesh);
	group.add(overlayMesh);
	return group;
}
//#endregion
//#region src/modules/OBJExporter.ts
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
* Expands (dilates) the borders of opaque pixels in the texture into the transparent regions.
* This completely eliminates the black outline (alpha bleeding) caused by bilinear filtering in Roblox Studio.
*/
function dilateTexture(imgData) {
	const width = imgData.width;
	const height = imgData.height;
	const data = imgData.data;
	for (let iter = 0; iter < 4; iter++) {
		const nextData = new Uint8ClampedArray(data);
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			if (data[idx + 3] < 10) {
				const neighbors = [
					{
						x: x + 1,
						y
					},
					{
						x: x - 1,
						y
					},
					{
						x,
						y: y + 1
					},
					{
						x,
						y: y - 1
					}
				];
				for (const n of neighbors) if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
					const nIdx = (n.y * width + n.x) * 4;
					if (data[nIdx + 3] >= 10) {
						nextData[idx] = data[nIdx];
						nextData[idx + 1] = data[nIdx + 1];
						nextData[idx + 2] = data[nIdx + 2];
						nextData[idx + 3] = data[idx + 3];
						break;
					}
				}
			}
		}
		data.set(nextData);
	}
	return imgData;
}
/**
* Downloads the skin image as a PNG file (textura.png).
* Crops only the head region (top 64x16 pixels) and scales it to 1024x1024.
* Applies dilation to fix alpha bleeding / black outlines.
*/
function downloadSkinImage(image, filename) {
	return new Promise((resolve) => {
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			resolve();
			return;
		}
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = 64;
		tempCanvas.height = 64;
		const tempCtx = tempCanvas.getContext("2d");
		tempCtx.drawImage(image, 0, 0, 64, 64, 0, 0, 64, 64);
		const dilatedData = dilateTexture(tempCtx.getImageData(0, 0, 64, 64));
		tempCtx.putImageData(dilatedData, 0, 0);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tempCanvas, 0, 0, 64, 64, 0, 0, 1024, 1024);
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
* Helper to build custom PlaneGeometry for a single voxel face with UV coordinates mapping to a single pixel.
* Converts to non-indexed geometry so it can be merged directly.
*/
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
/**
* Builds a BoxGeometry (non-indexed) with all UV coordinates mapped to a single pixel center
* to ensure that all 6 sides of the voxel cube render as a solid pixel color.
*/
function buildBoxGeometry(w, h, d, uMin, uMax, vMin, vMax) {
	const geom = new THREE.BoxGeometry(w, h, d);
	const uvAttr = geom.attributes.uv;
	const uCenter = (uMin + uMax) / 2;
	const vCenter = (vMin + vMax) / 2;
	for (let i = 0; i < uvAttr.count; i++) uvAttr.setXY(i, uCenter, vCenter);
	uvAttr.needsUpdate = true;
	const nonIndexed = geom.toNonIndexed();
	geom.dispose();
	return nonIndexed;
}
/**
* Merges multiple BufferGeometries (non-indexed) into a single BufferGeometry.
*/
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
/**
* Builds the base head model (8x8x8) as a grid of individual quads to enable sharp color borders in Roblox.
*/
function buildBaseHead(skinImage) {
	const group = new THREE.Group();
	group.name = "HeadVoxelized";
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 64, 64);
	const imgData = ctx.getImageData(0, 0, 64, 64);
	const pixelSize = 1;
	const offset = 4;
	const gridOffset = 3.5;
	const faces = [
		{
			faceIndex: 0,
			startX: 16,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI / 2);
			},
			getPos: (col, row) => ({
				x: offset,
				y: gridOffset - row * pixelSize,
				z: gridOffset - col * pixelSize
			})
		},
		{
			faceIndex: 1,
			startX: 0,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(-Math.PI / 2);
			},
			getPos: (col, row) => ({
				x: -4,
				y: gridOffset - row * pixelSize,
				z: -3.5 + col * pixelSize
			})
		},
		{
			faceIndex: 2,
			startX: 8,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateX(-Math.PI / 2);
			},
			getPos: (col, row) => ({
				x: -3.5 + col * pixelSize,
				y: offset,
				z: -3.5 + row * pixelSize
			})
		},
		{
			faceIndex: 3,
			startX: 16,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateZ(Math.PI);
				geom.rotateX(Math.PI / 2);
			},
			getPos: (col, row) => ({
				x: gridOffset - col * pixelSize,
				y: -4,
				z: -3.5 + row * pixelSize
			})
		},
		{
			faceIndex: 4,
			startX: 8,
			startY: 8,
			applyRotation: (_geom) => {},
			getPos: (col, row) => ({
				x: -3.5 + col * pixelSize,
				y: gridOffset - row * pixelSize,
				z: offset
			})
		},
		{
			faceIndex: 5,
			startX: 24,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI);
			},
			getPos: (col, row) => ({
				x: gridOffset - col * pixelSize,
				y: gridOffset - row * pixelSize,
				z: -4
			})
		}
	];
	const geometries = [];
	faces.forEach((face) => {
		for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
			const px = face.startX + col;
			const py = face.startY + row;
			const idx = (py * 64 + px) * 4;
			if (imgData.data[idx + 3] > 10) {
				const uMin = px / 64;
				const uMax = (px + 1) / 64;
				const vMin = (64 - (py + 1)) / 64;
				const vMax = (64 - py) / 64;
				const uCenter = (uMin + uMax) / 2;
				const vCenter = (vMin + vMax) / 2;
				const geom = buildPlaneGeometry(pixelSize, pixelSize, uCenter, uCenter, vCenter, vCenter);
				face.applyRotation(geom);
				const pos = face.getPos(col, row);
				geom.translate(pos.x, pos.y, pos.z);
				geometries.push(geom);
			}
		}
	});
	const baseMaterial = new THREE.MeshStandardMaterial({
		roughness: .6,
		metalness: .1,
		side: THREE.DoubleSide
	});
	if (geometries.length > 0) {
		const mergedGeom = mergeBufferGeometries(geometries);
		geometries.forEach((g) => g.dispose());
		const mesh = new THREE.Mesh(mergedGeom, baseMaterial);
		mesh.name = "Head";
		group.add(mesh);
	}
	return group;
}
/**
* Builds a 3D group representing only the non-transparent pixels in the skin's overlay layer.
* Supports optional 3D voxel relief (thickness/depth) when a heightmap is provided.
* Merges all voxels/planes into a single consolidated mesh named 'HeadOverlay' to preserve 3D relief in Roblox Studio.
*/
function buildVoxelizedOverlay(skinImage, heightmap) {
	const group = new THREE.Group();
	group.name = "HeadOverlayVoxelized";
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 64, 64);
	const imgData = ctx.getImageData(0, 0, 64, 64);
	const pixelSize = 1.125;
	const gridOffset = 3.9375;
	const flatOffset = 4.5;
	let offsets = {
		right: 4,
		left: 4,
		top: 4,
		bottom: 4,
		front: 4,
		back: 4
	};
	if (heightmap && heightmap.offsets) offsets = heightmap.offsets;
	else if (heightmap) offsets = {
		right: 4,
		left: 4,
		top: 4,
		bottom: 4,
		front: 4.15,
		back: 4
	};
	const occupied = /* @__PURE__ */ new Set();
	for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) for (let z = 0; z < 8; z++) occupied.add(`${x},${y},${z}`);
	const faces = [
		{
			key: "right",
			startX: 48,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 + d,
				gy: 7 - row,
				gz: 7 - col
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				return {
					x: thickness > 0 ? pixelOffset + thickness / 2 : flatOffset,
					y: gridOffset - row * pixelSize,
					z: gridOffset - col * pixelSize
				};
			}
		},
		{
			key: "left",
			startX: 32,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(-Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 0 - d,
				gy: 7 - row,
				gz: col
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				return {
					x: -(thickness > 0 ? pixelOffset + thickness / 2 : flatOffset),
					y: gridOffset - row * pixelSize,
					z: -3.9375 + col * pixelSize
				};
			}
		},
		{
			key: "top",
			startX: 40,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateX(-Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: col,
				gy: 7 + d,
				gz: row
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				const d = thickness > 0 ? pixelOffset + thickness / 2 : flatOffset;
				return {
					x: -3.9375 + col * pixelSize,
					y: d,
					z: -3.9375 + row * pixelSize
				};
			}
		},
		{
			key: "bottom",
			startX: 48,
			startY: 0,
			applyRotation: (geom) => {
				geom.rotateZ(Math.PI);
				geom.rotateX(Math.PI / 2);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 - col,
				gy: 0 - d,
				gz: row
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				const d = thickness > 0 ? pixelOffset + thickness / 2 : flatOffset;
				return {
					x: gridOffset - col * pixelSize,
					y: -d,
					z: -3.9375 + row * pixelSize
				};
			}
		},
		{
			key: "front",
			startX: 40,
			startY: 8,
			applyRotation: (_geom) => {},
			getGridCoord: (col, row, d) => ({
				gx: col,
				gy: 7 - row,
				gz: 7 + d
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				const d = thickness > 0 ? pixelOffset + thickness / 2 : flatOffset;
				return {
					x: -3.9375 + col * pixelSize,
					y: gridOffset - row * pixelSize,
					z: d
				};
			}
		},
		{
			key: "back",
			startX: 56,
			startY: 8,
			applyRotation: (geom) => {
				geom.rotateY(Math.PI);
			},
			getGridCoord: (col, row, d) => ({
				gx: 7 - col,
				gy: 7 - row,
				gz: 0 - d
			}),
			getPos: (col, row, thickness, pixelOffset) => {
				const d = thickness > 0 ? pixelOffset + thickness / 2 : flatOffset;
				return {
					x: gridOffset - col * pixelSize,
					y: gridOffset - row * pixelSize,
					z: -d
				};
			}
		}
	];
	const geometries = [];
	faces.forEach((face) => {
		const faceHeightmap = heightmap ? heightmap[face.key] : null;
		for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
			const px = face.startX + col;
			const py = face.startY + row;
			const idx = (py * 64 + px) * 4;
			if (imgData.data[idx + 3] > 10) {
				const uMin = px / 64;
				const uMax = (px + 1) / 64;
				const vMin = (64 - (py + 1)) / 64;
				const vMax = (64 - py) / 64;
				const uCenter = (uMin + uMax) / 2;
				const vCenter = (vMin + vMax) / 2;
				if (heightmap) {
					let heightVal = faceHeightmap ? faceHeightmap[row]?.[col] ?? 1 : 1;
					if (heightVal === 0) heightVal = 1;
					const faceDefaultOffset = offsets[face.key] ?? 4;
					let activeLayers = [];
					if (heightVal === 1) activeLayers = [1];
					else if (heightVal === 2) activeLayers = [1, 2];
					else if (heightVal === 3) activeLayers = [2];
					else if (heightVal === 4) activeLayers = [2, 3];
					const freeLayers = [];
					activeLayers.forEach((d) => {
						const coord = face.getGridCoord(col, row, d);
						const coordKey = `${coord.gx},${coord.gy},${coord.gz}`;
						if (!occupied.has(coordKey)) {
							occupied.add(coordKey);
							freeLayers.push(d);
						}
					});
					if (freeLayers.length === 0) continue;
					const addBox = (thickness, pixelOffset) => {
						const geom = buildBoxGeometry(pixelSize, pixelSize, thickness, uMin, uMax, vMin, vMax);
						face.applyRotation(geom);
						const pos = face.getPos(col, row, thickness, pixelOffset);
						geom.translate(pos.x, pos.y, pos.z);
						geometries.push(geom);
					};
					if (heightVal === 1) addBox(.35, faceDefaultOffset);
					else if (heightVal === 2) {
						const hasL1 = freeLayers.includes(1);
						const hasL2 = freeLayers.includes(2);
						if (hasL1 && hasL2) addBox(.7, faceDefaultOffset);
						else if (hasL1) addBox(.35, faceDefaultOffset);
						else if (hasL2) addBox(.35, faceDefaultOffset + .35);
					} else if (heightVal === 3) addBox(.35, 4.15);
					else if (heightVal === 4) {
						const hasL2 = freeLayers.includes(2);
						const hasL3 = freeLayers.includes(3);
						if (hasL2 && hasL3) addBox(.7, 4.15);
						else if (hasL2) addBox(.35, 4.15);
						else if (hasL3) addBox(.35, 4.5);
					}
				} else {
					const geom = buildPlaneGeometry(pixelSize, pixelSize, uCenter, uCenter, vCenter, vCenter);
					face.applyRotation(geom);
					const pos = face.getPos(col, row, 0, 0);
					geom.translate(pos.x, pos.y, pos.z);
					geometries.push(geom);
				}
			}
		}
	});
	const voxelMaterial = new THREE.MeshStandardMaterial({
		roughness: .6,
		metalness: .1,
		side: THREE.DoubleSide
	});
	if (geometries.length > 0) {
		const mergedGeom = mergeBufferGeometries(geometries);
		geometries.forEach((g) => g.dispose());
		const mesh = new THREE.Mesh(mergedGeom, voxelMaterial);
		mesh.name = "HeadOverlay";
		group.add(mesh);
	}
	return group;
}
function assignNamedExportMaterials(object) {
	object.traverse((child) => {
		if (!(child instanceof THREE.Mesh) || !child.material) return;
		const materialName = child.name === "Head" ? "HeadMaterial" : "OverlayMaterial";
		if (Array.isArray(child.material)) child.material.forEach((material) => {
			material.name = materialName;
		});
		else child.material.name = materialName;
	});
}
function buildReliefExportGroup(skinImage, heightmap) {
	const exportGroup = new THREE.Group();
	exportGroup.name = "MinecraftHead";
	const voxelizedHead = buildBaseHead(skinImage);
	voxelizedHead.traverse((child) => {
		if (child instanceof THREE.Mesh && child.material) child.material.name = "HeadMaterial";
	});
	exportGroup.add(voxelizedHead);
	const reliefOverlay = buildVoxelizedOverlayWithRelief(skinImage, heightmap);
	reliefOverlay.traverse((child) => {
		if (child instanceof THREE.Mesh && child.material) child.material.name = "OverlayMaterial";
	});
	exportGroup.add(reliefOverlay);
	return exportGroup;
}
/**
* Exports the Three.js head model to OBJ + MTL + PNG format.
* Voxelizes the overlay layer as flat quads or 3D voxel cubes (if heightmap is provided) to ensure correct look in Roblox.
*/
function exportToOBJClassic(skinImage) {
	return new Promise((resolve, reject) => {
		try {
			const exportGroup = new THREE.Group();
			exportGroup.name = "MinecraftHead";
			const voxelizedHead = buildBaseHead(skinImage);
			voxelizedHead.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					if (child.material) child.material.name = "HeadMaterial";
				}
			});
			exportGroup.add(voxelizedHead);
			const voxelizedOverlay = buildVoxelizedOverlay(skinImage);
			voxelizedOverlay.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					if (child.material) child.material.name = "OverlayMaterial";
				}
			});
			exportGroup.add(voxelizedOverlay);
			const objText = `mtllib skinbridge_cabeza.mtl\n${new OBJExporter().parse(exportGroup)}`;
			const mtlText = `# Minecraft Head - Material Template Library
# Generated by Minecraft 3D Head Creator

newmtl HeadMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png

newmtl OverlayMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png
`;
			downloadTextFile(objText, "skinbridge_cabeza.obj", "text/plain");
			setTimeout(() => {
				downloadTextFile(mtlText, "skinbridge_cabeza.mtl", "text/plain");
			}, 200);
			setTimeout(async () => {
				await downloadSkinImage(skinImage, "skinbridge_textura.png");
				resolve();
			}, 400);
		} catch (error) {
			reject(error);
		}
	});
}
function exportToOBJWithRelief(skinImage, heightmap) {
	return new Promise((resolve, reject) => {
		try {
			const exportGroup = buildReliefExportGroup(skinImage, heightmap);
			assignNamedExportMaterials(exportGroup);
			const objText = `mtllib skinbridge_cabeza.mtl\n${new OBJExporter().parse(exportGroup)}`;
			const mtlText = `# Minecraft Head - Material Template Library
# Generated by Minecraft 3D Head Creator

newmtl HeadMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png

newmtl OverlayMaterial
Ka 1.000 1.000 1.000
Kd 1.000 1.000 1.000
Ks 0.000 0.000 0.000
Ns 10.000
d 1.000
illum 2
map_Kd skinbridge_textura.png
`;
			downloadTextFile(objText, "skinbridge_cabeza.obj", "text/plain");
			setTimeout(() => {
				downloadTextFile(mtlText, "skinbridge_cabeza.mtl", "text/plain");
			}, 200);
			setTimeout(async () => {
				await downloadSkinImage(skinImage, "skinbridge_textura.png");
				resolve();
			}, 400);
		} catch (error) {
			reject(error);
		}
	});
}
//#endregion
export { exportToOBJClassic as a, dilateTexture as i, buildReliefExportGroup as n, exportToOBJWithRelief as o, buildVoxelizedOverlay as r, build3DHead as s, buildBaseHead as t };
