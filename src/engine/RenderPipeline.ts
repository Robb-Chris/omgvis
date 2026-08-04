import * as THREE from 'three';
import { generateGraphCoordinates, LayoutType } from './MathEngine';
import { DisplayMode } from '../store/useStore';

export class RenderPipeline {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;

  private instancedMesh: THREE.InstancedMesh | null = null;
  private networkLines: THREE.LineSegments | null = null;
  private starsPoints: THREE.Points | null = null;

  private selectionRing: THREE.Mesh | null = null;
  private hoverRing: THREE.Mesh | null = null;

  private maxN = 0;
  private coords: Float32Array = new Float32Array(0);
  private omega: Uint8Array = new Uint8Array(0);

  private _displayMode: DisplayMode = 'combined';
  private _layoutType: LayoutType = 'shells';
  private _selectedDepth: number | null = null;
  private _theme: 'dark' | 'light' = 'dark';
  private animationFrameId: number | null = null;

  // Smooth Camera Target Bounds (for silky smooth view transitions)
  private targetCamera = {
    left: -100,
    right: 100,
    top: 100,
    bottom: -100,
    zoom: 1.0,
  };

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-1000, -1000);
  private isPanning = false;
  private previousMousePosition = { x: 0, y: 0 };

  private selectedN: number | null = null;
  private _hoveredN: number | null = null;
  private matchingIndices: number[] = [];

  private onSelectN?: (n: number | null) => void;
  private onHoverN?: (n: number | null) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (2D Orthographic)
    const aspect = container.clientWidth / container.clientHeight;
    const viewSize = 120;
    this.camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      500000
    );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x020206, 1);
    container.appendChild(this.renderer.domElement);

    // Build massive 25x crisp starfield background & selection rings
    this.buildStarfield();
    this.buildSelectionRings();

    // Setup event listeners
    this.setupEventListeners();

    // Start render loop
    this.animate();
  }

  public setCallbacks(onSelect: (n: number | null) => void, onHover: (n: number | null) => void) {
    this.onSelectN = onSelect;
    this.onHoverN = onHover;
  }

  /**
   * Massive 25x deep space starfield galaxy background (250,000 x 250,000 units)
   * Uses sizeAttenuation=false so stars remain crisp pinprick dust points at ALL zoom levels!
   */
  private buildStarfield() {
    const starCount = 6500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const extent = 250000;

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * extent;
      positions[i * 3 + 1] = (Math.random() - 0.5) * extent;
      positions[i * 3 + 2] = -100;

      const alpha = 0.2 + Math.random() * 0.7;
      if (Math.random() > 0.5) {
        colors[i * 3] = 0.22 * alpha;
        colors[i * 3 + 1] = 0.74 * alpha;
        colors[i * 3 + 2] = 0.97 * alpha;
      } else {
        colors[i * 3] = 0.75 * alpha;
        colors[i * 3 + 1] = 0.52 * alpha;
        colors[i * 3 + 2] = 0.98 * alpha;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });

    this.starsPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starsPoints);
  }

  private buildSelectionRings() {
    const ringGeo = new THREE.RingGeometry(1.6, 2.4, 32);

    const selectMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    this.selectionRing = new THREE.Mesh(ringGeo, selectMat);
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.hoverRing = new THREE.Mesh(ringGeo, hoverMat);
    this.hoverRing.visible = false;
    this.scene.add(this.hoverRing);
  }

  /**
   * Sets Light or Dark Mode theme for full WebGL canvas clear color & palette!
   */
  public setTheme(theme: 'dark' | 'light') {
    this._theme = theme;
    if (theme === 'light') {
      this.renderer.setClearColor(0xf8fafc, 1);
      if (this.starsPoints) this.starsPoints.visible = false;
    } else {
      this.renderer.setClearColor(0x020206, 1);
      if (this.starsPoints) this.starsPoints.visible = true;
    }

    // Reapply filter with updated palette
    if (this.maxN > 0 && this.omega.length > 0) {
      this.applyFilter(this._displayMode, this._selectedDepth);
    }
  }

  public zoomIn() {
    this.targetCamera.zoom = Math.min(150, this.camera.zoom * 1.3);
  }

  public zoomOut() {
    this.targetCamera.zoom = Math.max(0.0005, this.camera.zoom * 0.7);
  }

  public resetCamera() {
    let radius = 100;
    const aspect = this.container.clientWidth / this.container.clientHeight;

    if (this._layoutType === 'shells') {
      let maxDepth = 1;
      if (this.omega && this.maxN > 0) {
        const limit = Math.min(this.maxN, this.omega.length - 1);
        for (let i = 1; i <= limit; i++) {
          if (this.omega[i] > maxDepth) maxDepth = this.omega[i];
        }
      }
      radius = (maxDepth + 1.2) * 40.0 + 35;
    } else if (this._layoutType === 'ulam') {
      radius = Math.sqrt(this.maxN) * 16.0 + 20;
    } else {
      // sacks
      radius = Math.sqrt(this.maxN) * 25.0 + 25;
    }

    this.targetCamera.left = -radius * aspect;
    this.targetCamera.right = radius * aspect;
    this.targetCamera.top = radius;
    this.targetCamera.bottom = -radius;
    this.targetCamera.zoom = 1.0;
  }

  /**
   * Rebuilds the Network Graph & InstancedMesh for integer range N using provided omega data.
   */
  public updateData(
    maxN: number,
    omegaData: Uint8Array,
    displayMode: DisplayMode,
    theme?: 'dark' | 'light',
    layoutType?: LayoutType,
    selectedDepth?: number | null
  ) {
    this.maxN = maxN;
    this.omega = omegaData;

    if (layoutType) {
      this._layoutType = layoutType;
    }

    if (selectedDepth !== undefined) {
      this._selectedDepth = selectedDepth;
    }

    if (theme) {
      this._theme = theme;
      if (theme === 'light') {
        this.renderer.setClearColor(0xf8fafc, 1);
        if (this.starsPoints) this.starsPoints.visible = false;
      } else {
        this.renderer.setClearColor(0x020206, 1);
        if (this.starsPoints) this.starsPoints.visible = true;
      }
    }

    // Generate graph coordinates based on layoutType (Sacks, Ulam, Depth Shells)
    this.coords = generateGraphCoordinates(this._layoutType, maxN, omegaData);

    // Rebuild network nodes & edges
    this.applyFilter(displayMode, this._selectedDepth);

    // Smoothly transition camera to fit full layout
    this.resetCamera();
  }

  /**
   * Builds network edges with spotlighting for selectedDepth Ω(n)
   */
  private buildNetworkEdges(displayMode: DisplayMode, activeIndices: number[], selectedDepth: number | null) {
    if (this.networkLines) {
      this.scene.remove(this.networkLines);
      this.networkLines.geometry.dispose();
      (this.networkLines.material as THREE.Material).dispose();
      this.networkLines = null;
    }

    if (this.maxN <= 1 || activeIndices.length <= 1) return;

    const spacing = 25.0;
    const activeCount = activeIndices.length;

    let K = 1;
    let stepStride = 1;

    if (this.maxN <= 5000) {
      K = 5;
    } else if (this.maxN <= 50000) {
      K = 3;
    } else if (this.maxN <= 200000) {
      K = 1;
    } else {
      K = 1;
      stepStride = Math.ceil(activeCount / 200000);
    }

    const segmentsList: number[] = [];
    const colorsList: number[] = [];

    const c1 = new THREE.Color();
    const c2 = new THREE.Color();

    for (let i = 0; i < activeCount - 1; i += stepStride) {
      const idx1 = activeIndices[i];
      const idx2 = activeIndices[Math.min(i + stepStride, activeCount - 1)];

      if (idx1 >= idx2) break;

      const w1 = this.omega[idx1];
      const w2 = this.omega[idx2];

      const isSpotlightActive = selectedDepth !== null;
      const isEndpointMatch = isSpotlightActive && (w1 === selectedDepth || w2 === selectedDepth);

      if (isSpotlightActive && !isEndpointMatch) {
        // Skip rendering non-spotlighted edges when depth filter is active
        continue;
      }

      this.getSpaceDepthColor(idx1, w1, c1, selectedDepth);
      this.getSpaceDepthColor(idx2, w2, c2, selectedDepth);

      if (this._layoutType === 'sacks' && idx2 === idx1 + 1 && K > 1) {
        for (let sub = 0; sub < K; sub++) {
          const tA = sub / K;
          const tB = (sub + 1) / K;

          const nA = idx1 + tA;
          const nB = idx1 + tB;

          const thetaA = 2 * Math.PI * Math.sqrt(nA);
          const rA = spacing * Math.sqrt(nA);
          const xA = rA * Math.cos(thetaA);
          const yA = rA * Math.sin(thetaA);

          const thetaB = 2 * Math.PI * Math.sqrt(nB);
          const rB = spacing * Math.sqrt(nB);
          const xB = rB * Math.cos(thetaB);
          const yB = rB * Math.sin(thetaB);

          segmentsList.push(xA, yA, -0.5, xB, yB, -0.5);

          const mixCol = c1.clone().lerp(c2, tA);
          const mixColNext = c1.clone().lerp(c2, tB);

          colorsList.push(mixCol.r, mixCol.g, mixCol.b);
          colorsList.push(mixColNext.r, mixColNext.g, mixColNext.b);
        }
      } else {
        const x1 = this.coords[(idx1 - 1) * 2];
        const y1 = this.coords[(idx1 - 1) * 2 + 1];

        const x2 = this.coords[(idx2 - 1) * 2];
        const y2 = this.coords[(idx2 - 1) * 2 + 1];

        segmentsList.push(x1, y1, -0.5, x2, y2, -0.5);
        colorsList.push(c1.r, c1.g, c1.b, c2.r, c2.g, c2.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(segmentsList, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsList, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: selectedDepth !== null ? 0.85 : this._theme === 'light' ? (displayMode === 'combined' ? 0.35 : 0.65) : displayMode === 'combined' ? 0.32 : 0.58,
      linewidth: selectedDepth !== null ? 2.5 : 1.5,
    });

    this.networkLines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.networkLines);
  }

  /**
   * Dynamically rebuilds circular Planetary Node Orbs & Network Edges for displayMode and selectedDepth!
   */
  public applyFilter(displayMode: DisplayMode, selectedDepth: number | null = this._selectedDepth) {
    this._displayMode = displayMode;
    this._selectedDepth = selectedDepth;

    // 1. Gather matching integer indices
    this.matchingIndices = [];
    for (let i = 1; i <= this.maxN; i++) {
      const w = this.omega[i];
      let matches = false;
      if (displayMode === 'combined') matches = true;
      else if (displayMode === 'primes' && w === 1) matches = true;
      else if (displayMode === 'composites' && w >= 2) matches = true;

      if (matches) {
        this.matchingIndices.push(i);
      }
    }

    // 2. Rebuild network edges with smooth curves & spotlighting
    this.buildNetworkEdges(displayMode, this.matchingIndices, selectedDepth);

    // 3. Clean up existing node mesh
    const oldInstanced = this.scene.children.filter((c) => c instanceof THREE.InstancedMesh);
    oldInstanced.forEach((m) => {
      this.scene.remove(m);
      if (m instanceof THREE.InstancedMesh) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
    });
    this.instancedMesh = null;

    const count = this.matchingIndices.length;
    if (count === 0 || this.maxN <= 0 || this.omega.length === 0) return;

    // 4. Create circular node disc geometry
    const nodeRadius = 1.35;
    const geometry = new THREE.CircleGeometry(nodeRadius, 24);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    const color = new THREE.Color();
    const dummy = new THREE.Object3D();

    for (let idx = 0; idx < count; idx++) {
      const n = this.matchingIndices[idx];
      const w = this.omega[n];

      const x = this.coords[(n - 1) * 2];
      const y = this.coords[(n - 1) * 2 + 1];

      const isSpotlightActive = selectedDepth !== null;
      const isMatch = isSpotlightActive && w === selectedDepth;

      // Scale node: spotlighted nodes are larger (1.4x), non-matching nodes are dimmed small (0.45x)
      const scale = isSpotlightActive ? (isMatch ? 1.45 : 0.45) : 1.0;

      dummy.position.set(x, y, 0);
      dummy.scale.set(scale, scale, 1);
      dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(idx, dummy.matrix);

      this.getSpaceDepthColor(n, w, color, selectedDepth);
      this.instancedMesh.setColorAt(idx, color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instancedMesh);
  }

  /**
   * Harmonious color palette adapting to Light/Dark Mode and selectedDepth Spotlight
   */
  private getSpaceDepthColor(n: number, omega: number, outColor: THREE.Color, selectedDepth: number | null = null) {
    const isSpotlightActive = selectedDepth !== null;
    const isMatch = isSpotlightActive && omega === selectedDepth;

    if (isSpotlightActive && !isMatch) {
      // Dimmed out color for non-matching depth nodes
      if (this._theme === 'light') {
        outColor.set('#CBD5E1'); // Dimmed slate gray
      } else {
        outColor.set('#1E293B'); // Dimmed void dark gray
      }
      return;
    }

    if (this._theme === 'light') {
      if (n === 1) {
        outColor.set('#0F172A');
        return;
      }
      switch (omega) {
        case 1:
          outColor.set('#0284C7');
          break;
        case 2:
          outColor.set('#059669');
          break;
        case 3:
          outColor.set('#D97706');
          break;
        case 4:
          outColor.set('#E11D48');
          break;
        default:
          outColor.set('#7C3AED');
          break;
      }
    } else {
      if (n === 1) {
        outColor.set('#F8FAFC');
        return;
      }
      switch (omega) {
        case 1:
          outColor.set('#38BDF8');
          break;
        case 2:
          outColor.set('#34D399');
          break;
        case 3:
          outColor.set('#FBBF24');
          break;
        case 4:
          outColor.set('#FB7185');
          break;
        default:
          outColor.set('#C084FC');
          break;
      }
    }
  }

  public setSelectedN(n: number | null) {
    this.selectedN = n;
    if (n && n <= this.maxN && this.selectionRing) {
      const x = this.coords[(n - 1) * 2];
      const y = this.coords[(n - 1) * 2 + 1];
      this.selectionRing.position.set(x, y, 1);
      this.selectionRing.visible = true;
    } else if (this.selectionRing) {
      this.selectionRing.visible = false;
    }
  }

  public setHoveredN(n: number | null) {
    this._hoveredN = n;
    if (n && n <= this.maxN && this.hoverRing && n !== this.selectedN) {
      const x = this.coords[(n - 1) * 2];
      const y = this.coords[(n - 1) * 2 + 1];
      this.hoverRing.position.set(x, y, 0.5);
      this.hoverRing.visible = true;
    } else if (this.hoverRing) {
      this.hoverRing.visible = false;
    }
  }

  public getDisplayMode(): DisplayMode {
    return this._displayMode;
  }

  public getHoveredN(): number | null {
    return this._hoveredN;
  }

  public resize(width: number, height: number) {
    const aspect = width / height;
    const currentHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
    this.targetCamera.left = (-currentHeight * aspect) / 2;
    this.targetCamera.right = (currentHeight * aspect) / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private setupEventListeners() {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isPanning = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    dom.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isPanning) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        const factor = (this.camera.right - this.camera.left) / (dom.clientWidth * this.camera.zoom);
        this.camera.position.x -= deltaX * factor;
        this.camera.position.y += deltaY * factor;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        this.checkHover();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
    });

    dom.addEventListener('click', (e) => {
      this.checkClick(e);
    });

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.18 : 0.82;
        this.targetCamera.zoom = Math.max(0.0005, Math.min(150, this.targetCamera.zoom * zoomFactor));
      },
      { passive: false }
    );
  }

  private checkHover() {
    if (!this.instancedMesh || !this.onHoverN || this.matchingIndices.length === 0) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.instancedMesh);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const instanceId = intersects[0].instanceId;
      const n = this.matchingIndices[instanceId];
      if (n) {
        this.setHoveredN(n);
        this.onHoverN(n);
        return;
      }
    }
    this.setHoveredN(null);
    this.onHoverN(null);
  }

  private checkClick(e: MouseEvent) {
    if (!this.instancedMesh || !this.onSelectN || this.matchingIndices.length === 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.instancedMesh);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const instanceId = intersects[0].instanceId;
      const n = this.matchingIndices[instanceId];
      if (n) {
        this.setSelectedN(n);
        this.onSelectN(n);
      }
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Smoothly lerp camera bounds & zoom with feather-soft momentum
    const lerpFactor = 0.055;
    this.camera.left += (this.targetCamera.left - this.camera.left) * lerpFactor;
    this.camera.right += (this.targetCamera.right - this.camera.right) * lerpFactor;
    this.camera.top += (this.targetCamera.top - this.camera.top) * lerpFactor;
    this.camera.bottom += (this.targetCamera.bottom - this.camera.bottom) * lerpFactor;
    this.camera.zoom += (this.targetCamera.zoom - this.camera.zoom) * lerpFactor;
    this.camera.updateProjectionMatrix();

    if (this.starsPoints && this.starsPoints.visible) {
      this.starsPoints.rotation.z += 0.00012;
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
