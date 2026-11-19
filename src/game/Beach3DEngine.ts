import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import {
  createCoastalRock,
  createHelperMesh,
  createPalmTree,
  createPlayerRig,
  createSandGrainTexture,
  createSellStation,
  createShopStation,
  createStoneFloorTexture,
  createToolMesh,
  createTreasureMesh,
  createWoodDeckTexture,
  PlayerRig,
} from './proceduralModels';
import {
  BASE_GRAIN_PRICE,
  BEACHES,
  BeachDef,
  HELPERS,
  HelperDef,
  HudSnapshot,
  MARKETS,
  STORAGES,
  TOOLS,
  getHelperCost,
} from './types';

// World & terrain dimensions
const BEACH_W = 38;
const BEACH_D = 19;
const SEGS_X = 56;
const SEGS_Z = 28;
const VERTS_X = SEGS_X + 1;
const VERTS_Z = SEGS_Z + 1;

const SELL_PAD_POS = new THREE.Vector3(-11, 0, 12.2);
const SHOP_PAD_POS = new THREE.Vector3(11, 0, 12.2);
const INTERACT_RADIUS = 3.5;

const SAVE_KEY = 'grain_by_grain_3d_save_v1';

// Module-level reusable math helpers (zero GC in loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface Treasure3D {
  vx: number;
  vz: number;
  worldX: number;
  worldZ: number;
  kind: 'coin' | 'shell' | 'bottle' | 'gem';
  value: number;
  collected: boolean;
  mesh: THREE.Group;
}

interface Helper3D {
  defId: string;
  x: number;
  z: number;
  targetIdx: number;
  carrying: number;
  returningToSell: boolean;
  sweepCooldown: number;
  wobblePhase: number;
  mesh: THREE.Group;
}

interface SandParticle {
  active: boolean;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
  mesh: THREE.Mesh;
}

