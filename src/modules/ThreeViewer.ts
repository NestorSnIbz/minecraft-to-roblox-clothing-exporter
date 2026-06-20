import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeViewer {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private gridHelper!: THREE.GridHelper;
  private headGroup: THREE.Group | null = null;
  private animationFrameId: number | null = null;

  // Options
  public autoRotate = false;
  public showGrid = true;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Create Scene with premium dark background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0c0e);
    this.scene.fog = new THREE.FogExp2(0x0c0c0e, 0.015);

    // 2. Create Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(12, 12, 18);

    // 3. Create WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Clear previous children and append canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Create OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // allow peering slightly from underneath but not completely upside down
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.target.set(0, 0, 0);

    // 5. Add Lights for high visual quality
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(10, 20, 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.6); // slight purple/indigo tint
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);

    // 6. Add Grid Helper for spatial context
    this.gridHelper = new THREE.GridHelper(40, 40, 0x4f46e5, 0x27272a); // Indigo and dark gray grid
    this.gridHelper.position.y = -5; // position below the head
    this.scene.add(this.gridHelper);

    // 7. Start Render Loop
    this.animate();

    // 8. Bind Resize Event
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Set or update the 3D Head model in the scene.
   */
  public setHeadModel(newHeadGroup: THREE.Group) {
    // Remove existing head model
    if (this.headGroup) {
      this.scene.remove(this.headGroup);
      this.disposeNode(this.headGroup);
    }

    this.headGroup = newHeadGroup;
    this.headGroup.position.set(0, 0, 0);
    this.scene.add(this.headGroup);

    // Auto-focus camera target on the model
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /**
   * Gets the current head model group.
   */
  public getHeadModel(): THREE.Group | null {
    return this.headGroup;
  }

  /**
   * Toggles grid visibility.
   */
  public setGridVisible(visible: boolean) {
    this.showGrid = visible;
    this.gridHelper.visible = visible;
  }

  /**
   * Triggers a render frame manually.
   */
  public renderOnce() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Render Loop
   */
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.controls.update();

    if (this.headGroup && this.autoRotate) {
      this.headGroup.rotation.y += 0.005;
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Window Resize Handler
   */
  private handleResize = () => {
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
  private disposeNode(node: THREE.Object3D) {
    node.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Destroy the viewer, clean up all listeners and webgl context.
   */
  public destroy() {
    window.removeEventListener('resize', this.handleResize);

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.headGroup) {
      this.disposeNode(this.headGroup);
    }

    this.disposeNode(this.gridHelper);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
