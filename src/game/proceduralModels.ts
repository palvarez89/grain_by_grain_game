import * as THREE from 'three';

export function createSandGrainTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F2D28B';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 4500; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137 + Math.floor(i / 256) * 29) % 256;
    const bright = i % 3 === 0;
    ctx.fillStyle = bright ? 'rgba(255, 248, 225, 0.32)' : 'rgba(176, 125, 58, 0.22)';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 10);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createStoneFloorTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#97A5B1';
  ctx.fillRect(0, 0, 512, 512);

  // Flagstone grid
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';
  ctx.lineWidth = 4;
  for (let y = 0; y < 512; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = ((y / 64) % 2) * 64;
    for (let x = offset; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 64);
      ctx.stroke();
    }
  }

  // Subtle limestone grain variation
  for (let i = 0; i < 2400; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    ctx.fillRect(x, y, 3, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createWoodDeckTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7C5840';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? '#866047' : '#73503A';
    ctx.fillRect(0, y + 2, 256, 28);
    ctx.fillStyle = '#4A3123';
    ctx.fillRect(0, y, 256, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createSignTexture(
  title: string,
  subtitle: string,
  accentColor: string,
  anisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0F2936';
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 492, 172);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 74);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 28px monospace';
  ctx.fillText(subtitle, 256, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createToolMesh(toolIndex: number): THREE.Group {
  const group = new THREE.Group();

  if (toolIndex === 0) {
    // Travel Toothbrush: coral handle + rubber grip + white bristle tuft
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.35,
      metalness: 0.05,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      roughness: 0.75,
    });
    const bristleMat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      roughness: 0.85,
    });

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 1.15), handleMat);
    handle.position.set(0, 0, 0.45);
    handle.castShadow = true;
    group.add(handle);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.09, 0.42), gripMat);
    grip.position.set(0, 0, 0.15);
    group.add(grip);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.26), handleMat);
    head.position.set(0, 0, 0.96);
    group.add(head);

    const bristles = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.22), bristleMat);
    bristles.position.set(0, -0.1, 0.96);
    group.add(bristles);
  } else if (toolIndex === 1) {
    // Straw Whisk Broom
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 10), woodMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0, 0.32);
    group.add(handle);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 10), bandMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, 0.72);
    group.add(collar);

    const fan = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.52, 8), strawMat);
    fan.rotation.x = -Math.PI / 2;
    fan.scale.set(1.2, 1, 0.45);
    fan.position.set(0, -0.04, 1.0);
    fan.castShadow = true;
    group.add(fan);
  } else if (toolIndex === 2) {
    // Boardwalk Push Broom
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.4 });
    const bristleMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.9 });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.45, 10), woodMat);
    pole.rotation.x = Math.PI / 2;
    pole.position.set(0, 0.15, 0.6);
    group.add(pole);

    const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.18), headMat);
    block.position.set(0, -0.1, 1.25);
    block.castShadow = true;
    group.add(block);

    const bristles = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.2, 0.15), bristleMat);
    bristles.position.set(0, -0.24, 1.25);
    group.add(bristles);
  } else if (toolIndex === 3) {
    // Aluminum Sand Scoop
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.85 });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 10), shaftMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0.1, 0.55);
    group.add(shaft);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.75), bladeMat);
    blade.position.set(0, -0.1, 1.3);
    blade.rotation.x = 0.2;
    blade.castShadow = true;
    group.add(blade);

    const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.75), bladeMat);
    rimL.position.set(-0.45, -0.02, 1.3);
    rimL.rotation.x = 0.2;
    group.add(rimL);

    const rimR = rimL.clone();
    rimR.position.x = 0.45;
    group.add(rimR);
  } else if (toolIndex === 4) {
    // Gas Leaf Blower
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4, metalness: 0.1 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.3 });

    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.55), bodyMat);
    engine.position.set(0, 0.05, 0.35);
    engine.castShadow = true;
    group.add(engine);

    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.05, 12), pipeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.05, 1.05);
    group.add(tube);

    const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.2), bodyMat);
    nozzle.position.set(0, -0.08, 1.55);
    group.add(nozzle);
  } else if (toolIndex === 5) {
    // Rotary Street Sweeper Attachment
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.35 });
    const brushMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 });

    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 1.1), frameMat);
    boom.position.set(0, 0.06, 0.55);
    group.add(boom);

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.4), frameMat);
    crossbar.position.set(0, -0.04, 1.2);
    crossbar.castShadow = true;
    group.add(crossbar);

    const drumL = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16), brushMat);
    drumL.position.set(-0.5, -0.18, 1.25);
    group.add(drumL);

    const drumR = drumL.clone();
    drumR.position.x = 0.5;
    group.add(drumR);
  } else if (toolIndex === 6) {
    // Mini Sand Bulldozer Blade
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.5 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });

    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.2), edgeMat);
    armL.position.set(-0.4, 0, 0.6);
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = 0.4;
    group.add(armR);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 0.18), steelMat);
    blade.position.set(0, -0.05, 1.25);
    blade.castShadow = true;
    group.add(blade);

    const lip = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.1, 0.22), edgeMat);
    lip.position.set(0, -0.32, 1.27);
    group.add(lip);
  } else {
    // Solar Vortex Vacuum
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.28, metalness: 0.65 });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });

    const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.3, 12), bodyMat);
    wand.rotation.x = Math.PI / 2;
    wand.position.set(0, 0.05, 0.65);
    group.add(wand);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.1, 12, 24), bodyMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -0.15, 1.35);
    ring.castShadow = true;
    group.add(ring);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 20), glowMat);
    core.position.set(0, -0.15, 1.35);
    group.add(core);
  }

  return group;
}