export interface SaveData3D {
  cash: number;
  sandHeld: number;
  toolIndex: number;
  storageIndex: number;
  marketIndex: number;
  helperCounts: Record<string, number>;
  beachIndex: number;
  unlockedBeachIndex: number;
  lifetimeGrainsSwept: number;
}

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class Beach3DEngine {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envTarget: THREE.WebGLRenderTarget;

  private sandGeo: THREE.PlaneGeometry;
  private sandMat: THREE.MeshStandardMaterial;
  private sandMesh: THREE.Mesh;
  private sandHeights = new Float32Array(VERTS_X * VERTS_Z);
  private initialSandHeights = new Float32Array(VERTS_X * VERTS_Z);
  private sandDirty = true;

  private oceanMesh!: THREE.Mesh;
  private oceanBasePos!: Float32Array;
  private sellPadRing!: THREE.Mesh;
  private shopPadRing!: THREE.Mesh;
  private sweepRing!: THREE.Mesh;
  private guideArrow!: THREE.Group;

  private playerRig: PlayerRig;
  private equippedToolMesh: THREE.Group | null = null;
  private playerPos = new THREE.Vector3(0, 0, 10.6);
  private playerYaw = Math.PI; // facing beach (-Z)
  private walkCycle = 0;
  private sweepCycle = 0;
  private isMoving = false;
  private isSweeping = false;

  private cameraDist = 14.5;
  private camPos = new THREE.Vector3(0, 12, 24);
  private camTarget = new THREE.Vector3(0, 1, 6);

  private treasures: Treasure3D[] = [];
  private helpers: Helper3D[] = [];
  private particles: SandParticle[] = [];
  private disposables: Array<{ dispose: () => void }> = [];

  // Progression state
  private cash = 0;
  private sandHeld = 0;
  private toolIndex = 0;
  private storageIndex = 0;
  private marketIndex = 0;
  private helperCounts: Record<string, number> = {
    crab: 0,
    beachcomber: 0,
    sandbot: 0,
    drone: 0,
  };
  private beachIndex = 0;
  private unlockedBeachIndex = 0;
  private lifetimeGrainsSwept = 0;

  private totalSandOnBeach = 0;
  private remainingSand = 0;
  private elapsedSeconds = 0;
  private totalEarnedOnBeach = 0;
  private beachClearedTriggered = false;

  // Loop & input state
  private frameId = 0;
  private destroyed = false;
  private lastTime = performance.now();
  private waveTime = 0;
  private ambientOnly = true;
  private paused = false;
  private hudTimer = 0;
  private saveTimer = 0;
  private fullNoticeCooldown = 0;

  private heldKeys = new Set<string>();
  private pointerDown = false;
  private pointerWorldTarget: THREE.Vector3 | null = null;

  private onHudUpdate: (snap: HudSnapshot) => void;
  private onVictory: (snap: HudSnapshot) => void;
  private onContextLostChange?: (lost: boolean) => void;

  constructor(
    container: HTMLElement,
    onHudUpdate: (snap: HudSnapshot) => void,
    onVictory: (snap: HudSnapshot) => void,
    onContextLostChange?: (lost: boolean) => void
  ) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;
    this.onVictory = onVictory;
    this.onContextLostChange = onContextLostChange;
    this.isSoftwareGl = detectSoftwareGl();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x93d5eb);
    this.scene.fog = new THREE.Fog(0x93d5eb, 38, 125);

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.2, 220);
    this.camera.position.copy(this.camPos);

    // Mandatory studio environment reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envTarget.texture;
    pmrem.dispose();

    this.setupLighting();

    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.buildCoastalEnvironment(anisotropy);

    // Deformable 3D sand mesh
    this.sandGeo = new THREE.PlaneGeometry(BEACH_W, BEACH_D, SEGS_X, SEGS_Z);
    this.sandGeo.rotateX(-Math.PI / 2);
    const count = VERTS_X * VERTS_Z;
    this.sandGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    const sandTex = createSandGrainTexture(anisotropy);
    this.disposables.push(sandTex);
    this.sandMat = new THREE.MeshStandardMaterial({
      map: sandTex,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.0,
    });
    this.sandMesh = new THREE.Mesh(this.sandGeo, this.sandMat);
    this.sandMesh.receiveShadow = true;
    this.sandMesh.castShadow = true;
    this.scene.add(this.sandMesh);

    // Player rig
    this.playerRig = createPlayerRig();
    this.playerRig.group.position.copy(this.playerPos);
    this.scene.add(this.playerRig.group);

    // Sweep radius indicator ring
    const sweepRingGeo = new THREE.RingGeometry(0.9, 1.0, 32);
    sweepRingGeo.rotateX(-Math.PI / 2);
    const sweepRingMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sweepRing = new THREE.Mesh(sweepRingGeo, sweepRingMat);
    this.sweepRing.position.y = 0.08;
    this.scene.add(this.sweepRing);
    this.disposables.push(sweepRingGeo, sweepRingMat);

    // 3D directional guide arrow (points toward Sell Silo when full)
    this.guideArrow = new THREE.Group();
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.55,
      roughness: 0.25,
    });
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.55), arrowMat);
    arrowShaft.position.z = 0.25;
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.48, 4), arrowMat);
    arrowHead.rotation.x = Math.PI / 2;
    arrowHead.rotation.y = Math.PI / 4;
    arrowHead.position.z = 0.68;
    this.guideArrow.add(arrowShaft, arrowHead);
    this.guideArrow.visible = false;
    this.scene.add(this.guideArrow);

    // Particle pool
    const partGeo = new THREE.SphereGeometry(0.085, 6, 5);
    const partMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.9 });
    this.disposables.push(partGeo, partMat);
    for (let i = 0; i < 120; i++) {
      const m = new THREE.Mesh(partGeo, partMat);
      m.visible = false;
      this.scene.add(m);
      this.particles.push({
        active: false,
        life: 0,
        maxLife: 0.5,
        vx: 0,
        vy: 0,
        vz: 0,
        mesh: m,
      });
    }

    this.loadSaveOrInit();
    this.equipToolMesh();
    this.attachEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0xbbeeff, 0x9c7b4f, 0.85);
    hemi.position.set(0, 30, 0);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4d6, 1.9);
    sun.position.set(18, 28, 20);
    sun.castShadow = !this.isSoftwareGl;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 85;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.025;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.45);
    rim.position.set(-18, 12, -22);
    this.scene.add(rim);
  }

  private buildCoastalEnvironment(anisotropy: number): void {
    // 1. Extended ocean plane out to horizon
    const oceanGeo = new THREE.PlaneGeometry(240, 140, 48, 28);
    oceanGeo.rotateX(-Math.PI / 2);
    this.oceanBasePos = Float32Array.from(oceanGeo.attributes.position.array as Float32Array);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0e9aa7,
      roughness: 0.16,
      metalness: 0.18,
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.set(0, -0.35, -78);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
    this.disposables.push(oceanGeo, oceanMat);

    // 2. Limestone cove floor underneath the beach sand (y = 0)
    const stoneTex = createStoneFloorTexture(anisotropy);
    const stoneGeo = new THREE.PlaneGeometry(BEACH_W + 4, BEACH_D + 6);
    stoneGeo.rotateX(-Math.PI / 2);
    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.84,
      metalness: 0.05,
    });
    const stoneFloor = new THREE.Mesh(stoneGeo, stoneMat);
    stoneFloor.position.set(0, 0, 1);
    stoneFloor.receiveShadow = true;
    this.scene.add(stoneFloor);
    this.disposables.push(stoneTex, stoneGeo, stoneMat);

    // Subtle inlaid coastal compass ring in bedrock center
    const compassGeo = new THREE.RingGeometry(2.6, 3.1, 36);
    compassGeo.rotateX(-Math.PI / 2);
    const compassMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const compass = new THREE.Mesh(compassGeo, compassMat);
    compass.position.set(0, 0.015, 0);
    compass.receiveShadow = true;
    this.scene.add(compass);
    this.disposables.push(compassGeo, compassMat);

    // 3. Coastal Wooden Boardwalk Promenade along back edge (z = 10..18)
    const woodTex = createWoodDeckTexture(anisotropy);
    const deckGeo = new THREE.BoxGeometry(BEACH_W + 12, 0.28, 8.5);
    const deckMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
    const boardwalk = new THREE.Mesh(deckGeo, deckMat);
    boardwalk.position.set(0, -0.04, 14.2);
    boardwalk.receiveShadow = true;
    this.scene.add(boardwalk);
    this.disposables.push(woodTex, deckGeo, deckMat);

    // 4. Station 1: West Boardwalk — Sand Weigh & Sell Silo
    const sellStation = createSellStation(anisotropy);
    sellStation.group.position.set(-11, 0.08, 13.8);
    this.sellPadRing = sellStation.ringMesh;
    this.scene.add(sellStation.group);

    // 5. Station 2: East Boardwalk — Gear & Crew Workshop
    const shopStation = createShopStation(anisotropy);
    shopStation.group.position.set(11, 0.08, 13.8);
    this.shopPadRing = shopStation.ringMesh;
    this.scene.add(shopStation.group);

    // 6. Natural Coastal Perimeter: Palm Trees & Rock Outcrops flanking the cove
    const palmCoords: Array<[number, number, number]> = [
      [-21.5, 11.5, 1],
      [-22.5, 2.5, 2],
      [-21.0, -5.5, 3],
      [21.5, 11.5, 4],
      [22.5, 3.0, 5],
      [21.0, -5.0, 6],
      [0, 17.6, 7],
    ];
    for (const [px, pz, seed] of palmCoords) {
      const palm = createPalmTree(seed);
      palm.position.set(px, 0, pz);
      palm.rotation.y = seed * 1.1;
      this.scene.add(palm);
    }

    const rockCoords: Array<[number, number, number]> = [
      [-21, -9.5, 2.1],
      [-22.5, -2.0, 1.7],
      [-22.0, 6.5, 1.9],
      [21, -9.5, 2.2],
      [22.5, -1.5, 1.8],
      [22.0, 7.0, 2.0],
      [-15, -11.2, 1.5],
      [15, -11.2, 1.6],
    ];
    for (const [rx, rz, sc] of rockCoords) {
      const rock = createCoastalRock(sc);
      rock.position.set(rx, -0.1, rz);
      rock.rotation.y = rx * 0.7;
      this.scene.add(rock);
    }
  }

  public startLoop(): void {
    const tick = () => {
      if (this.destroyed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.destroyed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.detachEvents();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    for (const d of this.disposables) {
      d.dispose();
    }
    this.envTarget.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  public resize(): void {
    const width = Math.max(320, this.container.clientWidth);
    const height = Math.max(240, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  }

  public setAmbientOnly(ambient: boolean): void {
    this.ambientOnly = ambient;
    this.paused = false;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.heldKeys.clear();
      this.pointerDown = false;
      this.pointerWorldTarget = null;
    }
  }

  public hasSavedGame(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as SaveData3D;
      return s.lifetimeGrainsSwept > 0 || s.cash > 0 || s.toolIndex > 0 || s.beachIndex > 0;
    } catch {
      return false;
    }
  }

  public resetAllProgress(): void {
    localStorage.removeItem(SAVE_KEY);
    this.cash = 0;
    this.sandHeld = 0;
    this.toolIndex = 0;
    this.storageIndex = 0;
    this.marketIndex = 0;
    this.helperCounts = { crab: 0, beachcomber: 0, sandbot: 0, drone: 0 };
    this.beachIndex = 0;
    this.unlockedBeachIndex = 0;
    this.lifetimeGrainsSwept = 0;
    this.playerPos.set(0, 0, 10.6);
    this.playerYaw = Math.PI;
    this.equipToolMesh();
    this.setupBeach(0);
    this.syncHelpers();
    this.emitHud();
  }

  public setupBeach(index: number): void {
    const safeIdx = Math.max(0, Math.min(BEACHES.length - 1, index));
    this.beachIndex = safeIdx;
    if (safeIdx > this.unlockedBeachIndex) {
      this.unlockedBeachIndex = safeIdx;
    }

    const beach = BEACHES[safeIdx];
    (this.oceanMesh.material as THREE.MeshStandardMaterial).color.setHex(beach.waterHex);

    this.elapsedSeconds = 0;
    this.totalEarnedOnBeach = 0;
    this.beachClearedTriggered = false;
    this.totalSandOnBeach = 0;
    this.remainingSand = 0;

    // Generate sculpted 3D sand dunes across the beach grid
    for (let rz = 0; rz < VERTS_Z; rz++) {
      for (let cx = 0; cx < VERTS_X; cx++) {
        const idx = rz * VERTS_X + cx;
        // Leave narrow 1-cell tapered border along edges so dunes slope naturally
        const nx = cx / SEGS_X; // 0..1
        const nz = rz / SEGS_Z; // 0..1 (0 = near water, 1 = near boardwalk)
        const edgeFade =
          Math.min(1, nx * 8) *
          Math.min(1, (1 - nx) * 8) *
          Math.min(1, nz * 6) *
          Math.min(1, (1 - nz) * 7);

        if (edgeFade <= 0.12) {
          this.sandHeights[idx] = 0;
          this.initialSandHeights[idx] = 0;
        } else {
          const wave =
            0.5 +
            0.28 * Math.sin(cx * 0.25 + safeIdx * 1.4) * Math.cos(rz * 0.34 - safeIdx) +
            0.22 * Math.sin((cx - rz) * 0.2);
          const depth =
            (beach.minDepth + (beach.maxDepth - beach.minDepth) * Math.min(1, 0.25 + wave * 0.75)) *
            edgeFade;
          this.sandHeights[idx] = depth;
          this.initialSandHeights[idx] = depth;
          this.totalSandOnBeach += depth;
        }
      }
    }
    this.remainingSand = this.totalSandOnBeach;
    this.sandDirty = true;

    // Clear old treasures & place new buried 3D treasures
    for (const t of this.treasures) {
      this.scene.remove(t.mesh);
    }
    this.treasures = [];
    const candidates: number[] = [];
    for (let rz = 3; rz < VERTS_Z - 3; rz++) {
      for (let cx = 4; cx < VERTS_X - 4; cx++) {
        const idx = rz * VERTS_X + cx;
        if (this.sandHeights[idx] > 0.5) candidates.push(idx);
      }
    }
    const kinds: Treasure3D['kind'][] = ['coin', 'gem', 'shell', 'coin'];
    for (let i = 0; i < beach.treasureCount && candidates.length > 0; i++) {
      const pick = Math.floor(Math.random() * candidates.length);
      const vIdx = candidates.splice(pick, 1)[0];
      const cx = vIdx % VERTS_X;
      const rz = Math.floor(vIdx / VERTS_X);
      const wx = -BEACH_W / 2 + (cx / SEGS_X) * BEACH_W;
      const wz = -BEACH_D / 2 + (rz / SEGS_Z) * BEACH_D;
      const kind = kinds[i % kinds.length];
      const mesh = createTreasureMesh(kind);
      mesh.position.set(wx, 0.02, wz);
      this.scene.add(mesh);
      this.treasures.push({
        vx: cx,
        vz: rz,
        worldX: wx,
        worldZ: wz,
        kind,
        value: Math.round(beach.treasureBaseValue * (0.85 + Math.random() * 0.8)),
        collected: false,
        mesh,
      });
    }

    this.playerPos.set(0, 0, 10.6);
    this.playerYaw = Math.PI;
    this.syncHelpers();
    this.saveProgress();
    this.emitHud();
  }

  public getSnapshot(): HudSnapshot {
    const beach = BEACHES[this.beachIndex];
    const market = MARKETS[this.marketIndex];
    const storage = STORAGES[this.storageIndex];
    const sellValuePerGrain = BASE_GRAIN_PRICE * market.multiplier * beach.valueMultiplier;
    const clearedPercent =
      this.totalSandOnBeach > 0
        ? Math.min(100, Math.max(0, ((this.totalSandOnBeach - this.remainingSand) / this.totalSandOnBeach) * 100))
        : 100;

    const nearSellZone = this.playerPos.distanceTo(SELL_PAD_POS) <= INTERACT_RADIUS;
    const nearShopZone = this.playerPos.distanceTo(SHOP_PAD_POS) <= INTERACT_RADIUS;

    return {
      cash: this.cash,
      sandHeld: this.sandHeld,
      bucketCapacity: storage.capacity,
      sellValuePerGrain,
      totalSandOnBeach: this.totalSandOnBeach,
      remainingSand: this.remainingSand,
      clearedPercent,
      toolIndex: this.toolIndex,
      storageIndex: this.storageIndex,
      marketIndex: this.marketIndex,
      helperCounts: { ...this.helperCounts },
      beachIndex: this.beachIndex,
      unlockedBeachIndex: this.unlockedBeachIndex,
      treasuresFound: this.treasures.filter((t) => t.collected).length,
      totalTreasures: this.treasures.length,
      elapsedSeconds: this.elapsedSeconds,
      totalEarnedOnBeach: this.totalEarnedOnBeach,
      lifetimeGrainsSwept: this.lifetimeGrainsSwept,
      nearSellZone,
      nearShopZone,
      isSweeping: this.isSweeping,
    };
  }

  public sellSandAtStation(): boolean {
    const snap = this.getSnapshot();
    if (!snap.nearSellZone || this.sandHeld < 0.5) return false;
    const payout = Math.max(1, Math.round(this.sandHeld * snap.sellValuePerGrain));
    this.cash += payout;
    this.totalEarnedOnBeach += payout;
    this.sandHeld = 0;
    soundEngine.playSell();
    this.spawnSandParticles(SELL_PAD_POS.x, 1.4, SELL_PAD_POS.z - 0.5, 16);
    this.saveProgress();
    this.emitHud();
    return true;
  }

  public buyTool(index: number): boolean {
    const snap = this.getSnapshot();
    if (!snap.nearShopZone) return false;
    if (index !== this.toolIndex + 1 || index >= TOOLS.length) return false;
    const tool = TOOLS[index];
    if (this.cash < tool.cost) return false;
    this.cash -= tool.cost;
    this.toolIndex = index;
    this.equipToolMesh();
    soundEngine.playUpgrade();
    this.saveProgress();
    this.emitHud();
    return true;
  }

  public buyStorage(index: number): boolean {
    const snap = this.getSnapshot();
    if (!snap.nearShopZone) return false;
    if (index !== this.storageIndex + 1 || index >= STORAGES.length) return false;
    const storage = STORAGES[index];
    if (this.cash < storage.cost) return false;
    this.cash -= storage.cost;
    this.storageIndex = index;
    soundEngine.playUpgrade();
    this.saveProgress();
    this.emitHud();
    return true;
  }

  public buyMarket(index: number): boolean {
    const snap = this.getSnapshot();
    if (!snap.nearShopZone) return false;
    if (index !== this.marketIndex + 1 || index >= MARKETS.length) return false;
    const market = MARKETS[index];
    if (this.cash < market.cost) return false;
    this.cash -= market.cost;
    this.marketIndex = index;
    soundEngine.playUpgrade();
    this.saveProgress();
    this.emitHud();
    return true;
  }

  public buyHelper(def: HelperDef): boolean {
    const snap = this.getSnapshot();
    if (!snap.nearShopZone) return false;
    const count = this.helperCounts[def.id] || 0;
    if (count >= def.maxCount) return false;
    const cost = getHelperCost(def, count);
    if (this.cash < cost) return false;
    this.cash -= cost;
    this.helperCounts[def.id] = count + 1;
    soundEngine.playUpgrade();
    this.syncHelpers();
    this.saveProgress();
    this.emitHud();
    return true;
  }

  private equipToolMesh(): void {
    if (this.equippedToolMesh) {
      this.playerRig.toolSocket.remove(this.equippedToolMesh);
    }
    this.equippedToolMesh = createToolMesh(this.toolIndex);
    this.playerRig.toolSocket.add(this.equippedToolMesh);
  }

  private syncHelpers(): void {
    for (const h of this.helpers) {
      this.scene.remove(h.mesh);
    }
    this.helpers = [];
    for (const def of HELPERS) {
      const count = this.helperCounts[def.id] || 0;
      for (let i = 0; i < count; i++) {
        const mesh = createHelperMesh(def.id);
        const startX = -10 + Math.random() * 20;
        const startZ = -4 + Math.random() * 10;
        mesh.position.set(startX, 0, startZ);
        this.scene.add(mesh);
        this.helpers.push({
          defId: def.id,
          x: startX,
          z: startZ,
          targetIdx: this.findRandomSandyVertex(),
          carrying: 0,
          returningToSell: false,
          sweepCooldown: Math.random() * 0.25,
          wobblePhase: Math.random() * Math.PI * 2,
          mesh,
        });
      }
    }
  }

  private findRandomSandyVertex(): number {
    for (let attempt = 0; attempt < 30; attempt++) {
      const idx = Math.floor(Math.random() * this.sandHeights.length);
      if (this.sandHeights[idx] > 0.01) return idx;
    }
    for (let i = 0; i < this.sandHeights.length; i++) {
      if (this.sandHeights[i] > 0.01) return i;
    }
    return Math.floor(this.sandHeights.length / 2);
  }

  private rebuildSandGeometry(): void {
    const beach = BEACHES[this.beachIndex];
    const pos = this.sandGeo.attributes.position as THREE.BufferAttribute;
    const col = this.sandGeo.attributes.color as THREE.BufferAttribute;
    _colorA.setHex(beach.sandHex);
    _colorB.setHex(beach.sandDeepHex);

    for (let i = 0; i < this.sandHeights.length; i++) {
      const h = this.sandHeights[i];
      if (h <= 0.005) {
        // Sink below limestone bedrock floor
        pos.setY(i, -0.16);
        col.setXYZ(i, _colorA.r, _colorA.g, _colorA.b);
      } else {
        const norm = Math.min(1, h / beach.maxDepth);
        const visualY = 0.06 + Math.pow(norm, 0.7) * 1.35;
        pos.setY(i, visualY);
        const r = THREE.MathUtils.lerp(_colorA.r, _colorB.r, norm);
        const g = THREE.MathUtils.lerp(_colorA.g, _colorB.g, norm);
        const b = THREE.MathUtils.lerp(_colorA.b, _colorB.b, norm);
        col.setXYZ(i, r, g, b);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.sandGeo.computeVertexNormals();
    this.sandDirty = false;
  }

  private getSandSurfaceHeightAt(wx: number, wz: number): number {
    const fx = ((wx + BEACH_W / 2) / BEACH_W) * SEGS_X;
    const fz = ((wz + BEACH_D / 2) / BEACH_D) * SEGS_Z;
    if (fx < 0 || fx > SEGS_X || fz < 0 || fz > SEGS_Z) return 0;
    const cx = Math.min(VERTS_X - 1, Math.max(0, Math.round(fx)));
    const rz = Math.min(VERTS_Z - 1, Math.max(0, Math.round(fz)));
    const h = this.sandHeights[rz * VERTS_X + cx];
    if (h <= 0.005) return 0;
    const norm = Math.min(1, h / BEACHES[this.beachIndex].maxDepth);
    return 0.06 + Math.pow(norm, 0.7) * 1.35;
  }

  private sweepSandAt(wx: number, wz: number, radius: number, powerAmt: number, isPlayer: boolean): number {
    if (this.beachClearedTriggered) return 0;

    const storage = STORAGES[this.storageIndex];
    let roomLeft = isPlayer ? storage.capacity - this.sandHeld : Infinity;

    if (isPlayer && roomLeft <= 0.01) {
      if (this.fullNoticeCooldown <= 0) {
        this.fullNoticeCooldown = 1.6;
        soundEngine.playFullBucket();
      }
      return 0;
    }

    const minCx = Math.max(0, Math.floor(((wx - radius + BEACH_W / 2) / BEACH_W) * SEGS_X));
    const maxCx = Math.min(VERTS_X - 1, Math.ceil(((wx + radius + BEACH_W / 2) / BEACH_W) * SEGS_X));
    const minRz = Math.max(0, Math.floor(((wz - radius + BEACH_D / 2) / BEACH_D) * SEGS_Z));
    const maxRz = Math.min(VERTS_Z - 1, Math.ceil(((wz + radius + BEACH_D / 2) / BEACH_D) * SEGS_Z));

    const rSq = radius * radius;
    let collected = 0;

    for (let rz = minRz; rz <= maxRz; rz++) {
      const vz = -BEACH_D / 2 + (rz / SEGS_Z) * BEACH_D;
      for (let cx = minCx; cx <= maxCx; cx++) {
        const idx = rz * VERTS_X + cx;
        const cur = this.sandHeights[idx];
        if (cur <= 0) continue;

        const vx = -BEACH_W / 2 + (cx / SEGS_X) * BEACH_W;
        const dx = vx - wx;
        const dz = vz - wz;
        const distSq = dx * dx + dz * dz;
        if (distSq > rSq) continue;

        const falloff = 1 - (Math.sqrt(distSq) / radius) * 0.45;
        const want = Math.min(cur, powerAmt * falloff);
        const actual = Math.min(want, roomLeft - collected);
        if (actual <= 0) break;

        this.sandHeights[idx] = cur - actual;
        if (this.sandHeights[idx] < 0.04) {
          const rem = this.sandHeights[idx];
          this.sandHeights[idx] = 0;
          this.remainingSand = Math.max(0, this.remainingSand - (actual + rem));
        } else {
          this.remainingSand = Math.max(0, this.remainingSand - actual);
        }

        collected += actual;
        this.sandDirty = true;
        if (collected >= roomLeft) break;
      }
      if (collected >= roomLeft) break;
    }

    if (collected > 0) {
      if (isPlayer) {
        this.sandHeld = Math.min(storage.capacity, this.sandHeld + collected);
        soundEngine.playSweep(this.toolIndex);
        this.spawnSandParticles(wx, this.getSandSurfaceHeightAt(wx, wz) + 0.2, wz, 2);
      }
      this.lifetimeGrainsSwept += collected;

      // Check treasure reveals
      for (const t of this.treasures) {
        if (!t.collected) {
          const vIdx = t.vz * VERTS_X + t.vx;
          if (this.sandHeights[vIdx] <= 0.05) {
            t.collected = true;
            t.mesh.visible = false;
            this.cash += t.value;
            this.totalEarnedOnBeach += t.value;
            soundEngine.playTreasure();
            this.spawnSandParticles(t.worldX, 0.4, t.worldZ, 12);
          }
        }
      }

      if (this.remainingSand <= 0.5) {
        this.remainingSand = 0;
        this.sandHeights.fill(0);
        this.sandDirty = true;
        this.beachClearedTriggered = true;
        // Auto-cash remaining held sand on beach completion
        if (this.sandHeld > 0) {
          const snap = this.getSnapshot();
          const payout = Math.max(1, Math.round(this.sandHeld * snap.sellValuePerGrain));
          this.cash += payout;
          this.totalEarnedOnBeach += payout;
          this.sandHeld = 0;
        }
        if (this.beachIndex + 1 > this.unlockedBeachIndex && this.beachIndex + 1 < BEACHES.length) {
          this.unlockedBeachIndex = this.beachIndex + 1;
        }
        soundEngine.playVictory();
        this.saveProgress();
        const finalSnap = this.getSnapshot();
        this.onHudUpdate(finalSnap);
        this.onVictory(finalSnap);
      }
    }

    return collected;
  }

  private spawnSandParticles(x: number, y: number, z: number, count: number): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.6 + Math.random() * 2.8;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.28 + Math.random() * 0.25;
      p.vx = Math.cos(ang) * spd;
      p.vy = 2.0 + Math.random() * 2.2;
      p.vz = Math.sin(ang) * spd;
      p.mesh.position.set(x, y, z);
      p.mesh.visible = true;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private update(dt: number): void {
    this.waveTime += dt;
    if (this.fullNoticeCooldown > 0) {
      this.fullNoticeCooldown = Math.max(0, this.fullNoticeCooldown - dt);
    }

    // Animate ocean waves smoothly
    const oceanPos = this.oceanMesh.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < oceanPos.count; i++) {
      const bx = this.oceanBasePos[i * 3];
      const bz = this.oceanBasePos[i * 3 + 2];
      const waveY =
        Math.sin(bx * 0.14 + this.waveTime * 1.9) * 0.22 +
        Math.cos(bz * 0.18 + this.waveTime * 1.4) * 0.16;
      oceanPos.setY(i, waveY);
    }
    oceanPos.needsUpdate = true;

    // Spin uncollected revealed treasures slightly
    for (const t of this.treasures) {
      if (!t.collected) {
        t.mesh.rotation.y += dt * 1.6;
      }
    }

    // Pulse station pads
    const padScale = 1 + Math.sin(this.waveTime * 3) * 0.04;
    this.sellPadRing.scale.set(padScale, padScale, 1);
    this.shopPadRing.scale.set(padScale, padScale, 1);

    if (this.sandDirty) {
      this.rebuildSandGeometry();
    }

    if (this.ambientOnly) {
      // Gentle scenic orbiting camera on Title Screen
      const orbitAng = this.waveTime * 0.14;
      _vec3A.set(Math.sin(orbitAng) * 20, 12.5, Math.cos(orbitAng) * 16 + 4);
      this.camera.position.lerp(_vec3A, 0.05);
      this.camera.lookAt(0, 1.0, 2.0);
      return;
    }

    if (this.paused) return;

    if (!this.beachClearedTriggered) {
      this.elapsedSeconds += dt;
    }

    // Player movement: WASD / Arrows + optional mouse hold-to-steer
    let moveX = 0;
    let moveZ = 0;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveZ -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveZ += 1;

    if (moveX === 0 && moveZ === 0 && this.pointerDown && this.pointerWorldTarget) {
      const dx = this.pointerWorldTarget.x - this.playerPos.x;
      const dz = this.pointerWorldTarget.z - this.playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.6) {
        moveX = dx / dist;
        moveZ = dz / dist;
      }
    }

    const sprinting = this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight');
    const moveSpeed = sprinting ? 11.2 : 8.2;

    if (moveX !== 0 || moveZ !== 0) {
      const len = Math.hypot(moveX, moveZ);
      const nx = moveX / len;
      const nz = moveZ / len;
      this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x + nx * moveSpeed * dt, -18.5, 18.5);
      this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z + nz * moveSpeed * dt, -9.2, 15.8);

      const targetYaw = Math.atan2(nx, nz);
      // Shortest angular interpolation
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * (1 - Math.exp(-14 * dt));
      this.isMoving = true;
      this.walkCycle += dt * (sprinting ? 14 : 10);
    } else {
      this.isMoving = false;
    }

    // Ground height under player (boardwalk vs sand)
    const groundY =
      this.playerPos.z >= 10
        ? 0.1
        : this.getSandSurfaceHeightAt(this.playerPos.x, this.playerPos.z);
    this.playerRig.group.position.x = this.playerPos.x;
    this.playerRig.group.position.z = this.playerPos.z;
    this.playerRig.group.position.y = THREE.MathUtils.damp(
      this.playerRig.group.position.y,
      groundY,
      18,
      dt
    );
    this.playerRig.group.rotation.y = this.playerYaw;

    // Sweeping action (Space or Left Mouse Button when on/near beach)
    const tool = TOOLS[this.toolIndex];
    const sweepDist = 0.8 + tool.radius * 0.45;
    const sweepX = this.playerPos.x + Math.sin(this.playerYaw) * sweepDist;
    const sweepZ = this.playerPos.z + Math.cos(this.playerYaw) * sweepDist;

    this.sweepRing.position.set(sweepX, groundY + 0.08, sweepZ);
    this.sweepRing.scale.setScalar(tool.radius);

    const wantsSweep = this.heldKeys.has('Space') || this.pointerDown;
    this.isSweeping = wantsSweep && this.playerPos.z < 10.6 && !this.beachClearedTriggered;

    if (this.isSweeping) {
      this.sweepCycle += dt * 16;
      this.sweepSandAt(sweepX, sweepZ, tool.radius, tool.power * dt, true);
    } else {
      this.sweepCycle *= 0.85;
    }

    // Animate player limbs & tool swing
    const legSwing = this.isMoving ? Math.sin(this.walkCycle) * 0.55 : 0;
    this.playerRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.leftLeg.rotation.x, legSwing, 14, dt);
    this.playerRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerRig.rightLeg.rotation.x, -legSwing, 14, dt);

    const armSwing = this.isSweeping ? Math.sin(this.sweepCycle) * 0.65 : -legSwing * 0.5;
    this.playerRig.rightArm.rotation.x = THREE.MathUtils.damp(this.playerRig.rightArm.rotation.x, armSwing - 0.35, 16, dt);
    this.playerRig.leftArm.rotation.x = THREE.MathUtils.damp(this.playerRig.leftArm.rotation.x, -armSwing * 0.6 - 0.25, 16, dt);
    this.playerRig.toolSocket.rotation.y = this.isSweeping ? Math.sin(this.sweepCycle) * 0.45 : 0;

    // Visibly update backpack sand level
    const cap = STORAGES[this.storageIndex].capacity;
    const fillRatio = Math.min(1, this.sandHeld / Math.max(1, cap));
    if (fillRatio > 0.01) {
      this.playerRig.sandFillMesh.visible = true;
      this.playerRig.sandFillMesh.scale.y = fillRatio;
    } else {
      this.playerRig.sandFillMesh.visible = false;
    }

    // Directional 3D guide arrow when backpack is full -> points to Sell Silo!
    if (this.sandHeld >= cap - 0.5) {
      this.guideArrow.visible = true;
      this.guideArrow.position.set(
        this.playerPos.x,
        this.playerRig.group.position.y + 2.65 + Math.sin(this.waveTime * 5) * 0.12,
        this.playerPos.z
      );
      const ang = Math.atan2(
        SELL_PAD_POS.x - this.playerPos.x,
        SELL_PAD_POS.z - this.playerPos.z
      );
      this.guideArrow.rotation.y = ang;
    } else {
      this.guideArrow.visible = false;
    }

    // Update autonomous 3D helpers (sweep dunes + haul to Sell Silo!)
    for (const h of this.helpers) {
      const def = HELPERS.find((d) => d.id === h.defId);
      if (!def) continue;
      h.wobblePhase += dt * 7;
      h.sweepCooldown -= dt;

      let tx: number;
      let tz: number;
      if (h.returningToSell) {
        tx = SELL_PAD_POS.x;
        tz = SELL_PAD_POS.z;
      } else {
        if (this.sandHeights[h.targetIdx] <= 0.01) {
          h.targetIdx = this.findRandomSandyVertex();
        }
        const cx = h.targetIdx % VERTS_X;
        const rz = Math.floor(h.targetIdx / VERTS_X);
        tx = -BEACH_W / 2 + (cx / SEGS_X) * BEACH_W;
        tz = -BEACH_D / 2 + (rz / SEGS_Z) * BEACH_D;
      }

      const dx = tx - h.x;
      const dz = tz - h.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.45) {
        h.x += (dx / dist) * def.speed * dt;
        h.z += (dz / dist) * def.speed * dt;
        h.mesh.rotation.y = Math.atan2(dx, dz);
      } else if (h.returningToSell) {
        // Deposit helper haul at the Sell Silo!
        if (h.carrying > 0) {
          const snap = this.getSnapshot();
          const earn = Math.max(1, Math.round(h.carrying * snap.sellValuePerGrain));
          this.cash += earn;
          this.totalEarnedOnBeach += earn;
          h.carrying = 0;
        }
        h.returningToSell = false;
        h.targetIdx = this.findRandomSandyVertex();
      } else if (h.sweepCooldown <= 0) {
        h.sweepCooldown = 0.3;
        const got = this.sweepSandAt(h.x, h.z, def.sweepRadius, def.sweepPower * 0.3, false);
        h.carrying += got;
        if (h.carrying >= def.sweepPower * 1.4 || this.remainingSand <= 0.5) {
          h.returningToSell = true;
        }
      }

      const hy = h.z >= 10 ? 0.1 : this.getSandSurfaceHeightAt(h.x, h.z);
      h.mesh.position.set(h.x, hy, h.z);
    }

    // Update 3D particles
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 9.5 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
    }

    // Smooth exponential damped third-person chase camera
    _vec3A.set(
      this.playerPos.x * 0.72,
      this.cameraDist * 0.76,
      this.playerPos.z + this.cameraDist * 0.92
    );
    _vec3B.set(this.playerPos.x * 0.85, 1.1, this.playerPos.z - 1.5);
    const camLambda = 6.5;
    this.camPos.x = THREE.MathUtils.damp(this.camPos.x, _vec3A.x, camLambda, dt);
    this.camPos.y = THREE.MathUtils.damp(this.camPos.y, _vec3A.y, camLambda, dt);
    this.camPos.z = THREE.MathUtils.damp(this.camPos.z, _vec3A.z, camLambda, dt);
    this.camTarget.x = THREE.MathUtils.damp(this.camTarget.x, _vec3B.x, camLambda, dt);
    this.camTarget.y = THREE.MathUtils.damp(this.camTarget.y, _vec3B.y, camLambda, dt);
    this.camTarget.z = THREE.MathUtils.damp(this.camTarget.z, _vec3B.z, camLambda, dt);

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);

    this.hudTimer += dt;
    if (this.hudTimer >= 0.08) {
      this.hudTimer = 0;
      this.emitHud();
    }

    this.saveTimer += dt;
    if (this.saveTimer >= 4) {
      this.saveTimer = 0;
      this.saveProgress();
    }
  }

  private loadSaveOrInit(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SaveData3D;
        this.cash = s.cash || 0;
        this.sandHeld = s.sandHeld || 0;
        this.toolIndex = Math.min(TOOLS.length - 1, Math.max(0, s.toolIndex || 0));
        this.storageIndex = Math.min(STORAGES.length - 1, Math.max(0, s.storageIndex || 0));
        this.marketIndex = Math.min(MARKETS.length - 1, Math.max(0, s.marketIndex || 0));
        this.helperCounts = s.helperCounts || { crab: 0, beachcomber: 0, sandbot: 0, drone: 0 };
        this.beachIndex = Math.min(BEACHES.length - 1, Math.max(0, s.beachIndex || 0));
        this.unlockedBeachIndex = Math.min(
          BEACHES.length - 1,
          Math.max(this.beachIndex, s.unlockedBeachIndex || 0)
        );
        this.lifetimeGrainsSwept = s.lifetimeGrainsSwept || 0;
      }
    } catch {
      // ignore corrupted save
    }
    this.setupBeach(this.beachIndex);
  }

  private saveProgress(): void {
    try {
      const data: SaveData3D = {
        cash: this.cash,
        sandHeld: this.sandHeld,
        toolIndex: this.toolIndex,
        storageIndex: this.storageIndex,
        marketIndex: this.marketIndex,
        helperCounts: this.helperCounts,
        beachIndex: this.beachIndex,
        unlockedBeachIndex: this.unlockedBeachIndex,
        lifetimeGrainsSwept: this.lifetimeGrainsSwept,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  private emitHud(): void {
    this.onHudUpdate(this.getSnapshot());
  }

  private updatePointerTarget(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    _pointerNdc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    _raycaster.setFromCamera(_pointerNdc, this.camera);
    const hit = new THREE.Vector3();
    if (_raycaster.ray.intersectPlane(_groundPlane, hit)) {
      this.pointerWorldTarget = hit;
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.ambientOnly || this.paused) return;
    if (e.button !== 0) return;
    soundEngine.unlock();
    this.pointerDown = true;
    this.updatePointerTarget(e.clientX, e.clientY);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pointerDown) return;
    this.updatePointerTarget(e.clientX, e.clientY);
  };

  private handlePointerUp = () => {
    this.pointerDown = false;
    this.pointerWorldTarget = null;
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.ambientOnly || this.paused) return;
    this.cameraDist = THREE.MathUtils.clamp(this.cameraDist + e.deltaY * 0.01, 9.5, 22);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (!this.ambientOnly && !this.paused) {
        e.preventDefault();
      }
    }
    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.pointerDown = false;
    this.pointerWorldTarget = null;
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.onContextLostChange?.(true);
  };

  private handleContextRestored = () => {
    this.onContextLostChange?.(false);
  };

  private attachEvents(): void {
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('wheel', this.handleWheel, { passive: true });
    dom.addEventListener('webglcontextlost', this.handleContextLost);
    dom.addEventListener('webglcontextrestored', this.handleContextRestored);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private detachEvents(): void {
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    dom.removeEventListener('wheel', this.handleWheel);
    dom.removeEventListener('webglcontextlost', this.handleContextLost);
    dom.removeEventListener('webglcontextrestored', this.handleContextRestored);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }
}
