import { n as useTranslation, t as supabase } from "../main.mjs";
import { t as ThreeViewer } from "./ThreeViewer-CRwfpc2W.js";
import { n as checkRateLimit, t as RateLimitError } from "./rateLimit-BgQdUSFi.js";
import { Head } from "vite-react-ssg";
import { useEffect, useRef, useState } from "react";
import { Download, Grid, RotateCw, Upload } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
import * as THREE from "three";
import { nanoid } from "nanoid";
//#region src/modules/RobloxClothingExporter.ts
var MC_BODY = {
	top: {
		x: 20,
		y: 16,
		w: 8,
		h: 4
	},
	bottom: {
		x: 28,
		y: 16,
		w: 8,
		h: 4
	},
	left: {
		x: 28,
		y: 20,
		w: 4,
		h: 12
	},
	front: {
		x: 20,
		y: 20,
		w: 8,
		h: 12
	},
	right: {
		x: 16,
		y: 20,
		w: 4,
		h: 12
	},
	back: {
		x: 32,
		y: 20,
		w: 8,
		h: 12
	}
};
var MC_BODY_OVERLAY = {
	top: {
		x: 20,
		y: 32,
		w: 8,
		h: 4
	},
	bottom: {
		x: 28,
		y: 32,
		w: 8,
		h: 4
	},
	left: {
		x: 28,
		y: 36,
		w: 4,
		h: 12
	},
	front: {
		x: 20,
		y: 36,
		w: 8,
		h: 12
	},
	right: {
		x: 16,
		y: 36,
		w: 4,
		h: 12
	},
	back: {
		x: 32,
		y: 36,
		w: 8,
		h: 12
	}
};
var MC_RIGHT_ARM_CLASSIC = {
	top: {
		x: 44,
		y: 16,
		w: 4,
		h: 4
	},
	bottom: {
		x: 48,
		y: 16,
		w: 4,
		h: 4
	},
	left: {
		x: 48,
		y: 20,
		w: 4,
		h: 12
	},
	front: {
		x: 44,
		y: 20,
		w: 4,
		h: 12
	},
	right: {
		x: 40,
		y: 20,
		w: 4,
		h: 12
	},
	back: {
		x: 52,
		y: 20,
		w: 4,
		h: 12
	}
};
var MC_RIGHT_ARM_OVERLAY_CLASSIC = {
	top: {
		x: 44,
		y: 32,
		w: 4,
		h: 4
	},
	bottom: {
		x: 48,
		y: 32,
		w: 4,
		h: 4
	},
	left: {
		x: 48,
		y: 36,
		w: 4,
		h: 12
	},
	front: {
		x: 44,
		y: 36,
		w: 4,
		h: 12
	},
	right: {
		x: 40,
		y: 36,
		w: 4,
		h: 12
	},
	back: {
		x: 52,
		y: 36,
		w: 4,
		h: 12
	}
};
var MC_RIGHT_ARM_SLIM = {
	top: {
		x: 44,
		y: 16,
		w: 3,
		h: 4
	},
	bottom: {
		x: 47,
		y: 16,
		w: 3,
		h: 4
	},
	left: {
		x: 47,
		y: 20,
		w: 4,
		h: 12
	},
	front: {
		x: 44,
		y: 20,
		w: 3,
		h: 12
	},
	right: {
		x: 40,
		y: 20,
		w: 4,
		h: 12
	},
	back: {
		x: 51,
		y: 20,
		w: 3,
		h: 12
	}
};
var MC_RIGHT_ARM_OVERLAY_SLIM = {
	top: {
		x: 44,
		y: 32,
		w: 3,
		h: 4
	},
	bottom: {
		x: 47,
		y: 32,
		w: 3,
		h: 4
	},
	left: {
		x: 47,
		y: 36,
		w: 4,
		h: 12
	},
	front: {
		x: 44,
		y: 36,
		w: 3,
		h: 12
	},
	right: {
		x: 40,
		y: 36,
		w: 4,
		h: 12
	},
	back: {
		x: 51,
		y: 36,
		w: 3,
		h: 12
	}
};
var MC_LEFT_ARM_CLASSIC = {
	top: {
		x: 36,
		y: 48,
		w: 4,
		h: 4
	},
	bottom: {
		x: 40,
		y: 48,
		w: 4,
		h: 4
	},
	left: {
		x: 40,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 36,
		y: 52,
		w: 4,
		h: 12
	},
	right: {
		x: 32,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 44,
		y: 52,
		w: 4,
		h: 12
	}
};
var MC_LEFT_ARM_OVERLAY_CLASSIC = {
	top: {
		x: 52,
		y: 48,
		w: 4,
		h: 4
	},
	bottom: {
		x: 56,
		y: 48,
		w: 4,
		h: 4
	},
	left: {
		x: 56,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 52,
		y: 52,
		w: 4,
		h: 12
	},
	right: {
		x: 48,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 60,
		y: 52,
		w: 4,
		h: 12
	}
};
var MC_LEFT_ARM_SLIM = {
	top: {
		x: 36,
		y: 48,
		w: 3,
		h: 4
	},
	bottom: {
		x: 39,
		y: 48,
		w: 3,
		h: 4
	},
	left: {
		x: 39,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 36,
		y: 52,
		w: 3,
		h: 12
	},
	right: {
		x: 32,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 43,
		y: 52,
		w: 3,
		h: 12
	}
};
var MC_LEFT_ARM_OVERLAY_SLIM = {
	top: {
		x: 52,
		y: 48,
		w: 3,
		h: 4
	},
	bottom: {
		x: 55,
		y: 48,
		w: 3,
		h: 4
	},
	left: {
		x: 55,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 52,
		y: 52,
		w: 3,
		h: 12
	},
	right: {
		x: 48,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 59,
		y: 52,
		w: 3,
		h: 12
	}
};
var MC_RIGHT_LEG = {
	top: {
		x: 4,
		y: 16,
		w: 4,
		h: 4
	},
	bottom: {
		x: 8,
		y: 16,
		w: 4,
		h: 4
	},
	left: {
		x: 8,
		y: 20,
		w: 4,
		h: 12
	},
	front: {
		x: 4,
		y: 20,
		w: 4,
		h: 12
	},
	right: {
		x: 0,
		y: 20,
		w: 4,
		h: 12
	},
	back: {
		x: 12,
		y: 20,
		w: 4,
		h: 12
	}
};
var MC_RIGHT_LEG_OVERLAY = {
	top: {
		x: 4,
		y: 32,
		w: 4,
		h: 4
	},
	bottom: {
		x: 8,
		y: 32,
		w: 4,
		h: 4
	},
	left: {
		x: 8,
		y: 36,
		w: 4,
		h: 12
	},
	front: {
		x: 4,
		y: 36,
		w: 4,
		h: 12
	},
	right: {
		x: 0,
		y: 36,
		w: 4,
		h: 12
	},
	back: {
		x: 12,
		y: 36,
		w: 4,
		h: 12
	}
};
var MC_LEFT_LEG = {
	top: {
		x: 20,
		y: 48,
		w: 4,
		h: 4
	},
	bottom: {
		x: 24,
		y: 48,
		w: 4,
		h: 4
	},
	left: {
		x: 24,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 20,
		y: 52,
		w: 4,
		h: 12
	},
	right: {
		x: 16,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 28,
		y: 52,
		w: 4,
		h: 12
	}
};
var MC_LEFT_LEG_OVERLAY = {
	top: {
		x: 4,
		y: 48,
		w: 4,
		h: 4
	},
	bottom: {
		x: 8,
		y: 48,
		w: 4,
		h: 4
	},
	left: {
		x: 8,
		y: 52,
		w: 4,
		h: 12
	},
	front: {
		x: 4,
		y: 52,
		w: 4,
		h: 12
	},
	right: {
		x: 0,
		y: 52,
		w: 4,
		h: 12
	},
	back: {
		x: 12,
		y: 52,
		w: 4,
		h: 12
	}
};
var ROBLOX_TORSO$1 = {
	top: {
		x: 231,
		y: 8,
		w: 128,
		h: 64
	},
	left: {
		x: 361,
		y: 74,
		w: 64,
		h: 128
	},
	front: {
		x: 231,
		y: 74,
		w: 128,
		h: 128
	},
	right: {
		x: 165,
		y: 74,
		w: 64,
		h: 128
	},
	back: {
		x: 427,
		y: 74,
		w: 128,
		h: 128
	},
	bottom: {
		x: 231,
		y: 204,
		w: 128,
		h: 64
	}
};
var ROBLOX_RIGHT_LIMB$1 = {
	top: {
		x: 217,
		y: 289,
		w: 64,
		h: 64
	},
	left: {
		x: 19,
		y: 355,
		w: 64,
		h: 128
	},
	back: {
		x: 85,
		y: 355,
		w: 64,
		h: 128
	},
	right: {
		x: 151,
		y: 355,
		w: 64,
		h: 128
	},
	front: {
		x: 217,
		y: 355,
		w: 64,
		h: 128
	},
	bottom: {
		x: 217,
		y: 485,
		w: 64,
		h: 64
	}
};
var ROBLOX_LEFT_LIMB$1 = {
	top: {
		x: 308,
		y: 289,
		w: 64,
		h: 64
	},
	front: {
		x: 308,
		y: 355,
		w: 64,
		h: 128
	},
	left: {
		x: 374,
		y: 355,
		w: 64,
		h: 128
	},
	back: {
		x: 440,
		y: 355,
		w: 64,
		h: 128
	},
	right: {
		x: 506,
		y: 355,
		w: 64,
		h: 128
	},
	bottom: {
		x: 308,
		y: 485,
		w: 64,
		h: 64
	}
};
var TEMPLATE_WIDTH = 585;
var TEMPLATE_HEIGHT = 559;
/**
* Extract pixel data from the Minecraft skin image.
*/
function getSkinPixels(skinImage) {
	const canvas = document.createElement("canvas");
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 64, 64);
	return ctx.getImageData(0, 0, 64, 64);
}
/**
* Draws a Minecraft skin face onto the Roblox template canvas using
* nearest-neighbor scaling (no interpolation) for pixel-perfect results.
* 
* @param ctx - Destination canvas context (585×559)
* @param skinData - Source pixel data from the 64×64 skin
* @param src - Source rectangle in the Minecraft skin
* @param dst - Destination rectangle in the Roblox template
*/
function drawFaceScaled(ctx, skinData, src, dst, flipH = false, flipV = false) {
	const scaleX = dst.w / src.w;
	const scaleY = dst.h / src.h;
	for (let dy = 0; dy < dst.h; dy++) for (let dx = 0; dx < dst.w; dx++) {
		let sx = Math.floor(dx / scaleX);
		let sy = Math.floor(dy / scaleY);
		if (flipH) sx = src.w - 1 - sx;
		if (flipV) sy = src.h - 1 - sy;
		const srcIdx = ((src.y + sy) * 64 + (src.x + sx)) * 4;
		const r = skinData.data[srcIdx];
		const g = skinData.data[srcIdx + 1];
		const b = skinData.data[srcIdx + 2];
		const a = skinData.data[srcIdx + 3];
		if (a === 0) continue;
		if (a < 255) {
			const existing = ctx.getImageData(dst.x + dx, dst.y + dy, 1, 1);
			const er = existing.data[0], eg = existing.data[1], eb = existing.data[2], ea = existing.data[3];
			const alpha = a / 255;
			const invAlpha = 1 - alpha;
			ctx.fillStyle = `rgba(${Math.round(r * alpha + er * invAlpha)},${Math.round(g * alpha + eg * invAlpha)},${Math.round(b * alpha + eb * invAlpha)},${Math.max(ea / 255, alpha)})`;
		} else ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
		ctx.fillRect(dst.x + dx, dst.y + dy, 1, 1);
	}
}
/**
* Maps all faces of a body part from Minecraft source to Roblox destination.
*/
function mapBodyPart(ctx, skinData, mcPart, robloxPart, _partName) {
	for (const face of [
		"front",
		"back",
		"left",
		"right",
		"top",
		"bottom"
	]) {
		let flipH = false;
		let flipV = false;
		if (face === "bottom") flipV = true;
		drawFaceScaled(ctx, skinData, mcPart[face], robloxPart[face], flipH, flipV);
	}
}
/**
* Downloads a canvas as a PNG file.
*/
function downloadCanvasAsPNG(canvas, filename) {
	return new Promise((resolve) => {
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
* Automatically detects if the Minecraft skin is Slim (3px arms / Alex) or Classic (4px arms / Steve)
* by checking if the unused pixel columns in the arm textures are completely transparent.
*/
function detectIsSlimSkin(skinData) {
	let rightArmUnusedOpaque = false;
	for (let y = 20; y < 32; y++) {
		const idx = (y * 64 + 54) * 4;
		if (skinData.data[idx + 3] !== 0) {
			rightArmUnusedOpaque = true;
			break;
		}
	}
	let leftArmUnusedOpaque = false;
	for (let y = 52; y < 64; y++) {
		const idx = (y * 64 + 46) * 4;
		if (skinData.data[idx + 3] !== 0) {
			leftArmUnusedOpaque = true;
			break;
		}
	}
	return !rightArmUnusedOpaque && !leftArmUnusedOpaque;
}
/**
* Helper to detect if a Minecraft skin is Slim (Alex) format based on image pixels.
*/
function isSlimSkin(skinImage) {
	try {
		return detectIsSlimSkin(getSkinPixels(skinImage));
	} catch (e) {
		return false;
	}
}
/**
* Generates a Roblox Classic Shirt template (585×559) canvas from a Minecraft skin.
* Contains: Torso (front, back, left, right, top, bottom) + Both Arms.
* Does NOT include head or legs.
* 
* Composites base layer + overlay layer for pixel-perfect accuracy.
* Automatically detects and handles Slim (3px) and Classic (4px) arm textures.
*/
/**
* Draws a pixelated/square watermark "skinbridge.vercel.app" in the bottom-right corner of the template (empty area).
*/
function drawWatermark(ctx) {
	const text = "skinbridge.vercel.app";
	const scale = 2;
	const charWidth = 3;
	const charHeight = 5;
	const pixelWidth = 83 * scale;
	const pixelHeight = charHeight * scale;
	const startX = TEMPLATE_WIDTH - pixelWidth - 15;
	const startY = TEMPLATE_HEIGHT - pixelHeight - 15;
	const font = {
		"a": [
			"###",
			"# #",
			"###",
			"# #",
			"# #"
		],
		"b": [
			"## ",
			"# #",
			"## ",
			"# #",
			"## "
		],
		"c": [
			"###",
			"#  ",
			"#  ",
			"#  ",
			"###"
		],
		"d": [
			"## ",
			"# #",
			"# #",
			"# #",
			"## "
		],
		"e": [
			"###",
			"#  ",
			"## ",
			"#  ",
			"###"
		],
		"g": [
			"###",
			"#  ",
			"# #",
			"# #",
			"###"
		],
		"i": [
			"###",
			" # ",
			" # ",
			" # ",
			"###"
		],
		"k": [
			"# #",
			"## ",
			"#  ",
			"## ",
			"# #"
		],
		"l": [
			"#  ",
			"#  ",
			"#  ",
			"#  ",
			"###"
		],
		"n": [
			"###",
			"# #",
			"# #",
			"# #",
			"# #"
		],
		"p": [
			"###",
			"# #",
			"###",
			"#  ",
			"#  "
		],
		"r": [
			"## ",
			"# #",
			"## ",
			"# #",
			"# #"
		],
		"s": [
			"###",
			"#  ",
			"###",
			"  #",
			"###"
		],
		"v": [
			"# #",
			"# #",
			"# #",
			"# #",
			" # "
		],
		".": [
			"   ",
			"   ",
			"   ",
			"   ",
			" # "
		]
	};
	const drawPass = (color, offsetX, offsetY) => {
		ctx.fillStyle = color;
		let curX = startX + offsetX;
		const curY = startY + offsetY;
		for (let i = 0; i < 21; i++) {
			const glyph = font[text[i]];
			if (glyph) for (let r = 0; r < charHeight; r++) {
				const row = glyph[r];
				for (let c = 0; c < charWidth; c++) if (row[c] === "#") ctx.fillRect(curX + c * scale, curY + r * scale, scale, scale);
			}
			curX += 4 * scale;
		}
	};
	const outlineOffset = 1;
	const outlineOffsets = [
		[-1, 0],
		[outlineOffset, 0],
		[0, -1],
		[0, outlineOffset],
		[-1, -1],
		[-1, outlineOffset],
		[outlineOffset, -1],
		[outlineOffset, outlineOffset]
	];
	for (const [ox, oy] of outlineOffsets) drawPass("rgba(0, 0, 0, 0.8)", ox, oy);
	drawPass("rgba(255, 255, 255, 0.9)", 0, 0);
}
function generateRobloxShirtCanvas(skinImage, isSlimOverride) {
	const skinData = getSkinPixels(skinImage);
	const isSlim = isSlimOverride !== void 0 ? isSlimOverride : detectIsSlimSkin(skinData);
	const canvas = document.createElement("canvas");
	canvas.width = TEMPLATE_WIDTH;
	canvas.height = TEMPLATE_HEIGHT;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
	const rightArm = isSlim ? MC_RIGHT_ARM_SLIM : MC_RIGHT_ARM_CLASSIC;
	const leftArm = isSlim ? MC_LEFT_ARM_SLIM : MC_LEFT_ARM_CLASSIC;
	const rightArmOverlay = isSlim ? MC_RIGHT_ARM_OVERLAY_SLIM : MC_RIGHT_ARM_OVERLAY_CLASSIC;
	const leftArmOverlay = isSlim ? MC_LEFT_ARM_OVERLAY_SLIM : MC_LEFT_ARM_OVERLAY_CLASSIC;
	mapBodyPart(ctx, skinData, MC_BODY, ROBLOX_TORSO$1, "torso");
	mapBodyPart(ctx, skinData, rightArm, ROBLOX_RIGHT_LIMB$1);
	mapBodyPart(ctx, skinData, leftArm, ROBLOX_LEFT_LIMB$1);
	mapBodyPart(ctx, skinData, MC_BODY_OVERLAY, ROBLOX_TORSO$1, "torso");
	mapBodyPart(ctx, skinData, rightArmOverlay, ROBLOX_RIGHT_LIMB$1);
	mapBodyPart(ctx, skinData, leftArmOverlay, ROBLOX_LEFT_LIMB$1);
	drawWatermark(ctx);
	return canvas;
}
/**
* Generates a Roblox Classic Pants template (585×559) canvas from a Minecraft skin.
* Contains: Torso (the pants template includes torso for waist area) + Both Legs.
* Does NOT include head or arms.
* 
* Composites base layer + overlay layer for pixel-perfect accuracy.
*/
function generateRobloxPantsCanvas(skinImage) {
	const skinData = getSkinPixels(skinImage);
	const canvas = document.createElement("canvas");
	canvas.width = TEMPLATE_WIDTH;
	canvas.height = TEMPLATE_HEIGHT;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
	mapBodyPart(ctx, skinData, MC_BODY, ROBLOX_TORSO$1, "torso");
	mapBodyPart(ctx, skinData, MC_RIGHT_LEG, ROBLOX_RIGHT_LIMB$1);
	mapBodyPart(ctx, skinData, MC_LEFT_LEG, ROBLOX_LEFT_LIMB$1);
	mapBodyPart(ctx, skinData, MC_BODY_OVERLAY, ROBLOX_TORSO$1, "torso");
	mapBodyPart(ctx, skinData, MC_RIGHT_LEG_OVERLAY, ROBLOX_RIGHT_LIMB$1);
	mapBodyPart(ctx, skinData, MC_LEFT_LEG_OVERLAY, ROBLOX_LEFT_LIMB$1);
	drawWatermark(ctx);
	return canvas;
}
/**
* Exports a Roblox Classic Shirt template (585×559) from a Minecraft skin.
*/
function exportRobloxShirt(skinImage, isSlimOverride) {
	return downloadCanvasAsPNG(generateRobloxShirtCanvas(skinImage, isSlimOverride), "skinbridge_shirt.png");
}
/**
* Exports a Roblox Classic Pants template (585×559) from a Minecraft skin.
*/
function exportRobloxPants(skinImage) {
	return downloadCanvasAsPNG(generateRobloxPantsCanvas(skinImage), "skinbridge_pants.png");
}
/**
* Draws a 2D preview of Roblox Classic clothing (shirt or pants) for a specific view
* (front, back, left, right) onto a destination canvas.
*/
function drawRobloxPreview(type, view, skinImage, destCanvas, isSlimOverride) {
	const templateCanvas = type === "shirt" ? generateRobloxShirtCanvas(skinImage, isSlimOverride) : generateRobloxPantsCanvas(skinImage);
	const destCtx = destCanvas.getContext("2d");
	if (!destCtx) return;
	destCtx.imageSmoothingEnabled = false;
	const copyRect = (srcRect, dx, dy, dw, dh) => {
		destCtx.drawImage(templateCanvas, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dx, dy, dw, dh);
	};
	if (type === "shirt") {
		if (view === "front") {
			destCanvas.width = 256;
			destCanvas.height = 128;
			destCtx.clearRect(0, 0, 256, 128);
			copyRect(ROBLOX_RIGHT_LIMB$1.front, 0, 0, 64, 128);
			copyRect(ROBLOX_TORSO$1.front, 64, 0, 128, 128);
			copyRect(ROBLOX_LEFT_LIMB$1.front, 192, 0, 64, 128);
		} else if (view === "back") {
			destCanvas.width = 256;
			destCanvas.height = 128;
			destCtx.clearRect(0, 0, 256, 128);
			copyRect(ROBLOX_LEFT_LIMB$1.back, 0, 0, 64, 128);
			copyRect(ROBLOX_TORSO$1.back, 64, 0, 128, 128);
			copyRect(ROBLOX_RIGHT_LIMB$1.back, 192, 0, 64, 128);
		} else if (view === "left") {
			destCanvas.width = 128;
			destCanvas.height = 128;
			destCtx.clearRect(0, 0, 128, 128);
			copyRect(ROBLOX_TORSO$1.left, 0, 0, 64, 128);
			copyRect(ROBLOX_LEFT_LIMB$1.left, 64, 0, 64, 128);
		} else if (view === "right") {
			destCanvas.width = 128;
			destCanvas.height = 128;
			destCtx.clearRect(0, 0, 128, 128);
			copyRect(ROBLOX_RIGHT_LIMB$1.right, 0, 0, 64, 128);
			copyRect(ROBLOX_TORSO$1.right, 64, 0, 64, 128);
		}
	} else if (view === "front") {
		destCanvas.width = 128;
		destCanvas.height = 256;
		destCtx.clearRect(0, 0, 128, 256);
		copyRect(ROBLOX_TORSO$1.front, 0, 0, 128, 128);
		copyRect(ROBLOX_RIGHT_LIMB$1.front, 0, 128, 64, 128);
		copyRect(ROBLOX_LEFT_LIMB$1.front, 64, 128, 64, 128);
	} else if (view === "back") {
		destCanvas.width = 128;
		destCanvas.height = 256;
		destCtx.clearRect(0, 0, 128, 256);
		copyRect(ROBLOX_TORSO$1.back, 0, 0, 128, 128);
		copyRect(ROBLOX_LEFT_LIMB$1.back, 0, 128, 64, 128);
		copyRect(ROBLOX_RIGHT_LIMB$1.back, 64, 128, 64, 128);
	} else if (view === "left") {
		destCanvas.width = 64;
		destCanvas.height = 256;
		destCtx.clearRect(0, 0, 64, 256);
		copyRect(ROBLOX_TORSO$1.left, 0, 0, 64, 128);
		copyRect(ROBLOX_LEFT_LIMB$1.left, 0, 128, 64, 128);
	} else if (view === "right") {
		destCanvas.width = 64;
		destCanvas.height = 256;
		destCtx.clearRect(0, 0, 64, 256);
		copyRect(ROBLOX_TORSO$1.right, 0, 0, 64, 128);
		copyRect(ROBLOX_RIGHT_LIMB$1.right, 0, 128, 64, 128);
	}
}
//#endregion
//#region src/modules/RobloxAvatarBuilder.ts
var ROBLOX_TORSO = {
	top: {
		x: 231,
		y: 8,
		w: 128,
		h: 64
	},
	left: {
		x: 361,
		y: 74,
		w: 64,
		h: 128
	},
	front: {
		x: 231,
		y: 74,
		w: 128,
		h: 128
	},
	right: {
		x: 165,
		y: 74,
		w: 64,
		h: 128
	},
	back: {
		x: 427,
		y: 74,
		w: 128,
		h: 128
	},
	bottom: {
		x: 231,
		y: 204,
		w: 128,
		h: 64
	}
};
var ROBLOX_RIGHT_LIMB = {
	top: {
		x: 217,
		y: 289,
		w: 64,
		h: 64
	},
	left: {
		x: 19,
		y: 355,
		w: 64,
		h: 128
	},
	back: {
		x: 85,
		y: 355,
		w: 64,
		h: 128
	},
	right: {
		x: 151,
		y: 355,
		w: 64,
		h: 128
	},
	front: {
		x: 217,
		y: 355,
		w: 64,
		h: 128
	},
	bottom: {
		x: 217,
		y: 485,
		w: 64,
		h: 64
	}
};
var ROBLOX_LEFT_LIMB = {
	top: {
		x: 308,
		y: 289,
		w: 64,
		h: 64
	},
	front: {
		x: 308,
		y: 355,
		w: 64,
		h: 128
	},
	left: {
		x: 374,
		y: 355,
		w: 64,
		h: 128
	},
	back: {
		x: 440,
		y: 355,
		w: 64,
		h: 128
	},
	right: {
		x: 506,
		y: 355,
		w: 64,
		h: 128
	},
	bottom: {
		x: 308,
		y: 485,
		w: 64,
		h: 64
	}
};
var ROBLOX_HEAD_COORDS = {
	left: {
		x: 16,
		y: 8,
		w: 8,
		h: 8
	},
	right: {
		x: 0,
		y: 8,
		w: 8,
		h: 8
	},
	top: {
		x: 8,
		y: 0,
		w: 8,
		h: 8
	},
	bottom: {
		x: 16,
		y: 0,
		w: 8,
		h: 8
	},
	front: {
		x: 8,
		y: 8,
		w: 8,
		h: 8
	},
	back: {
		x: 24,
		y: 8,
		w: 8,
		h: 8
	}
};
function generateHeadCanvas(skinImage) {
	const canvas = document.createElement("canvas");
	canvas.width = 32;
	canvas.height = 16;
	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(skinImage, 0, 0, 32, 16, 0, 0, 32, 16);
	ctx.drawImage(skinImage, 32, 0, 32, 16, 0, 0, 32, 16);
	return canvas;
}
/**
* Builds a 3D Roblox R6 Avatar dummy and applies the generated Shirt
* and Pants textures onto its parts in real-time.
*/
function buildRobloxAvatar(skinImage, isSlimOverride) {
	const group = new THREE.Group();
	const shirtCanvas = generateRobloxShirtCanvas(skinImage, isSlimOverride);
	const pantsCanvas = generateRobloxPantsCanvas(skinImage);
	const headCanvas = generateHeadCanvas(skinImage);
	const getTexture = (canvas, rect) => {
		const faceCanvas = document.createElement("canvas");
		faceCanvas.width = rect.w;
		faceCanvas.height = rect.h;
		const ctx = faceCanvas.getContext("2d");
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
	const createMaterials = (canvas, coords) => {
		return [
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.left),
				transparent: true,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.right),
				transparent: true,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.top),
				transparent: true,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.bottom),
				transparent: true,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.front),
				transparent: true,
				side: THREE.DoubleSide
			}),
			new THREE.MeshBasicMaterial({
				map: getTexture(canvas, coords.back),
				transparent: true,
				side: THREE.DoubleSide
			})
		];
	};
	const torsoGeomShirt = new THREE.BoxGeometry(2, 2, 1);
	const torsoMaterialsShirt = createMaterials(shirtCanvas, ROBLOX_TORSO);
	const torsoMeshShirt = new THREE.Mesh(torsoGeomShirt, torsoMaterialsShirt);
	torsoMeshShirt.position.set(0, 1, 0);
	torsoMeshShirt.userData = {
		meshName: "torso",
		isPants: false
	};
	torsoMeshShirt.userData.baseY = torsoMeshShirt.position.y;
	group.add(torsoMeshShirt);
	const torsoGeomPants = new THREE.BoxGeometry(2.01, 2.01, 1.01);
	const torsoMaterialsPants = createMaterials(pantsCanvas, ROBLOX_TORSO);
	const torsoMeshPants = new THREE.Mesh(torsoGeomPants, torsoMaterialsPants);
	torsoMeshPants.position.set(0, 1, 0);
	torsoMeshPants.userData = {
		meshName: "torso",
		isPants: true
	};
	torsoMeshPants.userData.baseY = torsoMeshPants.position.y;
	group.add(torsoMeshPants);
	const rightArmGeom = new THREE.BoxGeometry(1, 2, 1);
	const rightArmMaterials = createMaterials(shirtCanvas, ROBLOX_RIGHT_LIMB);
	const rightArmMesh = new THREE.Mesh(rightArmGeom, rightArmMaterials);
	rightArmMesh.position.set(-1.5, 1, 0);
	rightArmMesh.userData = { meshName: "rightArm" };
	group.add(rightArmMesh);
	const leftArmGeom = new THREE.BoxGeometry(1, 2, 1);
	const leftArmMaterials = createMaterials(shirtCanvas, ROBLOX_LEFT_LIMB);
	const leftArmMesh = new THREE.Mesh(leftArmGeom, leftArmMaterials);
	leftArmMesh.position.set(1.5, 1, 0);
	leftArmMesh.userData = { meshName: "leftArm" };
	group.add(leftArmMesh);
	const rightLegGeom = new THREE.BoxGeometry(1, 2, 1);
	const rightLegMaterials = createMaterials(pantsCanvas, ROBLOX_RIGHT_LIMB);
	const rightLegMesh = new THREE.Mesh(rightLegGeom, rightLegMaterials);
	rightLegMesh.position.set(-.5, -1, 0);
	rightLegMesh.userData = { meshName: "rightLeg" };
	group.add(rightLegMesh);
	const leftLegGeom = new THREE.BoxGeometry(1, 2, 1);
	const leftLegMaterials = createMaterials(pantsCanvas, ROBLOX_LEFT_LIMB);
	const leftLegMesh = new THREE.Mesh(leftLegGeom, leftLegMaterials);
	leftLegMesh.position.set(.5, -1, 0);
	leftLegMesh.userData = { meshName: "leftLeg" };
	group.add(leftLegMesh);
	const headGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
	const headMaterials = createMaterials(headCanvas, ROBLOX_HEAD_COORDS);
	const headMesh = new THREE.Mesh(headGeom, headMaterials);
	headMesh.position.set(0, 2.6, 0);
	headMesh.userData = { meshName: "head" };
	headMesh.userData.baseY = headMesh.position.y;
	group.add(headMesh);
	const studGeom = new THREE.CylinderGeometry(.3, .3, .15, 16);
	const studMaterial = new THREE.MeshBasicMaterial({ color: 14983290 });
	const studMesh = new THREE.Mesh(studGeom, studMaterial);
	studMesh.position.set(0, 3.25, 0);
	studMesh.userData = { meshName: "head" };
	studMesh.userData.baseY = studMesh.position.y;
	group.add(studMesh);
	return group;
}
//#endregion
//#region src/hooks/useShareRoblox.ts
function useShareRoblox() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [shareUrl, setShareUrl] = useState(null);
	const [minutesLeft, setMinutesLeft] = useState(null);
	const share = async (shirtCanvas, pantsCanvas, previewCanvas, skinSrc, armType, creatorName, description) => {
		setLoading(true);
		setError(null);
		setShareUrl(null);
		setMinutesLeft(null);
		try {
			if (!shirtCanvas || !pantsCanvas) throw new Error("Shirt and Pants templates must be generated first.");
			await checkRateLimit("roblox");
			const slug = nanoid(10);
			const shirtBlob = await canvasToBlob(shirtCanvas);
			const pantsBlob = await canvasToBlob(pantsCanvas);
			const skinBlob = await dataUrlToBlob(skinSrc);
			const { error: skinUploadErr } = await supabase.storage.from("conversions").upload(`roblox/${slug}/skin.png`, skinBlob, { contentType: "image/png" });
			if (skinUploadErr) throw skinUploadErr;
			const { error: shirtUploadErr } = await supabase.storage.from("conversions").upload(`roblox/${slug}/shirt.png`, shirtBlob, { contentType: "image/png" });
			if (shirtUploadErr) throw shirtUploadErr;
			const { error: pantsUploadErr } = await supabase.storage.from("conversions").upload(`roblox/${slug}/pants.png`, pantsBlob, { contentType: "image/png" });
			if (pantsUploadErr) throw pantsUploadErr;
			let previewUrl = "";
			try {
				const previewBlob = await getPreviewBlob(previewCanvas);
				const { error: previewUploadErr } = await supabase.storage.from("conversions").upload(`roblox/${slug}/preview.png`, previewBlob, { contentType: "image/png" });
				if (!previewUploadErr) {
					const { data } = supabase.storage.from("conversions").getPublicUrl(`roblox/${slug}/preview.png`);
					previewUrl = data.publicUrl;
				}
			} catch (e) {
				console.warn("Optional 3D preview upload failed:", e);
			}
			const { data: skinUrlData } = supabase.storage.from("conversions").getPublicUrl(`roblox/${slug}/skin.png`);
			const { data: shirtUrlData } = supabase.storage.from("conversions").getPublicUrl(`roblox/${slug}/shirt.png`);
			const { data: pantsUrlData } = supabase.storage.from("conversions").getPublicUrl(`roblox/${slug}/pants.png`);
			const mappedArmType = armType === "slim" ? "alex" : "steve";
			const { error: dbErr } = await supabase.from("shares_roblox").insert({
				slug,
				skin_url: skinUrlData.publicUrl,
				shirt_url: shirtUrlData.publicUrl,
				pants_url: pantsUrlData.publicUrl,
				preview_url: previewUrl || null,
				arm_type: mappedArmType,
				creator_name: creatorName || null,
				description: description || null
			});
			if (dbErr) throw dbErr;
			const generatedUrl = `${window.location.origin}/share/roblox/${slug}`;
			setShareUrl(generatedUrl);
			return generatedUrl;
		} catch (err) {
			console.error("Error during Roblox share:", err);
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
function canvasToBlob(canvas) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(/* @__PURE__ */ new Error("Failed to capture canvas image"));
		}, "image/png");
	});
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
//#region src/components/RobloxWorkspace.tsx
function RobloxWorkspace({ skinImage, fileInputRef, handleFileChange, dragActive, handleDrag, handleDrop, triggerUploadClick, showToast, logExport }) {
	const { t } = useTranslation();
	const [robloxView, setRobloxView] = useState("front");
	const [showGrid, setShowGrid] = useState(true);
	const [autoRotate, setAutoRotate] = useState(false);
	const [armType, setArmType] = useState("classic");
	const [animMode, setAnimMode] = useState("none");
	const { share: shareRoblox, minutesLeft } = useShareRoblox();
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
			if (robloxViewerRef.current) {
				robloxViewerRef.current.renderOnce();
				previewCanvas = robloxViewerRef.current.getCanvas();
			}
			const url = await shareRoblox(fullShirtCanvasRef.current, fullPantsCanvasRef.current, previewCanvas, skinImage ? skinImage.src : "", armType, creatorName, description);
			setShareUrl(url);
			const historyStr = localStorage.getItem("shared_history") || "[]";
			const history = JSON.parse(historyStr);
			let previewUrl = "";
			if (previewCanvas) previewUrl = previewCanvas.toDataURL("image/png");
			const newHistoryItem = {
				slug: url.split("/").pop() || "",
				type: "roblox",
				creatorName: creatorName.trim() || "Anonymous",
				description: description.trim() || "",
				previewUrl,
				createdAt: Date.now(),
				skinUrl: skinImage?.src || ""
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
	const robloxContainerRef = useRef(null);
	const robloxViewerRef = useRef(null);
	const robloxShirtCanvasRef = useRef(null);
	const robloxPantsCanvasRef = useRef(null);
	const fullShirtCanvasRef = useRef(null);
	const fullPantsCanvasRef = useRef(null);
	useEffect(() => {
		if (skinImage) setArmType(isSlimSkin(skinImage) ? "slim" : "classic");
	}, [skinImage]);
	useEffect(() => {
		if (robloxContainerRef.current && !robloxViewerRef.current) {
			const viewer = new ThreeViewer(robloxContainerRef.current);
			robloxViewerRef.current = viewer;
			viewer.setGridY(-2);
			viewer.resetCamera(new THREE.Vector3(0, 1, 8), new THREE.Vector3(0, 1, 0));
		}
		return () => {
			if (robloxViewerRef.current) {
				robloxViewerRef.current.destroy();
				robloxViewerRef.current = null;
			}
		};
	}, []);
	useEffect(() => {
		if (robloxViewerRef.current && skinImage) {
			const avatarGroup = buildRobloxAvatar(skinImage, armType === "slim");
			avatarGroup.traverse((child) => {
				if (child instanceof THREE.Mesh && child.userData?.meshName === "head") child.visible = false;
			});
			robloxViewerRef.current.setHeadModel(avatarGroup);
		}
	}, [skinImage, armType]);
	useEffect(() => {
		if (robloxViewerRef.current) {
			robloxViewerRef.current.autoRotate = autoRotate;
			robloxViewerRef.current.setGridVisible(showGrid);
			robloxViewerRef.current.animationMode = animMode;
		}
	}, [
		autoRotate,
		showGrid,
		animMode
	]);
	useEffect(() => {
		if (skinImage) {
			const timer = setTimeout(() => {
				if (robloxShirtCanvasRef.current) drawRobloxPreview("shirt", robloxView, skinImage, robloxShirtCanvasRef.current, armType === "slim");
				if (robloxPantsCanvasRef.current) drawRobloxPreview("pants", robloxView, skinImage, robloxPantsCanvasRef.current);
				if (fullShirtCanvasRef.current) {
					const tempCanvas = generateRobloxShirtCanvas(skinImage, armType === "slim");
					const ctx = fullShirtCanvasRef.current.getContext("2d");
					if (ctx) {
						fullShirtCanvasRef.current.width = 585;
						fullShirtCanvasRef.current.height = 559;
						ctx.imageSmoothingEnabled = false;
						ctx.drawImage(tempCanvas, 0, 0);
					}
				}
				if (fullPantsCanvasRef.current) {
					const tempCanvas = generateRobloxPantsCanvas(skinImage);
					const ctx = fullPantsCanvasRef.current.getContext("2d");
					if (ctx) {
						fullPantsCanvasRef.current.width = 585;
						fullPantsCanvasRef.current.height = 559;
						ctx.imageSmoothingEnabled = false;
						ctx.drawImage(tempCanvas, 0, 0);
					}
				}
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [
		robloxView,
		skinImage,
		armType
	]);
	const handleExportRobloxShirt = async () => {
		if (!skinImage) {
			showToast("error", t("toast_load_skin_for_roblox"));
			return;
		}
		try {
			await exportRobloxShirt(skinImage, armType === "slim");
			showToast("success", t("toast_shirt_success"));
			logExport("Shirt", "skinbridge_shirt.png");
		} catch (err) {
			showToast("error", t("toast_shirt_error", { error: err.message }));
		}
	};
	const handleExportRobloxPants = async () => {
		if (!skinImage) {
			showToast("error", t("toast_load_skin_for_roblox"));
			return;
		}
		try {
			await exportRobloxPants(skinImage);
			showToast("success", t("toast_pants_success"));
			logExport("Pants", "skinbridge_pants.png");
		} catch (err) {
			showToast("error", t("toast_pants_error", { error: err.message }));
		}
	};
	const handleResetRobloxCamera = () => {
		if (robloxViewerRef.current) robloxViewerRef.current.resetCamera(new THREE.Vector3(0, 1, 8), new THREE.Vector3(0, 1, 0));
	};
	return /* @__PURE__ */ jsxs("main", {
		className: "main-grid",
		children: [
			/* @__PURE__ */ jsxs(Head, { children: [
				/* @__PURE__ */ jsx("title", { children: "Minecraft Skin to Roblox Shirt Converter | Classic Clothing Template" }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: "Convert Minecraft skins to Roblox clothing templates online. Generate classic Roblox shirts and pants with an interactive 3D R6 dummy preview."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: "Minecraft Skin to Roblox Shirt Converter"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: "Convert Minecraft skins to classic Roblox shirt and pants templates online."
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: "https://skinbridge.vercel.app/roblox"
				})
			] }),
			/* @__PURE__ */ jsxs("section", {
				className: "glass-panel sidebar-panel",
				children: [/* @__PURE__ */ jsxs("div", { children: [
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
				] }), /* @__PURE__ */ jsxs("div", {
					className: "skin-preview-section",
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "16px"
					},
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
							style: {
								margin: "0 0 6px 0",
								fontSize: "0.85rem",
								fontWeight: 600,
								color: "#a1a1aa"
							},
							children: t("avatar_view")
						}), /* @__PURE__ */ jsx("div", {
							className: "tabs-container",
							children: [
								"front",
								"back",
								"left",
								"right"
							].map((view) => /* @__PURE__ */ jsx("button", {
								className: `tab-btn ${robloxView === view ? "active" : ""}`,
								onClick: () => setRobloxView(view),
								style: { textTransform: "capitalize" },
								children: view === "front" ? t("view_front") : view === "back" ? t("view_back") : view === "left" ? t("view_left") : t("view_right")
							}, view))
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
							style: {
								margin: "0 0 6px 0",
								fontSize: "0.85rem",
								fontWeight: 600,
								color: "#a1a1aa"
							},
							children: t("arm_type")
						}), /* @__PURE__ */ jsxs("div", {
							className: "tabs-container",
							children: [/* @__PURE__ */ jsx("button", {
								className: `tab-btn ${armType === "classic" ? "active" : ""}`,
								onClick: () => setArmType("classic"),
								children: t("arm_classic")
							}), /* @__PURE__ */ jsx("button", {
								className: `tab-btn ${armType === "slim" ? "active" : ""}`,
								onClick: () => setArmType("slim"),
								children: t("arm_slim")
							})]
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							style: {
								margin: "0 0 6px 0",
								fontSize: "1rem",
								fontWeight: 600
							},
							children: t("preview_shirt")
						}), /* @__PURE__ */ jsx("div", {
							className: "skin-canvas-container",
							style: { minHeight: "160px" },
							children: /* @__PURE__ */ jsx("canvas", {
								ref: robloxShirtCanvasRef,
								style: {
									imageRendering: "pixelated",
									maxWidth: "100%",
									maxHeight: "130px",
									objectFit: "contain"
								}
							})
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							style: {
								margin: "0 0 6px 0",
								fontSize: "1rem",
								fontWeight: 600
							},
							children: t("preview_pants")
						}), /* @__PURE__ */ jsx("div", {
							className: "skin-canvas-container",
							style: { minHeight: "280px" },
							children: /* @__PURE__ */ jsx("canvas", {
								ref: robloxPantsCanvasRef,
								style: {
									imageRendering: "pixelated",
									maxWidth: "100%",
									maxHeight: "250px",
									objectFit: "contain"
								}
							})
						})] }),
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "10px",
								marginTop: "8px"
							},
							children: [
								/* @__PURE__ */ jsx("h3", {
									style: {
										margin: "0",
										fontSize: "1rem",
										fontWeight: 600
									},
									children: t("export_clothing")
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										display: "flex",
										gap: "10px"
									},
									children: [/* @__PURE__ */ jsxs("button", {
										className: "glow-btn-roblox",
										style: {
											flex: 1,
											padding: "10px 5px",
											fontSize: "0.85rem"
										},
										onClick: handleExportRobloxShirt,
										children: [
											/* @__PURE__ */ jsx(Download, { size: 14 }),
											" ",
											t("btn_shirt")
										]
									}), /* @__PURE__ */ jsxs("button", {
										className: "glow-btn-roblox",
										style: {
											flex: 1,
											padding: "10px 5px",
											fontSize: "0.85rem"
										},
										onClick: handleExportRobloxPants,
										children: [
											/* @__PURE__ */ jsx(Download, { size: 14 }),
											" ",
											t("btn_pants")
										]
									})]
								}),
								/* @__PURE__ */ jsxs("button", {
									className: "glow-btn",
									style: {
										padding: "10px",
										background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)",
										boxShadow: "none"
									},
									onClick: async () => {
										await handleExportRobloxShirt();
										await handleExportRobloxPants();
									},
									children: [
										/* @__PURE__ */ jsx(Download, { size: 16 }),
										" ",
										t("btn_download_both")
									]
								}),
								skinImage && /* @__PURE__ */ jsxs("button", {
									className: "glow-btn-secondary",
									style: {
										padding: "10px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "8px"
									},
									onClick: handleShareClick,
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
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "glass-panel viewer-panel",
				style: {
					display: "flex",
					flexDirection: "column",
					gap: "20px"
				},
				children: [
					/* @__PURE__ */ jsx("div", {
						ref: robloxContainerRef,
						className: "viewer-canvas-container",
						style: { minHeight: "400px" }
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "viewer-toolbar",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "toolbar-controls",
							children: [
								/* @__PURE__ */ jsxs("label", {
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
								}),
								/* @__PURE__ */ jsxs("label", {
									className: "toggle-container",
									style: {
										opacity: skinImage ? 1 : .5,
										cursor: skinImage ? "pointer" : "not-allowed"
									},
									children: [
										/* @__PURE__ */ jsx("input", {
											type: "checkbox",
											checked: autoRotate,
											onChange: (e) => setAutoRotate(e.target.checked),
											disabled: !skinImage,
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
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "i18n-selector-container",
									style: {
										display: "flex",
										gap: "4px",
										background: "rgba(255, 255, 255, 0.03)",
										padding: "2px",
										borderRadius: "8px",
										border: "1px solid rgba(255, 255, 255, 0.05)",
										marginLeft: "12px",
										opacity: skinImage ? 1 : .5
									},
									children: [
										/* @__PURE__ */ jsx("button", {
											className: `tab-btn ${animMode === "none" ? "active" : ""}`,
											onClick: () => setAnimMode("none"),
											disabled: !skinImage,
											style: {
												padding: "4px 10px",
												fontSize: "0.75rem",
												minWidth: "45px",
												flex: "none",
												cursor: skinImage ? "pointer" : "not-allowed",
												backgroundColor: animMode === "none" ? "var(--primary)" : "transparent",
												color: animMode === "none" ? "#ffffff" : void 0,
												border: animMode === "none" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent"
											},
											children: "None"
										}),
										/* @__PURE__ */ jsx("button", {
											className: `tab-btn ${animMode === "idle" ? "active" : ""}`,
											onClick: () => setAnimMode("idle"),
											disabled: !skinImage,
											style: {
												padding: "4px 10px",
												fontSize: "0.75rem",
												minWidth: "45px",
												flex: "none",
												cursor: skinImage ? "pointer" : "not-allowed",
												backgroundColor: animMode === "idle" ? "var(--primary)" : "transparent",
												color: animMode === "idle" ? "#ffffff" : void 0,
												border: animMode === "idle" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent"
											},
											children: "Idle"
										}),
										/* @__PURE__ */ jsx("button", {
											className: `tab-btn ${animMode === "walk" ? "active" : ""}`,
											onClick: () => setAnimMode("walk"),
											disabled: !skinImage,
											style: {
												padding: "4px 10px",
												fontSize: "0.75rem",
												minWidth: "45px",
												flex: "none",
												cursor: skinImage ? "pointer" : "not-allowed",
												backgroundColor: animMode === "walk" ? "var(--primary)" : "transparent",
												color: animMode === "walk" ? "#ffffff" : void 0,
												border: animMode === "walk" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent"
											},
											children: "Walk"
										})
									]
								})
							]
						}), /* @__PURE__ */ jsx("div", {
							className: "viewer-actions",
							children: /* @__PURE__ */ jsx("button", {
								className: "glow-btn-secondary",
								style: {
									padding: "8px 12px",
									fontSize: "0.85rem"
								},
								onClick: handleResetRobloxCamera,
								children: t("btn_front_view")
							})
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "roblox-templates-grid",
						style: {
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "20px",
							padding: "0 24px 24px 24px"
						},
						children: [/* @__PURE__ */ jsxs("div", {
							className: "template-card",
							children: [
								/* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "1rem",
										margin: 0
									},
									children: t("template_shirt_title")
								}),
								/* @__PURE__ */ jsx("div", {
									className: "template-canvas-container",
									style: {
										width: "100%",
										maxHeight: "200px",
										display: "flex",
										justifyContent: "center"
									},
									children: /* @__PURE__ */ jsx("canvas", {
										ref: fullShirtCanvasRef,
										className: "full-template-canvas",
										style: {
											maxWidth: "100%",
											maxHeight: "100%",
											objectFit: "contain",
											border: "1px solid rgba(255, 255, 255, 0.1)"
										}
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									className: "glow-btn-roblox",
									style: {
										width: "100%",
										maxWidth: "240px",
										padding: "10px"
									},
									onClick: handleExportRobloxShirt,
									children: [
										/* @__PURE__ */ jsx(Download, { size: 18 }),
										" ",
										t("btn_download_shirt")
									]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "template-card",
							children: [
								/* @__PURE__ */ jsx("h3", {
									style: {
										fontSize: "1rem",
										margin: 0
									},
									children: t("template_pants_title")
								}),
								/* @__PURE__ */ jsx("div", {
									className: "template-canvas-container",
									style: {
										width: "100%",
										maxHeight: "200px",
										display: "flex",
										justifyContent: "center"
									},
									children: /* @__PURE__ */ jsx("canvas", {
										ref: fullPantsCanvasRef,
										className: "full-template-canvas",
										style: {
											maxWidth: "100%",
											maxHeight: "100%",
											objectFit: "contain",
											border: "1px solid rgba(255, 255, 255, 0.1)"
										}
									})
								}),
								/* @__PURE__ */ jsxs("button", {
									className: "glow-btn-roblox",
									style: {
										width: "100%",
										maxWidth: "240px",
										padding: "10px"
									},
									onClick: handleExportRobloxPants,
									children: [
										/* @__PURE__ */ jsx(Download, { size: 18 }),
										" ",
										t("btn_download_pants")
									]
								})
							]
						})]
					})
				]
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
export { RobloxWorkspace as default };