export interface PlayerRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  toolSocket: THREE.Group;
  sandFillMesh: THREE.Mesh;
}

export function createPlayerRig(): PlayerRig {
  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.75 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.85 });
  const hatBandMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
  });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xf4c96b, roughness: 0.92 });

  // Legs (pivoted near hips)
  const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.24);
  legGeo.translate(0, -0.325, 0);
  const leftLeg = new THREE.Mesh(legGeo, shortsMat);
  leftLeg.position.set(-0.2, 0.68, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, shortsMat);
  rightLeg.position.set(0.2, 0.68, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.78, 0.42), shirtMat);
  torso.position.set(0, 1.08, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 14), skinMat);
  head.position.set(0, 1.72, 0);
  head.castShadow = true;
  bodyGroup.add(head);

  // Coastal Straw Hat (brim + crown + ribbon)
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.05, 20), hatMat);
  brim.position.set(0, 1.92, 0);
  brim.castShadow = true;
  bodyGroup.add(brim);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.22, 16), hatMat);
  crown.position.set(0, 2.04, 0);
  bodyGroup.add(crown);

  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.06, 16), hatBandMat);
  ribbon.position.set(0, 1.96, 0);
  bodyGroup.add(ribbon);

  // Translucent Backpack Sand Hopper (visibly fills up!)
  const packFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.34), glassMat);
  packFrame.position.set(0, 1.15, -0.36);
  bodyGroup.add(packFrame);

  const packRim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.38), frameMat);
  packRim.position.set(0, 1.5, -0.36);
  bodyGroup.add(packRim);

  const packBase = packRim.clone();
  packBase.position.y = 0.81;
  bodyGroup.add(packBase);

  const sandGeo = new THREE.BoxGeometry(0.48, 0.6, 0.26);
  sandGeo.translate(0, 0.3, 0);
  const sandFillMesh = new THREE.Mesh(sandGeo, sandMat);
  sandFillMesh.position.set(0, 0.84, -0.36);
  sandFillMesh.scale.y = 0.001;
  sandFillMesh.visible = false;
  bodyGroup.add(sandFillMesh);

  // Arms & Tool Socket
  const armGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
  armGeo.translate(0, -0.24, 0);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.38, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.38, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  bodyGroup.add(rightArm);

  const toolSocket = new THREE.Group();
  toolSocket.position.set(0.1, 1.02, 0.32);
  bodyGroup.add(toolSocket);

  return {
    group,
    bodyGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    toolSocket,
    sandFillMesh,
  };
}

