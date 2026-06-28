import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
//#region src/modules/ThreeViewer.ts
var ThreeViewer = class {
	container;
	scene;
	camera;
	renderer;
	controls;
	gridHelper;
	headGroup = null;
	animationFrameId = null;
	paintCallback = null;
	paintEndCallback = null;
	isPainting3D = false;
	autoRotate = false;
	showGrid = true;
	_animationMode = "none";
	get animationMode() {
		return this._animationMode;
	}
	set animationMode(value) {
		this.resetPose();
		this._animationMode = value;
	}
	animationTime = 0;
	constructor(container) {
		this.container = container;
		this.init();
	}
	init() {
		const width = this.container.clientWidth || 800;
		const height = this.container.clientHeight || 500;
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(789518);
		this.scene.fog = new THREE.Fog(789518, 30, 80);
		this.camera = new THREE.PerspectiveCamera(45, width / height, .1, 1e3);
		this.camera.position.set(12, 12, 18);
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			preserveDrawingBuffer: true
		});
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1;
		this.container.innerHTML = "";
		this.container.appendChild(this.renderer.domElement);
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = .05;
		this.controls.maxPolarAngle = Math.PI;
		this.controls.minDistance = 5;
		this.controls.maxDistance = 60;
		this.controls.target.set(0, 0, 0);
		const ambientLight = new THREE.AmbientLight(16777215, .8);
		this.scene.add(ambientLight);
		const mainLight = new THREE.DirectionalLight(16777215, 1.5);
		mainLight.position.set(10, 20, 15);
		mainLight.castShadow = true;
		mainLight.shadow.mapSize.width = 1024;
		mainLight.shadow.mapSize.height = 1024;
		mainLight.shadow.bias = -5e-4;
		this.scene.add(mainLight);
		const fillLight = new THREE.DirectionalLight(10859772, .6);
		fillLight.position.set(-10, 5, -10);
		this.scene.add(fillLight);
		this.gridHelper = new THREE.GridHelper(100, 100, 5195493, 2565930);
		this.gridHelper.position.y = -5;
		this.scene.add(this.gridHelper);
		this.animate();
		window.addEventListener("resize", this.handleResize);
	}
	/**
	* Get the WebGL renderer DOM element (canvas) to take screenshots.
	*/
	getCanvas() {
		return this.renderer.domElement;
	}
	/**
	* Set or update the 3D Head model in the scene.
	*/
	setHeadModel(newHeadGroup, autoFrame = false) {
		if (this.headGroup === newHeadGroup) return;
		if (this.headGroup) {
			this.scene.remove(this.headGroup);
			this.disposeNode(this.headGroup);
		}
		this.headGroup = newHeadGroup;
		this.headGroup.position.set(0, 0, 0);
		this.scene.add(this.headGroup);
		if (autoFrame) {
			const box = new THREE.Box3().setFromObject(newHeadGroup);
			const size = new THREE.Vector3();
			box.getSize(size);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const maxDim = Math.max(size.x, size.y, size.z) || 1;
			const fov = this.camera.fov * (Math.PI / 180);
			let cameraDistance = maxDim / (2 * Math.tan(fov / 2));
			cameraDistance *= 1.5;
			const direction = new THREE.Vector3(1, .8, 1.2).normalize();
			const newCameraPosition = center.clone().add(direction.multiplyScalar(cameraDistance));
			this.camera.position.copy(newCameraPosition);
			this.controls.target.copy(center);
			this.controls.minDistance = Math.max(1, maxDim * .1);
			this.controls.maxDistance = Math.max(100, cameraDistance * 4);
			if (this.scene.fog instanceof THREE.Fog) {
				this.scene.fog.near = cameraDistance * .5;
				this.scene.fog.far = cameraDistance * 4;
			}
		} else this.controls.target.set(0, 0, 0);
		this.controls.update();
	}
	/**
	* Gets the current head model group.
	*/
	getHeadModel() {
		return this.headGroup;
	}
	/**
	* Toggles grid visibility.
	*/
	setGridVisible(visible) {
		this.showGrid = visible;
		this.gridHelper.visible = visible;
	}
	/**
	* Sets the grid height dynamically.
	*/
	setGridY(y) {
		this.gridHelper.position.y = y;
	}
	/**
	* Resets the camera position and target controls.
	*/
	resetCamera(position, target) {
		this.camera.position.copy(position);
		this.controls.target.copy(target);
		this.controls.update();
	}
	/**
	* Sets the visibility of a specific body part mesh.
	*/
	setPartVisibility(partName, visible) {
		if (!this.headGroup) return;
		this.headGroup.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				if ((child.userData?.meshName || child.name) === partName) child.visible = visible;
			}
		});
	}
	/**
	* Triggers a render frame manually.
	*/
	renderOnce() {
		this.renderer.render(this.scene, this.camera);
	}
	/**
	* Render Loop
	*/
	animate = () => {
		this.animationFrameId = requestAnimationFrame(this.animate);
		this.controls.update();
		if (this.headGroup && this.autoRotate) this.headGroup.rotation.y += .005;
		if (this.headGroup && this.animationMode !== "none") {
			this.animationTime += .016;
			const t = this.animationTime;
			const parts = {};
			this.headGroup.traverse((child) => {
				if (child.userData?.meshName) {
					if (!parts[child.userData.meshName]) parts[child.userData.meshName] = [];
					parts[child.userData.meshName].push(child);
				}
			});
			if (this.animationMode === "idle") {
				if (parts.torso) parts.torso.forEach((mesh) => {
					mesh.position.y = (mesh.userData.baseY ?? 0) + Math.sin(t * 1.2) * .04;
				});
				if (parts.head) parts.head.forEach((mesh) => {
					mesh.position.y = (mesh.userData.baseY ?? 2.6) + Math.sin(t * 1.2) * .04;
				});
				if (parts.rightArm) parts.rightArm.forEach((mesh) => {
					mesh.rotation.x = Math.sin(t * 1.2) * .08;
				});
				if (parts.leftArm) parts.leftArm.forEach((mesh) => {
					mesh.rotation.x = -Math.sin(t * 1.2) * .08;
				});
			}
			if (this.animationMode === "walk") {
				const speed = 2.5;
				if (parts.rightLeg) parts.rightLeg.forEach((mesh) => {
					mesh.rotation.x = Math.sin(t * speed) * .6;
				});
				if (parts.leftLeg) parts.leftLeg.forEach((mesh) => {
					mesh.rotation.x = -Math.sin(t * speed) * .6;
				});
				if (parts.rightArm) parts.rightArm.forEach((mesh) => {
					mesh.rotation.x = -Math.sin(t * speed) * .5;
				});
				if (parts.leftArm) parts.leftArm.forEach((mesh) => {
					mesh.rotation.x = Math.sin(t * speed) * .5;
				});
				if (parts.head) parts.head.forEach((mesh) => {
					mesh.position.y = (mesh.userData.baseY ?? 2.6) + Math.abs(Math.sin(t * speed * 2)) * .05;
				});
				if (parts.torso) parts.torso.forEach((mesh) => {
					mesh.position.y = (mesh.userData.baseY ?? 0) + Math.abs(Math.sin(t * speed * 2)) * .03;
				});
			}
		}
		this.renderer.render(this.scene, this.camera);
	};
	resetPose() {
		if (!this.headGroup) return;
		this.headGroup.traverse((child) => {
			if (child instanceof THREE.Object3D && child.userData?.meshName) {
				child.rotation.set(0, 0, 0);
				if (child.userData.baseY !== void 0) child.position.y = child.userData.baseY;
			}
		});
		this.animationTime = 0;
	}
	/**
	* Window Resize Handler
	*/
	handleResize = () => {
		if (!this.container || !this.renderer) return;
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	};
	/**
	* Deep disposal of 3D objects to prevent memory leaks.
	*/
	disposeNode(node) {
		node.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				if (child.geometry) child.geometry.dispose();
				if (child.material) if (Array.isArray(child.material)) child.material.forEach((mat) => mat.dispose());
				else child.material.dispose();
			}
		});
	}
	/**
	* Enable interactive 3D painting mode.
	*/
	enablePainting(onPaint, onPaintEnd) {
		this.paintCallback = onPaint;
		this.paintEndCallback = onPaintEnd;
		this.renderer.domElement.addEventListener("mousedown", this.handleMouseDownPaint);
		this.renderer.domElement.addEventListener("mousemove", this.handleMouseMovePaint);
		window.addEventListener("mouseup", this.handleMouseUpPaint);
	}
	/**
	* Disable interactive 3D painting mode.
	*/
	disablePainting() {
		this.paintCallback = null;
		this.paintEndCallback = null;
		if (this.renderer && this.renderer.domElement) {
			this.renderer.domElement.removeEventListener("mousedown", this.handleMouseDownPaint);
			this.renderer.domElement.removeEventListener("mousemove", this.handleMouseMovePaint);
		}
		window.removeEventListener("mouseup", this.handleMouseUpPaint);
		this.controls.enabled = true;
		this.isPainting3D = false;
	}
	handleMouseDownPaint = (e) => {
		if (e.button !== 0 || !this.paintCallback) return;
		const intersect = this.getPaintIntersection(e);
		if (intersect && intersect.face) {
			this.controls.enabled = false;
			this.isPainting3D = true;
			this.triggerPaintCallback(intersect);
		}
	};
	handleMouseMovePaint = (e) => {
		if (!this.isPainting3D || !this.paintCallback) return;
		const intersect = this.getPaintIntersection(e);
		if (intersect && intersect.face) this.triggerPaintCallback(intersect);
	};
	handleMouseUpPaint = () => {
		if (this.isPainting3D) {
			this.controls.enabled = true;
			this.isPainting3D = false;
			if (this.paintEndCallback) this.paintEndCallback();
		}
	};
	getPaintIntersection(e) {
		const rect = this.renderer.domElement.getBoundingClientRect();
		const mouse = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, this.camera);
		if (!this.headGroup) return null;
		const intersects = raycaster.intersectObjects(this.headGroup.children, true);
		return intersects.length > 0 ? intersects[0] : null;
	}
	triggerPaintCallback(intersect) {
		if (!this.paintCallback) return;
		const mesh = intersect.object;
		const materialIndex = intersect.face?.materialIndex;
		const uv = intersect.uv;
		const meshName = mesh.userData?.meshName || mesh.name;
		if (meshName && materialIndex !== void 0 && uv) this.paintCallback(meshName, materialIndex, uv);
	}
	/**
	* Destroy the viewer, clean up all listeners and webgl context.
	*/
	destroy() {
		this.disablePainting();
		window.removeEventListener("resize", this.handleResize);
		if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
		if (this.controls) this.controls.dispose();
		if (this.headGroup) this.disposeNode(this.headGroup);
		this.disposeNode(this.gridHelper);
		if (this.renderer) {
			this.renderer.dispose();
			if (this.renderer.domElement && this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
		}
	}
};
//#endregion
export { ThreeViewer as t };