export function createSellStation(anisotropy: number): {
  group: THREE.Group;
  ringMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x785038, roughness: 0.82 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.35, metalness: 0.75 });
  const amberMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
    roughness: 0.35,
  });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xd6b585, roughness: 0.92 });

  // Deck platform
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.25, 4.4), woodMat);
  deck.position.set(0, 0.12, 0);
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  // Tall Silo Drum
  const silo = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.2, 20), steelMat);
  silo.position.set(-1.3, 1.85, -0.7);
  silo.castShadow = true;
  group.add(silo);

  const siloRoof = new THREE.Mesh(new THREE.ConeGeometry(1.28, 0.9, 20), amberMat);
  siloRoof.position.set(-1.3, 3.9, -0.7);
  siloRoof.castShadow = true;
  group.add(siloRoof);

  // Weigh Hopper Funnel on front-right
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.45, 1.1, 12), amberMat);
  hopper.position.set(1.2, 1.15, 0.2);
  hopper.castShadow = true;
  group.add(hopper);

  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 1.1), steelMat);
  stand.position.set(1.2, 0.55, 0.2);
  group.add(stand);

  // Sandbag stack
  for (let i = 0; i < 3; i++) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.48), bagMat);
    bag.position.set(-1.3 + (i % 2) * 0.55, 0.4 + Math.floor(i / 2) * 0.3, 1.0);
    bag.rotation.y = i * 0.25;
    bag.castShadow = true;
    group.add(bag);
  }

  // Painted Signboard
  const signTex = createSignTexture('SELL SAND', 'WALK HERE · PRESS E', '#F59E0B', anisotropy);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 0.15), signMat);
  signBoard.position.set(0.3, 3.3, 0.9);
  signBoard.castShadow = true;
  group.add(signBoard);

  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.1, 8), woodMat);
  postL.position.set(-1.2, 1.7, 0.9);
  group.add(postL);
  const postR = postL.clone();
  postR.position.x = 1.8;
  group.add(postR);

  // Ground Interaction Pad Ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.15, 36), ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(0, 0.05, 2.4);
  group.add(ringMesh);

  return { group, ringMesh };
}

export function createShopStation(anisotropy: number): {
  group: THREE.Group;
  ringMesh: THREE.Mesh;
} {
  const group = new THREE.Group();

  const cedarMat = new THREE.MeshStandardMaterial({ color: 0x85583c, roughness: 0.8 });
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.45 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
  const coralMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.25, metalness: 0.85 });

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.25, 4.4), cedarMat);
  deck.position.set(0, 0.12, 0);
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  // Back wall & counter
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.7, 0.22), tealMat);
  backWall.position.set(0, 1.55, -1.6);
  backWall.castShadow = true;
  group.add(backWall);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.0, 0.9), cedarMat);
  counter.position.set(0, 0.75, 0.4);
  counter.castShadow = true;
  group.add(counter);

  // Four corner posts
  for (const [px, pz] of [
    [-2.4, -1.5],
    [2.4, -1.5],
    [-2.4, 1.4],
    [2.4, 1.4],
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 8), cedarMat);
    post.position.set(px, 1.6, pz);
    post.castShadow = true;
    group.add(post);
  }

  // Striped Awning Roof
  for (let i = -2; i <= 2; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, 0.16, 3.6),
      i % 2 === 0 ? coralMat : creamMat
    );
    stripe.position.set(i * 1.08, 3.05, 0);
    stripe.rotation.x = 0.12;
    stripe.castShadow = true;
    group.add(stripe);
  }

  // Display Tool on Counter
  const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.42), metalMat);
  anvil.position.set(-1.3, 1.4, 0.4);
  group.add(anvil);

  // Painted Signboard
  const signTex = createSignTexture('GEAR WORKSHOP', 'WALK HERE · PRESS F', '#2DD4BF', anisotropy);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.35, 0.15), signMat);
  signBoard.position.set(0, 3.9, 1.1);
  signBoard.castShadow = true;
  group.add(signBoard);

  // Ground Interaction Pad Ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const ringMesh = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.15, 36), ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(0, 0.05, 2.4);
  group.add(ringMesh);

  return { group, ringMesh };
}

export function createPalmTree(seed: number): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c583a, roughness: 0.9 });
  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });

  // Curved segmented trunk
  const segments = 6;
  let curX = 0;
  let curY = 0;
  const lean = 0.18 + (seed % 3) * 0.06;
  for (let i = 0; i < segments; i++) {
    const rBot = 0.34 - i * 0.032;
    const rTop = 0.31 - i * 0.032;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 1.1, 8), trunkMat);
    curX += lean * (i * 0.35);
    curY += 0.95;
    seg.position.set(curX, curY - 0.45, 0);
    seg.rotation.z = -lean * 0.45 * (i + 1) * 0.25;
    seg.castShadow = true;
    group.add(seg);
  }

  // Crown cluster of 7 arched palm fronds
  const topGroup = new THREE.Group();
  topGroup.position.set(curX, curY + 0.1, 0);
  for (let f = 0; f < 7; f++) {
    const angle = (f / 7) * Math.PI * 2 + (seed % 5);
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.1, 4), frondMat);
    frond.scale.set(0.7, 1, 0.16);
    frond.position.set(Math.cos(angle) * 1.35, -0.15, Math.sin(angle) * 1.35);
    frond.rotation.y = -angle;
    frond.rotation.z = -Math.PI / 2.4;
    frond.castShadow = true;
    topGroup.add(frond);
  }
  group.add(topGroup);
  return group;
}

export function createCoastalRock(scale: number): THREE.Group {
  const group = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.88,
    flatShading: true,
  });
  const main = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), rockMat);
  main.scale.set(1.25, 0.72, 1.0);
  main.position.y = scale * 0.35;
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  const side = new THREE.Mesh(new THREE.DodecahedronGeometry(scale * 0.58, 0), rockMat);
  side.position.set(scale * 0.85, scale * 0.22, scale * 0.3);
  side.castShadow = true;
  group.add(side);

  return group;
}

export function createHelperMesh(defId: string): THREE.Group {
  const group = new THREE.Group();
  if (defId === 'crab') {
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), shellMat);
    body.scale.set(1.25, 0.65, 1.0);
    body.position.y = 0.24;
    body.castShadow = true;
    group.add(body);

    const clawL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), clawMat);
    clawL.position.set(-0.38, 0.28, 0.32);
    group.add(clawL);
    const clawR = clawL.clone();
    clawR.position.x = 0.38;
    group.add(clawR);
  } else if (defId === 'beachcomber') {
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.75 });
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.9, 10), shirtMat);
    body.position.y = 0.48;
    body.castShadow = true;
    group.add(body);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.08, 14), hatMat);
    hat.position.y = 1.15;
    group.add(hat);
  } else if (defId === 'sandbot') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.35, metalness: 0.45 });
    const treadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.5,
    });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.44, 0.95), bodyMat);
    hull.position.y = 0.34;
    hull.castShadow = true;
    group.add(hull);
    const tread = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.22, 1.02), treadMat);
    tread.position.y = 0.11;
    group.add(tread);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.1), visorMat);
    visor.position.set(0, 0.4, 0.48);
    group.add(visor);
  } else {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.28, metalness: 0.7 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.3 });
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.7), bodyMat);
    core.position.y = 1.4;
    core.castShadow = true;
    group.add(core);
    for (const [rx, rz] of [
      [-0.55, -0.55],
      [0.55, -0.55],
      [-0.55, 0.55],
      [0.55, 0.55],
    ]) {
      const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16), rotorMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(rx, 1.48, rz);
      group.add(rotor);
    }
  }
  return group;
}

export function createTreasureMesh(kind: 'coin' | 'shell' | 'bottle' | 'gem'): THREE.Group {
  const group = new THREE.Group();
  if (kind === 'coin') {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0xca8a04,
      emissiveIntensity: 0.25,
    });
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 18), goldMat);
    coin.position.y = 0.18;
    group.add(coin);
  } else if (kind === 'gem') {
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.3,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), gemMat);
    gem.position.y = 0.3;
    group.add(gem);
  } else {
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      roughness: 0.35,
      metalness: 0.15,
    });
    const shell = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.45, 10), shellMat);
    shell.position.y = 0.22;
    group.add(shell);
  }
  return group;
}
