(function () {
  'use strict';

  const byId = id => document.getElementById(id);
  const shell = byId('game-shell');
  const container = byId('game-canvas');
  const helpDialog = byId('help-dialog');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys = new Set();
  const touchDirections = new Map();
  const particles = [];
  const sceneryAnimations = [];
  const materialCache = new Map();
  let renderer, scene, camera, player, playerParts, dynamicGroup, islandSurface;
  let layout, activeObstacles = [], activeItems = [];
  let combat, combatVisuals, damageFlash = 0;
  let deaths = 0, damageTaken = 0, dashesUsed = 0;
  let levelIndex = 0, collected = 0, mastered = 0, remaining = 65, journeyTime = 0;
  let state = 'ready', previousState = 'running', transitionTime = 0, transitionKind = '';
  let lastFrame = 0, animationTime = 0, toastTime = 0, walkTime = 0;
  let soundEnabled = false, audioContext, audioGain, ambientNodes = [];
  let warned = false, running = false;
  const cameraTarget = { x: 0, z: 0 };
  const icon = name => `<svg aria-hidden="true"><use href="#icon-${name}"/></svg>`;

  function showError(message) {
    state = 'error';
    shell.dataset.state = 'error';
    byId('error-message').textContent = message;
    byId('error-overlay').hidden = false;
    byId('start-panel').hidden = true;
    byId('pause-button').disabled = true;
    byId('dash-button').disabled = true;
    shell.classList.remove('playing');
    if (audioGain && audioContext) audioGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
  }

  byId('reload-button').addEventListener('click', () => location.reload());

  function material(color, options = {}) {
    const key = `${color}:${JSON.stringify(options)}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...options }));
    return materialCache.get(key);
  }

  function mesh(geometry, surface, parent, position = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, surface);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(parent, size, color, position, options) {
    return mesh(new THREE.BoxGeometry(...size), material(color, options), parent, position);
  }

  function sphere(parent, radius, color, position, options, detail = 12) {
    return mesh(new THREE.SphereGeometry(radius, detail, 10), material(color, options), parent, position);
  }

  function ring(parent, radius, tube, color, position, options = {}) {
    const object = mesh(new THREE.TorusGeometry(radius, tube, 6, 64), material(color, options), parent, position);
    object.rotation.x = Math.PI / 2;
    return object;
  }

  function batchStatic(parent, excluded = new Set()) {
    parent.updateMatrixWorld(true);
    const batches = new Map();
    const inverse = parent.matrixWorld.clone().invert();
    parent.traverse(object => {
      if (!object.isMesh || object.isInstancedMesh || excluded.has(object)) return;
      const key = `${object.material.id}:${object.castShadow}:${object.receiveShadow}`;
      if (!batches.has(key)) batches.set(key, { material: object.material, objects: [], positions: [], normals: [], uvs: [] });
      const batch = batches.get(key);
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      batch.positions.push(geometry.attributes.position.array);
      batch.normals.push(geometry.attributes.normal.array);
      batch.uvs.push(geometry.attributes.uv.array);
      batch.objects.push(object);
      geometry.dispose();
    });
    function combine(arrays) {
      const result = new Float32Array(arrays.reduce((length, array) => length + array.length, 0));
      let offset = 0;
      for (const array of arrays) { result.set(array, offset); offset += array.length; }
      return result;
    }
    for (const batch of batches.values()) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(combine(batch.positions), 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(combine(batch.normals), 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(combine(batch.uvs), 2));
      const combined = mesh(geometry, batch.material, parent);
      combined.castShadow = batch.objects[0].castShadow;
      combined.receiveShadow = batch.objects[0].receiveShadow;
      for (const object of batch.objects) { object.removeFromParent(); object.geometry.dispose(); }
    }
  }

  function makeGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(225,255,255,1)');
    gradient.addColorStop(0.18, 'rgba(136,238,255,.85)');
    gradient.addColorStop(0.45, 'rgba(69,218,255,.26)');
    gradient.addColorStop(1, 'rgba(49,203,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  let glowTexture;

  function addGlow(parent, color, size, position) {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(size, size, 1);
    glow.position.set(...position);
    parent.add(glow);
    return glow;
  }

  function makeTree(parent, random, blossom = false) {
    const group = new THREE.Group();
    parent.add(group);
    const height = 2.5 + random() * 1.6;
    const trunk = mesh(new THREE.CylinderGeometry(0.11, 0.24, height, 6), material('#6f6550'), group, [0, height / 2, 0]);
    trunk.rotation.z = (random() - 0.5) * 0.18;
    const foliage = blossom ? ['#dfb4a8', '#eac5b7', '#d99fa0', '#efd0bd'] : ['#769165', '#8fa774', '#a6b984', '#648460'];
    for (let branch = 0; branch < 5; branch += 1) {
      const angle = random() * Math.PI * 2;
      const offset = random() * 1.2;
      const crown = mesh(new THREE.IcosahedronGeometry(0.9 + random() * 0.65, 1), material(foliage[branch % foliage.length], { flatShading: true }), group, [Math.cos(angle) * offset, height - 0.1 + random() * 0.9, Math.sin(angle) * offset]);
      crown.scale.y = 0.65 + random() * 0.2;
    }
    return group;
  }

  function makeTemple(parent) {
    const temple = new THREE.Group();
    parent.add(temple);
    const stone = '#d2ceae';
    box(temple, [6.5, 0.45, 5], stone, [0, 0.2, 0]);
    box(temple, [5.9, 0.3, 4.5], '#e4ddbc', [0, 0.55, 0]);
    for (let stair = 0; stair < 4; stair += 1) box(temple, [2.5, 0.17, 0.48], '#dcd6b8', [0, 0.12 + stair * 0.13, 3.7 - stair * 0.4]);
    box(temple, [4.6, 2.3, 3.2], '#d9d7b4', [0, 1.75, -0.2]);
    box(temple, [1.2, 1.85, 0.1], '#4a6660', [0, 1.55, 1.44]);
    box(temple, [0.04, 1.8, 0.13], '#a39163', [0, 1.55, 1.51]);
    for (const side of [-1, 1]) {
      box(temple, [0.7, 0.95, 0.12], '#6e8a7b', [side * 1.5, 1.85, 1.45]);
      for (let slat = 0; slat < 3; slat += 1) box(temple, [0.06, 1, 0.15], '#bdad7b', [side * 1.5 + (slat - 1) * 0.23, 1.85, 1.51]);
      for (const depth of [-1, 1]) mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.7, 8), material('#ab6750'), temple, [side * 2.65, 1.9, depth * 1.9]);
    }
    function roof(width, depth, height, elevation) {
      const geometry = new THREE.CylinderGeometry(0.65, 1, height, 4, 1);
      geometry.rotateY(Math.PI / 4);
      const roofMesh = mesh(geometry, material('#5c8076', { flatShading: true }), temple, [0, elevation, 0]);
      roofMesh.scale.set(width / Math.SQRT2, 1, depth / Math.SQRT2);
      box(temple, [width, 0.13, depth], '#486c64', [0, elevation - height / 2, 0]);
      for (const side of [-1, 1]) {
        const tip = box(temple, [0.8, 0.12, depth + 0.25], '#52766c', [side * (width / 2 - 0.05), elevation - height / 2 + 0.17, 0]);
        tip.rotation.z = side * 0.35;
      }
    }
    roof(6.7, 5.1, 1.1, 3.6);
    box(temple, [2.9, 0.9, 2.25], '#d9d7b4', [0, 4.4, 0]);
    roof(4.6, 3.7, 0.9, 5.15);
    box(temple, [2.6, 0.12, 0.14], '#b49b62', [0, 5.64, 0]);
    mesh(new THREE.ConeGeometry(0.15, 0.8, 8), material('#b6a36a'), temple, [0, 6, 0]);
    return temple;
  }

  function createWorld() {
    const random = AvatarCore.createRandom(87533);
    const world = new THREE.Group();
    scene.add(world);
    const cliff = mesh(new THREE.CylinderGeometry(17.7, 13.8, 5.8, 54, 3), material('#777e68', { flatShading: true }), world, [0, -3.25, 0]);
    const positions = cliff.geometry.attributes.position;
    for (let vertex = 0; vertex < positions.count; vertex += 1) {
      const height = positions.getY(vertex);
      if (height < 2.8) {
        positions.setX(vertex, positions.getX(vertex) * (0.94 + random() * 0.12));
        positions.setZ(vertex, positions.getZ(vertex) * (0.94 + random() * 0.12));
      }
    }
    cliff.geometry.computeVertexNormals();
    mesh(new THREE.CylinderGeometry(17.95, 17.75, 0.52, 80), material('#a9b18b'), world, [0, -0.35, 0]);
    islandSurface = material('#a9bc86');
    mesh(new THREE.CylinderGeometry(17.8, 17.95, 0.22, 80), islandSurface, world, [0, -0.02, 0]);
    ring(world, 17.25, 0.14, '#c3cba0', [0, 0.09, 0]);
    ring(world, 2.45, 0.055, '#dce0b8', [0, 0.12, 0]);
    ring(world, 2.15, 0.025, '#dce0b8', [0, 0.12, 0]);
    const spawnDisc = mesh(new THREE.CylinderGeometry(2.43, 2.43, 0.02, 64), material('#c5cba2'), world, [0, 0.105, 0]);
    spawnDisc.receiveShadow = true;
    for (let segment = 0; segment < 3; segment += 1) {
      const curve = new THREE.EllipseCurve(0, 0, 0.55, 0.55, 0, Math.PI * 1.8, false, 0);
      const points = curve.getPoints(40).map(point => new THREE.Vector3(point.x + 0.55, 0.13, point.y));
      const stroke = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#8da27b' }));
      stroke.rotation.y = segment * Math.PI * 2 / 3;
      world.add(stroke);
    }
    for (let patch = 0; patch < 56; patch += 1) {
      const point = AvatarCore.randomPoint(random, 16.8);
      const grassPatch = mesh(new THREE.CircleGeometry(0.4 + random() * 2.1, 9), material(patch % 2 ? '#a1b47e' : '#b6c592'), world, [point.x, 0.097, point.z]);
      grassPatch.rotation.x = -Math.PI / 2;
      grassPatch.rotation.z = random() * Math.PI;
    }
    const grassGeometry = new THREE.ConeGeometry(0.065, 0.32, 3);
    const grasses = new THREE.InstancedMesh(grassGeometry, material('#799462'), 450);
    const dummy = new THREE.Object3D();
    for (let grass = 0; grass < 450; grass += 1) {
      const point = AvatarCore.randomPoint(random, 17);
      dummy.position.set(point.x, 0.23, point.z);
      dummy.rotation.set((random() - 0.5) * 0.4, random() * 6, (random() - 0.5) * 0.4);
      dummy.scale.setScalar(0.5 + random());
      dummy.updateMatrix();
      grasses.setMatrixAt(grass, dummy.matrix);
    }
    world.add(grasses);
    for (let rock = 0; rock < 43; rock += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 16.5 + random() * 1.3;
      const chunk = mesh(new THREE.DodecahedronGeometry(0.65 + random() * 1.3, 0), material(['#888e71', '#969a7c', '#777e68'][rock % 3], { flatShading: true }), world, [Math.cos(angle) * radius, -1 - random() * 3.5, Math.sin(angle) * radius]);
      chunk.scale.set(1, 1.1 + random(), 0.7);
      chunk.rotation.set(random(), random(), random());
    }
    for (let treeIndex = 0; treeIndex < 15; treeIndex += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 18.3 + random() * 1.4;
      const point = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
      mesh(new THREE.CylinderGeometry(1.8, 1.1, 1.3, 7), material('#8b9775'), world, [point.x, -0.9, point.z]);
      const tree = makeTree(world, random, treeIndex % 4 === 0);
      tree.position.set(point.x, -0.2, point.z);
      tree.scale.setScalar(0.65 + random() * 0.5);
    }
    const templeAngle = Math.PI * (1.06 + random() * 0.04);
    const templeRadius = 22.8;
    const templeX = Math.cos(templeAngle) * templeRadius;
    const templeZ = Math.sin(templeAngle) * templeRadius;
    mesh(new THREE.CylinderGeometry(5.4, 2.5, 5.5, 9), material('#8d987a', { flatShading: true }), world, [templeX, -2.9, templeZ]);
    mesh(new THREE.CylinderGeometry(5.45, 5.4, 0.4, 9), material('#b4c390'), world, [templeX, 0, templeZ]);
    const temple = makeTemple(world);
    temple.position.set(templeX, 0.25, templeZ);
    temple.rotation.y = 0.25;
    const bridge = box(world, [7.4, 0.18, 1.6], '#b5aa81', [(templeX - 16.5) / 2, 0.1, templeZ * 0.7]);
    bridge.rotation.y = -0.2;
    for (let cloudIndex = 0; cloudIndex < 22; cloudIndex += 1) {
      const cloud = new THREE.Group();
      const angle = random() * Math.PI * 2;
      const radius = 28 + random() * 40;
      cloud.position.set(Math.cos(angle) * radius, -7 + random() * 5, Math.sin(angle) * radius);
      for (let puff = 0; puff < 5; puff += 1) {
        const object = sphere(cloud, 1.4 + random() * 2.8, '#edf2e9', [(puff - 2) * 2.5, random() * 0.7, random() * 2], { roughness: 1 });
        object.scale.set(1.5, 0.38, 0.8);
        object.castShadow = false;
      }
      batchStatic(cloud);
      scene.add(cloud);
      sceneryAnimations.push({ object: cloud, kind: 'cloud', base: cloud.position.x, phase: random() * 7 });
    }
    for (let mountainIndex = 0; mountainIndex < 25; mountainIndex += 1) {
      const angle = random() * Math.PI * 2;
      const radius = 53 + random() * 35;
      const mountain = mesh(new THREE.ConeGeometry(6 + random() * 9, 14 + random() * 21, 5), material(['#aec8bb', '#bed2c3', '#a5c1b6'][mountainIndex % 3], { flatShading: true }), scene, [Math.cos(angle) * radius, -19 - random() * 9, Math.sin(angle) * radius]);
      mountain.scale.z = 0.65;
      mountain.castShadow = false;
    }
    for (let petalIndex = 0; petalIndex < 24; petalIndex += 1) {
      const petal = mesh(new THREE.PlaneGeometry(0.08, 0.19), material('#f4e7c9', { side: THREE.DoubleSide }), world, [(random() - 0.5) * 40, 1 + random() * 8, (random() - 0.5) * 40]);
      petal.castShadow = false;
      sceneryAnimations.push({ object: petal, kind: 'petal', base: petal.position.clone(), phase: random() * 8 });
    }
    batchStatic(world, new Set(sceneryAnimations.map(entry => entry.object)));
  }

  function createPlayer() {
    player = new THREE.Group();
    scene.add(player);
    const body = new THREE.Group();
    player.add(body);
    const skin = '#e8b480';
    const yellow = '#eab443';
    const red = '#a84935';
    const legs = [];
    const arms = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.2, 0.82, 0);
      body.add(leg);
      mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.53, 8), material('#d79a37'), leg, [0, -0.24, 0]);
      const shoe = sphere(leg, 0.17, '#754b38', [0, -0.56, 0.065]);
      shoe.scale.set(0.9, 0.75, 1.45);
      legs.push(leg);
      const arm = new THREE.Group();
      arm.position.set(side * 0.43, 1.39, 0);
      body.add(arm);
      mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.35, 8), material(yellow), arm, [side * 0.045, -0.11, 0]);
      mesh(new THREE.CylinderGeometry(0.11, 0.105, 0.32, 8), material(skin), arm, [side * 0.08, -0.39, 0]);
      sphere(arm, 0.12, skin, [side * 0.08, -0.58, 0]);
      arms.push(arm);
    }
    mesh(new THREE.CylinderGeometry(0.34, 0.43, 0.79, 12), material(yellow), body, [0, 1.15, 0]);
    mesh(new THREE.CylinderGeometry(0.43, 0.46, 0.22, 12), material(red), body, [0, 0.82, 0]);
    const sashShape = new THREE.Shape();
    sashShape.moveTo(-0.35, 1.51);
    sashShape.lineTo(-0.1, 1.52);
    sashShape.lineTo(0.36, 0.88);
    sashShape.lineTo(0.13, 0.86);
    const sash = mesh(new THREE.ShapeGeometry(sashShape), material(red, { side: THREE.DoubleSide }), body, [0, 0, 0.355]);
    sash.castShadow = false;
    sphere(body, 0.435, skin, [0, 1.97, 0]);
    for (const side of [-1, 1]) {
      sphere(body, 0.09, skin, [side * 0.435, 1.93, 0]);
      sphere(body, 0.052, '#f8f1df', [side * 0.145, 1.98, 0.395]);
      sphere(body, 0.027, '#473c2f', [side * 0.145, 1.98, 0.439]);
      const brow = box(body, [0.095, 0.017, 0.018], '#74604a', [side * 0.145, 2.07, 0.414]);
      brow.rotation.z = side * -0.1;
    }
    sphere(body, 0.048, skin, [0, 1.91, 0.429]);
    const smile = mesh(new THREE.TorusGeometry(0.07, 0.009, 4, 12, Math.PI * 0.8), material('#9e6e51'), body, [0, 1.86, 0.425]);
    smile.rotation.z = Math.PI * 1.1;
    const coordinates = [[-0.075, -0.36], [0.075, -0.36], [-0.075, 0.17], [0.075, -0.36], [0.075, 0.17], [-0.075, 0.17], [-0.21, 0.17], [0.21, 0.17], [0, 0.431]];
    const arrowVertices = [];
    function arrowTriangle(first, second, third, depth) {
      if (depth === 0) {
        for (const [horizontal, forward] of [first, second, third]) arrowVertices.push(horizontal, 1.97 + Math.sqrt(0.445 ** 2 - horizontal ** 2 - forward ** 2), forward);
        return;
      }
      const midpoint = (start, end) => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const firstMiddle = midpoint(first, second);
      const secondMiddle = midpoint(second, third);
      const thirdMiddle = midpoint(third, first);
      arrowTriangle(first, firstMiddle, thirdMiddle, depth - 1);
      arrowTriangle(firstMiddle, second, secondMiddle, depth - 1);
      arrowTriangle(thirdMiddle, secondMiddle, third, depth - 1);
      arrowTriangle(firstMiddle, secondMiddle, thirdMiddle, depth - 1);
    }
    for (let triangle = 0; triangle < coordinates.length; triangle += 3) arrowTriangle(coordinates[triangle], coordinates[triangle + 1], coordinates[triangle + 2], 3);
    const arrowGeometry = new THREE.BufferGeometry();
    arrowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arrowVertices, 3));
    arrowGeometry.computeVertexNormals();
    mesh(arrowGeometry, material('#74efff', { emissive: '#35bbf4', emissiveIntensity: 1.7, side: THREE.DoubleSide }), body);
    const staff = mesh(new THREE.CylinderGeometry(0.033, 0.033, 2.7, 7), material('#815633'), body, [0.54, 1.1, -0.23]);
    staff.rotation.z = -0.3;
    const aura = ring(player, 0.76, 0.025, '#d7f5d6', [0, 0.15, 0], { emissive: '#a6d5b6', emissiveIntensity: 0.3, transparent: true, opacity: 0.65 });
    player.scale.setScalar(1.12);
    player.rotation.y = 0.5;
    playerParts = { body, legs, arms, aura };
  }

  function createObstacle(data) {
    const group = new THREE.Group();
    dynamicGroup.add(group);
    group.position.set(data.x, 0.13, data.z);
    group.rotation.y = data.rotation;
    const radius = data.radius;
    const animated = new THREE.Group();
    group.add(animated);
    mesh(new THREE.CylinderGeometry(radius + 0.12, radius + 0.15, 0.12, 12), material('#8b9b78'), group, [0, 0, 0]);
    if (data.element === 'air') {
      for (let layer = 0; layer < 4; layer += 1) {
        const airRing = mesh(new THREE.TorusGeometry(radius * (0.42 + layer * 0.15), 0.055, 5, 40, Math.PI * 1.7), material('#d3eee0', { emissive: '#96c6a9', emissiveIntensity: 0.35, transparent: true, opacity: 0.8 }), animated, [0, 0.3 + layer * 0.35, 0]);
        airRing.rotation.set(Math.PI / 2 + 0.15, 0, layer * 1.9);
      }
      mesh(new THREE.ConeGeometry(radius * 0.83, 1.5, 20, 1, true), material('#c0debc', { transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }), animated, [0, 0.8, 0]);
    } else if (data.element === 'water') {
      const cube = box(animated, [radius * 1.3, 1.25, radius * 1.3], '#6eb8cd', [0, 0.69, 0], { transparent: true, opacity: 0.66, roughness: 0.12, metalness: 0.22, emissive: '#2f819f', emissiveIntensity: 0.12 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: '#c8f3ef', transparent: true, opacity: 0.55 }));
      cube.add(edges);
      box(animated, [radius * 0.9, 0.025, radius * 0.9], '#bef1ed', [0, 1.32, 0], { transparent: true, opacity: 0.45 });
    } else if (data.element === 'earth') {
      const rock = mesh(new THREE.DodecahedronGeometry(radius, 0), material('#99866a', { flatShading: true }), animated, [0, radius * 0.7, 0]);
      rock.rotation.set(0.22, data.phase, 0.15);
      rock.scale.set(0.98, 1.05, 0.92);
      const moss = mesh(new THREE.IcosahedronGeometry(radius * 0.48, 0), material('#92a273', { flatShading: true }), animated, [0.12, radius * 1.5, 0]);
      moss.scale.y = 0.25;
    } else if (data.element === 'fire') {
      mesh(new THREE.DodecahedronGeometry(radius * 0.8, 0), material('#7c6551', { flatShading: true }), group, [0, 0.3, 0]);
      for (let flameIndex = 0; flameIndex < 3; flameIndex += 1) {
        const flame = mesh(new THREE.ConeGeometry(radius * (flameIndex === 0 ? 0.5 : 0.28), flameIndex === 0 ? 1.55 : 0.95, 5), material(flameIndex === 0 ? '#f0a442' : '#df753b', { emissive: '#df5d1d', emissiveIntensity: 0.45, flatShading: true }), animated, [(flameIndex - 1) * radius * 0.36, flameIndex === 0 ? 1.03 : 0.72, 0]);
        flame.rotation.z = (flameIndex - 1) * 0.22;
      }
      addGlow(group, '#ffc97f', radius * 2.5, [0, 0.8, 0]);
    } else {
      box(animated, [radius * 1.32, 1.18, radius * 1.32], '#616d72', [0, 0.68, 0], { metalness: 0.92, roughness: 0.22 });
      for (const side of [-1, 1]) {
        box(animated, [radius * 1.36, 0.07, radius * 1.36], '#a5b3b5', [0, 0.68 + side * 0.46, 0], { metalness: 0.85, roughness: 0.28 });
        sphere(animated, 0.06, '#c3c9bb', [side * radius * 0.45, 0.9, radius * 0.67], { metalness: 0.75, roughness: 0.2 });
      }
    }
    return { ...data, mesh: group, animated };
  }

  function createItem(data) {
    const group = new THREE.Group();
    group.position.set(data.x, 1.05, data.z);
    dynamicGroup.add(group);
    sphere(group, 0.23, '#b2f8ff', [0, 0, 0], { emissive: '#49cce9', emissiveIntensity: 1.3, roughness: 0.1, metalness: 0.15 }, 16);
    const halo = ring(group, 0.4, 0.015, '#c8ffff', [0, 0, 0], { emissive: '#6ce7fa', emissiveIntensity: 0.7, transparent: true, opacity: 0.7 });
    halo.rotation.x = 0.8;
    addGlow(group, '#9cf1ff', 1.9, [0, 0, 0]);
    const ground = ring(dynamicGroup, 0.4, 0.018, '#c9ecce', [data.x, 0.14, data.z], { transparent: true, opacity: 0.8 });
    return { ...data, mesh: group, halo, ground, taken: false };
  }

  function disposeLevel() {
    if (!dynamicGroup) return;
    const geometries = new Set();
    const surfaces = new Set();
    dynamicGroup.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material && !Array.from(materialCache.values()).includes(object.material)) surfaces.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    surfaces.forEach(surface => surface.dispose());
    scene.remove(dynamicGroup);
    dynamicGroup = null;
    clearParticles();
  }

  function createCombatVisuals() {
    combatVisuals = { enemies: [], turrets: [], projectiles: [], zones: [] };
    for (const enemy of combat.enemies) {
      const group = new THREE.Group();
      dynamicGroup.add(group);
      const body = mesh(new THREE.IcosahedronGeometry(0.5, 0), material('#ad393a', { emissive: '#c5392c', emissiveIntensity: 0.55, flatShading: true }), group, [0, 0.9, 0]);
      body.scale.y = 1.3;
      for (const side of [-1, 1]) sphere(group, 0.07, '#fff0ad', [side * 0.16, 1, 0.43], { emissive: '#ffdb70', emissiveIntensity: 1 });
      const orbit = ring(group, 0.7, 0.04, '#e67b61', [0, 0.12, 0], { emissive: '#c54533', emissiveIntensity: 0.55 });
      const crown = ring(group, 0.59, 0.025, '#f19e76', [0, 1.14, 0], { emissive: '#d9583b', emissiveIntensity: 0.4 });
      crown.rotation.x = 0.9;
      combatVisuals.enemies.push({ group, body, crown, orbit, phase: enemy.phase });
    }
    for (const turret of combat.turrets) {
      const obstacle = layout.obstacles[turret.obstacleIndex];
      const halo = ring(dynamicGroup, obstacle.radius + 0.23, 0.045, '#dc6b50', [obstacle.x, 0.2, obstacle.z], { emissive: '#b62e22', emissiveIntensity: 0.5 });
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#e55742', transparent: true, opacity: 0.9 }));
      dynamicGroup.add(line);
      combatVisuals.turrets.push({ halo, line });
    }
    for (let index = 0; index < 32; index += 1) {
      const group = new THREE.Group();
      dynamicGroup.add(group);
      sphere(group, 0.23, '#ffc779', [0, 0, 0], { emissive: '#ff5c24', emissiveIntensity: 1.2 }, 8);
      addGlow(group, '#ff8d49', 1.35, [0, 0, 0]);
      group.visible = false;
      combatVisuals.projectiles.push(group);
    }
    for (let index = 0; index < 6; index += 1) {
      const group = new THREE.Group();
      dynamicGroup.add(group);
      const border = ring(group, 1, 0.025, '#e55a40', [0, 0.15, 0], { emissive: '#dc341f', emissiveIntensity: 0.55 });
      const disc = mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: '#db4b32', transparent: true, opacity: 0.16, depthWrite: false }), group, [0, 0.14, 0]);
      disc.rotation.x = -Math.PI / 2;
      const eruption = mesh(new THREE.ConeGeometry(0.9, 1.8, 7), material('#ef8e40', { emissive: '#e54c20', emissiveIntensity: 0.8, transparent: true, opacity: 0.72 }), group, [0, 0.8, 0]);
      eruption.visible = false;
      group.visible = false;
      combatVisuals.zones.push({ group, border, disc, eruption });
    }
    syncCombatVisuals();
  }

  function syncCombatVisuals() {
    if (!combatVisuals) return;
    combat.enemies.forEach((enemy, index) => {
      const visual = combatVisuals.enemies[index];
      visual.group.position.set(enemy.x, 0, enemy.z);
      visual.group.rotation.y = Math.atan2(player.position.x - enemy.x, player.position.z - enemy.z);
      visual.body.position.y = 0.9 + Math.sin(animationTime * 4 + visual.phase) * 0.09;
      visual.crown.rotation.z = animationTime * 2 + visual.phase;
    });
    combat.turrets.forEach((turret, index) => {
      const visual = combatVisuals.turrets[index];
      visual.halo.scale.setScalar(turret.warning > 0 ? 1 + Math.sin(combat.time * 18) * 0.1 : 1);
      visual.line.visible = turret.warning > 0;
      if (turret.target) {
        const obstacle = layout.obstacles[turret.obstacleIndex];
        const positions = visual.line.geometry.attributes.position;
        positions.setXYZ(0, obstacle.x, 0.23, obstacle.z);
        positions.setXYZ(1, turret.target.x, 0.23, turret.target.z);
        positions.needsUpdate = true;
        visual.line.geometry.computeBoundingSphere();
      }
    });
    combatVisuals.projectiles.forEach((group, index) => {
      const projectile = combat.projectiles[index];
      group.visible = Boolean(projectile);
      if (projectile) group.position.set(projectile.x, 0.8, projectile.z);
    });
    combatVisuals.zones.forEach((visual, index) => {
      const zone = combat.zones[index];
      visual.group.visible = Boolean(zone);
      if (!zone) return;
      visual.group.position.set(zone.x, 0, zone.z);
      visual.group.scale.set(zone.radius, 1, zone.radius);
      visual.disc.material.opacity = zone.warning > 0 ? 0.12 + (1 - zone.warning / 1.25) * 0.18 : 0.55;
      visual.eruption.visible = zone.warning <= 0;
      visual.eruption.scale.y = zone.warning > 0 ? 0.01 : 0.4 + zone.active * 2;
      visual.border.scale.setScalar(1 + Math.sin(combat.time * 16) * 0.025);
    });
    updateCombatHud();
  }

  function updateCombatHud() {
    if (!combat) return;
    const hearts = byId('health-hearts');
    if (hearts.dataset.health !== String(combat.health)) {
      hearts.innerHTML = Array.from({ length: AvatarCombat.MAX_HEALTH }, (unused, index) => `<span class="heart ${index < combat.health ? '' : 'lost'}" aria-hidden="true">♥</span>`).join('');
      hearts.dataset.health = combat.health;
      hearts.setAttribute('aria-valuenow', combat.health);
      hearts.setAttribute('aria-valuetext', `${combat.health} de ${AvatarCombat.MAX_HEALTH} vidas`);
    }
    const ready = combat.dashCooldown <= 0;
    byId('dash-button').disabled = state !== 'running' || !ready;
    byId('dash-status').textContent = ready ? 'ESPAÇO / SHIFT' : `RECARGA ${combat.dashCooldown.toFixed(1)}s`;
    byId('dash-charge').style.transform = `scaleX(${1 - combat.dashCooldown / AvatarCombat.DASH_COOLDOWN})`;
    shell.classList.toggle('low-health', combat.health === 1);
    shell.classList.toggle('has-threats', levelIndex > 0);
    shell.classList.toggle('dash-active', combat.dashRemaining > 0);
    shell.style.setProperty('--damage-flash', Math.min(0.55, damageFlash * 1.5));
  }

  function dash() {
    if (state !== 'running' || !combat.requestDash(readMovement())) return;
    container.focus({ preventScroll: true });
    dashesUsed += 1;
    burst(player.position.x, 0.35, player.position.z, 8, '#b9f4e9');
    playChime([440, 880]);
    updateCombatHud();
  }

  function loadLevel(index) {
    disposeLevel();
    levelIndex = index;
    layout = AvatarCore.generateLevel(index);
    dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    activeObstacles = layout.obstacles.map(createObstacle);
    activeItems = layout.items.map(createItem);
    combat = new AvatarCombat.CombatSimulation(index, layout);
    damageFlash = 0;
    playerParts.body.visible = true;
    createCombatVisuals();
    collected = 0;
    remaining = AvatarCore.LEVELS[index].time;
    warned = false;
    player.position.set(0, 0, 0);
    player.rotation.y = 0.5;
    cameraTarget.x = cameraTarget.z = 0;
    keys.clear();
    touchDirections.clear();
    byId('threat-label').textContent = index === 0 ? 'Treinamento · sem ameaças' : `${combat.enemies.length} caçadores · ${combat.turrets.length} sentinela${combat.turrets.length > 1 ? 's' : ''}${combat.level.hazardCount ? ' · erupções' : ''}`;
    islandSurface.color.set(['#a9bc86', '#a5bba0', '#b7b286', '#b9b087', '#a9b6a3'][index]);
    byId('phase-banner').hidden = true;
    updateHud();
    updateProgress();
    updateCamera(1);
  }

  function updateHud() {
    const level = AvatarCore.LEVELS[levelIndex];
    byId('level-label').textContent = `FASE ${String(levelIndex + 1).padStart(2, '0')} / 05`;
    byId('level-name').textContent = level.title;
    byId('level-symbol').innerHTML = `<use href="#icon-${level.icon}"/>`;
    byId('location-text').textContent = level.location;
    byId('timer').textContent = AvatarCore.formatTime(remaining);
    byId('collected').textContent = collected;
    byId('total').textContent = level.count;
    const missing = level.count - collected;
    byId('mission-text').textContent = missing === 1 ? 'Falta uma esfera. Siga o brilho!' : `Colete as ${missing} esferas de energia espiritual.`;
    shell.classList.toggle('timer-warning', remaining <= 15 && state !== 'ready');
  }

  function updateProgress() {
    byId('element-grid').innerHTML = AvatarCore.LEVELS.map((level, index) => {
      const status = index < mastered ? 'complete' : index === levelIndex ? 'current' : '';
      const lesson = index < mastered ? 'Elemento dominado' : level.lesson;
      return `<article class="element-card ${status}" style="--element-color:${level.color}" ${status === 'current' ? 'aria-current="step"' : ''}><span class="element-number">0${index + 1}</span><span class="element-icon">${icon(level.icon)}</span><div><h3>${level.name}</h3><p>${lesson}</p></div><span class="element-state"></span></article>`;
    }).join('');
    byId('journey-dots').innerHTML = AvatarCore.LEVELS.map((level, index) => `<span class="journey-dot ${index < mastered ? 'complete' : index === levelIndex ? 'current' : ''}" title="${level.name}${index < mastered ? ' — dominado' : ''}" aria-label="${level.name}${index < mastered ? ' dominado' : ''}">${icon(index < mastered ? 'check' : level.icon)}</span>`).join('');
    byId('mastered-count').textContent = mastered;
  }

  function toast(message, duration = 3) {
    byId('toast').textContent = message;
    byId('toast').classList.add('visible');
    toastTime = duration;
  }

  function setState(next) {
    state = next;
    shell.dataset.state = next;
    shell.classList.toggle('playing', next === 'running');
    byId('pause-button').disabled = !['running', 'paused', 'transition'].includes(next);
    byId('pause-button').setAttribute('aria-label', next === 'paused' ? 'Continuar jogo' : 'Pausar jogo');
    byId('pause-overlay').hidden = next !== 'paused';
    byId('victory-overlay').hidden = next !== 'victory';
    byId('start-panel').hidden = next !== 'ready';
    updateCombatHud();
    if (audioGain && audioContext) audioGain.gain.setTargetAtTime(soundEnabled && next !== 'paused' ? 0.25 : 0, audioContext.currentTime, 0.2);
  }

  function startJourney() {
    mastered = 0;
    journeyTime = 0;
    deaths = damageTaken = dashesUsed = 0;
    loadLevel(0);
    setState('running');
    container.focus({ preventScroll: true });
    toast('Menos tempo. Mais desafios. Use Espaço para esquivar.');
    playChime([523.25, 659.25, 783.99]);
  }

  function pause() {
    if (state !== 'running' && state !== 'transition') return;
    previousState = state;
    keys.clear();
    touchDirections.clear();
    setState('paused');
    byId('resume-button').focus({ preventScroll: true });
  }

  function resume() {
    if (state !== 'paused') return;
    setState(previousState);
    lastFrame = performance.now();
    container.focus({ preventScroll: true });
  }

  function restart() {
    if (!['running', 'paused', 'transition'].includes(state)) return;
    mastered = Math.min(mastered, levelIndex);
    loadLevel(levelIndex);
    setState('running');
    container.focus({ preventScroll: true });
    toast('Um novo começo. Você consegue!');
  }

  function beginTransition(kind) {
    if (kind === 'defeat') deaths += 1;
    transitionKind = kind;
    transitionTime = kind === 'complete' ? 2.4 : 2.1;
    setState('transition');
    keys.clear();
    touchDirections.clear();
    byId('phase-banner').hidden = false;
    if (kind === 'complete') {
      mastered = levelIndex + 1;
      updateProgress();
      byId('banner-eyebrow').textContent = `${AvatarCore.LEVELS[levelIndex].name.toUpperCase()} · ELEMENTO DOMINADO`;
      byId('banner-title').textContent = AvatarCore.LEVELS[levelIndex].message;
      byId('banner-subtitle').textContent = levelIndex === 4 ? 'O espírito do Avatar despertou.' : 'Um novo desafio espera por você...';
      playChime([523.25, 659.25, 783.99, 1046.5]);
      burst(player.position.x, 1.5, player.position.z, 40, '#efe4a9');
    } else if (kind === 'defeat') {
      byId('banner-eyebrow').textContent = 'SUAS VIDAS ACABARAM';
      byId('banner-title').textContent = 'O espírito do Avatar resiste.';
      byId('banner-subtitle').textContent = 'A fase vai reiniciar. Use cobertura e esquiva para sobreviver.';
      playChime([293.66, 220, 146.83]);
    } else {
      byId('banner-eyebrow').textContent = 'O TEMPO ACABOU';
      byId('banner-title').textContent = 'Respire. Tente outra vez.';
      byId('banner-subtitle').textContent = 'A fase reinicia automaticamente. O caminho continua.';
      playChime([392, 329.63, 261.63]);
    }
  }

  function finishJourney() {
    byId('phase-banner').hidden = true;
    setState('victory');
    byId('victory-orbs').textContent = AvatarCore.LEVELS.reduce((sum, level) => sum + level.count, 0);
    byId('victory-time').textContent = AvatarCore.formatTime(journeyTime);
    byId('survival-summary').textContent = `${dashesUsed} esquivas · ${damageTaken} danos sofridos · ${deaths} derrotas`;
    byId('victory-elements').innerHTML = AvatarCore.LEVELS.map(level => icon(level.icon)).join('');
    byId('play-again-button').focus({ preventScroll: true });
    burst(0, 3, 0, 65, '#f5e8ad');
  }

  const particleGeometry = () => new THREE.IcosahedronGeometry(0.07, 0);
  let sharedParticleGeometry;
  let effectsRandom;

  function burst(horizontal, elevation, depth, count, color = '#a7f6ff') {
    for (let index = 0; index < count; index += 1) {
      const object = mesh(sharedParticleGeometry, material(color, { emissive: color, emissiveIntensity: 0.4 }), scene, [horizontal, elevation, depth]);
      object.castShadow = false;
      const angle = effectsRandom() * Math.PI * 2;
      const speed = 0.8 + effectsRandom() * 2.7;
      particles.push({ object, velocity: new THREE.Vector3(Math.cos(angle) * speed, 1 + effectsRandom() * 3, Math.sin(angle) * speed), life: 0.7 + effectsRandom() * 0.7 });
    }
  }

  function clearParticles() {
    for (const particle of particles) scene.remove(particle.object);
    particles.length = 0;
  }

  function updateParticles(delta) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= delta;
      particle.velocity.y -= delta * 3;
      particle.object.position.addScaledVector(particle.velocity, delta);
      particle.object.scale.setScalar(Math.min(1, Math.max(0, particle.life) * 2));
      if (particle.life <= 0) {
        scene.remove(particle.object);
        particles.splice(index, 1);
      }
    }
  }

  function playChime(notes) {
    if (!soundEnabled || !audioContext) return;
    const now = audioContext.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0, now + index * 0.11);
      volume.gain.linearRampToValueAtTime(0.22, now + index * 0.11 + 0.018);
      volume.gain.exponentialRampToValueAtTime(0.001, now + index * 0.11 + 0.8);
      oscillator.connect(volume);
      volume.connect(audioGain);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + index * 0.11 + 0.85);
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
    });
  }

  async function toggleSound() {
    try {
      if (!audioContext) {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (!AudioEngine) throw new Error('Áudio não disponível');
        audioContext = new AudioEngine();
        audioGain = audioContext.createGain();
        audioGain.gain.value = 0;
        audioGain.connect(audioContext.destination);
        ambientNodes = [130.81, 196, 261.63].map(frequency => {
          const oscillator = audioContext.createOscillator();
          const volume = audioContext.createGain();
          volume.gain.value = 0.035;
          oscillator.frequency.value = frequency;
          oscillator.connect(volume);
          volume.connect(audioGain);
          oscillator.start();
          return oscillator;
        });
      }
      await audioContext.resume();
      soundEnabled = !soundEnabled;
      audioGain.gain.setTargetAtTime(soundEnabled && state !== 'paused' ? 0.25 : 0, audioContext.currentTime, 0.2);
      byId('sound-button').innerHTML = `<svg class="icon"><use href="#icon-${soundEnabled ? 'sound' : 'muted'}"/></svg>`;
      byId('sound-button').setAttribute('aria-label', soundEnabled ? 'Desativar som' : 'Ativar som');
      byId('sound-button').setAttribute('aria-pressed', String(soundEnabled));
      byId('sound-button').title = `${soundEnabled ? 'Desativar' : 'Ativar'} som (M)`;
      if (soundEnabled) playChime([523.25, 783.99]);
    } catch (error) {
      toast('O áudio não está disponível neste navegador.');
    }
  }

  function readMovement() {
    const touches = Array.from(touchDirections.values());
    const right = keys.has('KeyD') || keys.has('ArrowRight') || touches.includes('right');
    const left = keys.has('KeyA') || keys.has('ArrowLeft') || touches.includes('left');
    const forward = keys.has('KeyW') || keys.has('ArrowUp') || touches.includes('up');
    const backward = keys.has('KeyS') || keys.has('ArrowDown') || touches.includes('down');
    const horizontal = Number(right) - Number(left);
    const vertical = Number(backward) - Number(forward);
    const azimuth = Math.atan2(27, 36);
    return { x: horizontal * Math.cos(azimuth) + vertical * Math.sin(azimuth), z: -horizontal * Math.sin(azimuth) + vertical * Math.cos(azimuth) };
  }

  function updateGame(elapsed) {
    if (state === 'transition') {
      transitionTime -= elapsed;
      if (transitionTime <= 0) {
        if (transitionKind === 'complete' && levelIndex === 4) {
          finishJourney();
        } else {
          loadLevel(transitionKind === 'complete' ? levelIndex + 1 : levelIndex);
          setState('running');
          toast(transitionKind === 'complete' ? levelIndex === 1 ? 'Caçadores despertaram! Vermelho é perigo. Espaço esquiva.' : `${AvatarCore.LEVELS[levelIndex].title}. Mais ameaças. Vitalidade restaurada.` : 'Três vidas restauradas. Proteção inicial ativada.', 4);
        }
      }
      return;
    }
    if (state !== 'running') return;
    const activeElapsed = Math.min(elapsed, remaining);
    remaining = Math.max(0, remaining - elapsed);
    journeyTime += activeElapsed;
    byId('timer').textContent = AvatarCore.formatTime(remaining);
    shell.classList.toggle('timer-warning', remaining <= 15);
    if (remaining <= 0) {
      updateHud();
      beginTransition('timeout');
      return;
    }
    if (remaining <= 15 && !warned) {
      warned = true;
      toast('Últimos 15 segundos. Confie no seu caminho.');
      playChime([440, 523.25]);
    }
    const movement = readMovement();
    running = movement.x !== 0 || movement.z !== 0;
    const next = combat.update(elapsed, player.position, movement);
    player.position.x = next.x;
    player.position.z = next.z;
    for (const event of combat.events) {
      if (event.type === 'damage') {
        damageTaken += 1;
        damageFlash = 0.38;
        burst(next.x, 1, next.z, 14, '#ef927b');
        playChime([164.81, 130.81]);
        toast(combat.health > 0 ? `${event.source}: −1 vida. ${combat.health === 1 ? 'Última vida! Esquive com Espaço.' : 'Use a esquiva para escapar.'}` : 'Sem vidas. Sua fase vai reiniciar.', 2.5);
      } else if (event.type === 'deflect') {
        burst(event.x, 0.7, event.z, 7, '#a9f5e5');
      } else if (event.type === 'warning') {
        toast('O chão vai explodir! Saia dos círculos vermelhos.', 1.6);
        playChime([349.23, 440]);
      }
    }
    syncCombatVisuals();
    if (combat.health <= 0) {
      beginTransition('defeat');
      return;
    }
    if (running) {
      const desired = Math.atan2(movement.x, movement.z);
      const difference = Math.atan2(Math.sin(desired - player.rotation.y), Math.cos(desired - player.rotation.y));
      player.rotation.y += difference * Math.min(1, elapsed * 14);
    }
    const collider = { x: next.x, z: next.z, radius: AvatarCore.PLAYER_RADIUS };
    for (const item of activeItems) {
      if (!item.taken && (AvatarCore.overlaps(collider, item) || combat.path.some((position, index) => index > 0 && AvatarCore.segmentImpact(combat.path[index - 1], position, item, AvatarCore.PLAYER_RADIUS + item.radius) !== null))) {
        item.taken = true;
        item.mesh.visible = false;
        item.ground.visible = false;
        collected += 1;
        burst(item.x, 1, item.z, 13);
        playChime([[523.25, 659.25, 783.99, 880, 1046.5][collected % 5], 1318.51]);
        updateHud();
        if (collected === AvatarCore.LEVELS[levelIndex].count) {
          beginTransition('complete');
          break;
        }
      }
    }
  }

  function updateCamera(delta) {
    const blend = Math.min(1, delta * 3.5);
    const follow = container.clientWidth < 650 ? 0.55 : 0.24;
    cameraTarget.x += (player.position.x * follow - cameraTarget.x) * blend;
    cameraTarget.z += (player.position.z * follow - cameraTarget.z) * blend;
    const shake = reducedMotion ? 0 : damageFlash * 0.22;
    camera.position.set(27 + cameraTarget.x + Math.sin(animationTime * 73) * shake, 35, 36 + cameraTarget.z + Math.cos(animationTime * 61) * shake);
    camera.lookAt(cameraTarget.x, -0.35, cameraTarget.z);
  }

  function animateWorld(delta) {
    const time = animationTime;
    damageFlash = Math.max(0, damageFlash - delta);
    syncCombatVisuals();
    for (const item of activeItems) {
      if (item.taken) continue;
      item.mesh.position.y = 1.12 + Math.sin(time * 2 + item.phase) * 0.17;
      item.halo.rotation.z = time * 0.6 + item.phase;
      item.halo.rotation.y = Math.sin(time + item.phase) * 0.4;
    }
    for (const obstacle of activeObstacles) {
      if (obstacle.element === 'air') obstacle.animated.rotation.y = time * 1.7 + obstacle.phase;
      if (obstacle.element === 'fire') obstacle.animated.scale.y = 1 + Math.sin(time * 6 + obstacle.phase) * 0.14;
      if (obstacle.element === 'water') obstacle.animated.position.y = Math.sin(time * 1.5 + obstacle.phase) * 0.055;
    }
    for (const entry of sceneryAnimations) {
      if (entry.kind === 'cloud') entry.object.position.x = entry.base + Math.sin(time * 0.04 + entry.phase) * 2.5;
      if (entry.kind === 'petal') {
        entry.object.position.x = entry.base.x + Math.sin(time * 0.3 + entry.phase) * 3;
        entry.object.position.y = 0.3 + (entry.base.y + time * 0.35) % 8;
        entry.object.position.z = entry.base.z + Math.sin(time * 0.2 + entry.phase) * 2;
        entry.object.rotation.set(time + entry.phase, time * 0.4, time * 0.7);
      }
    }
    const moving = (running || combat.dashRemaining > 0) && state === 'running';
    playerParts.body.visible = combat.invulnerable <= 0 || combat.time < 2.5 || Math.floor(animationTime * 12) % 2 === 0;
    if (moving) walkTime += delta * 12;
    const limbBlend = Math.min(1, delta * 14);
    playerParts.legs.forEach((leg, index) => {
      const target = moving ? Math.sin(walkTime + index * Math.PI) * 0.65 : 0;
      leg.rotation.x += (target - leg.rotation.x) * limbBlend;
    });
    playerParts.arms.forEach((arm, index) => {
      const target = moving ? Math.sin(walkTime + index * Math.PI + Math.PI) * 0.5 : Math.sin(time * 1.4) * 0.035;
      arm.rotation.x += (target - arm.rotation.x) * limbBlend;
    });
    playerParts.body.position.y = moving ? Math.abs(Math.sin(walkTime)) * 0.075 : Math.sin(time * 2) * 0.018;
    playerParts.aura.scale.setScalar((combat.dashRemaining > 0 ? 1.8 : 1) + Math.sin(time * 1.7) * 0.065);
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / Math.max(1, height);
    const span = aspect < 1 ? 32 / aspect : 33;
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.5 : 2));
  }

  function frame(timestamp) {
    requestAnimationFrame(frame);
    const elapsed = lastFrame ? Math.max(0, (timestamp - lastFrame) / 1000) : 0;
    const delta = Math.min(elapsed, 0.05);
    lastFrame = timestamp;
    if (state === 'error' || document.hidden) return;
    updateGame(elapsed);
    if (state !== 'paused') {
      animationTime += delta * (reducedMotion ? 0.35 : 1);
      animateWorld(delta);
      updateParticles(delta);
      if (toastTime > 0) {
        toastTime -= elapsed;
        if (toastTime <= 0) byId('toast').classList.remove('visible');
      }
    }
    updateCamera(delta);
    renderer.render(scene, camera);
  }

  function bindControls() {
    byId('start-button').addEventListener('click', startJourney);
    byId('play-again-button').addEventListener('click', startJourney);
    byId('pause-button').addEventListener('click', () => state === 'paused' ? resume() : pause());
    byId('resume-button').addEventListener('click', resume);
    byId('restart-button').addEventListener('click', restart);
    byId('sound-button').addEventListener('click', toggleSound);
    byId('dash-button').addEventListener('click', dash);
    byId('dash-button').addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      event.preventDefault();
      dash();
    });
    byId('fullscreen-button').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (shell.requestFullscreen) await shell.requestFullscreen();
        else shell.classList.toggle('expanded');
      } catch (error) {
        shell.classList.toggle('expanded');
      }
      resize();
    });
    byId('help-button').addEventListener('click', () => {
      pause();
      helpDialog.showModal();
    });
    byId('close-help').addEventListener('click', () => helpDialog.close());
    byId('help-done').addEventListener('click', () => helpDialog.close());
    helpDialog.addEventListener('close', () => {
      if (state === 'paused') byId('resume-button').focus({ preventScroll: true });
    });
    const movementKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    document.addEventListener('keydown', event => {
      if (helpDialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
      if (movementKeys.includes(event.code) && ['running', 'paused', 'transition'].includes(state)) {
        event.preventDefault();
        if (state === 'running') keys.add(event.code);
      }
      if (event.repeat) return;
      if (['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code) && state === 'running') {
        if (event.code === 'Space' && event.target.closest?.('button, a, input')) return;
        event.preventDefault();
        dash();
      }
      if (event.code === 'KeyP' || event.code === 'Escape') {
        event.preventDefault();
        if (event.code === 'Escape') shell.classList.remove('expanded');
        state === 'paused' ? resume() : pause();
      }
      if (event.code === 'KeyR') restart();
      if (event.code === 'KeyM') toggleSound();
      if (event.code === 'Tab' && ['paused', 'victory'].includes(state)) {
        const overlay = byId(state === 'paused' ? 'pause-overlay' : 'victory-overlay');
        const buttons = [...overlay.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    document.addEventListener('keyup', event => keys.delete(event.code));
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); lastFrame = performance.now(); });
    container.addEventListener('pointerdown', () => container.focus({ preventScroll: true }));
    byId('touch-controls').querySelectorAll('button').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        if (state === 'running') touchDirections.set(event.pointerId, button.dataset.direction);
      });
      for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(eventName, event => touchDirections.delete(event.pointerId));
    });
    document.addEventListener('fullscreenchange', resize);
    new ResizeObserver(resize).observe(container);
  }

  function initialize() {
    if (!window.THREE || !window.AvatarCore || !window.AvatarCombat) {
      showError('Os arquivos do jogo não foram encontrados. Mantenha index.html, style.css, script.js, game-core.js, combat-core.js e a pasta vendor juntos.');
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      container.appendChild(renderer.domElement);
      renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        showError('O navegador interrompeu a aceleração 3D. Feche outras abas pesadas e clique em tentar novamente.');
      });
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#c5dcd7');
      scene.fog = new THREE.Fog('#c5dcd7', 65, 145);
      camera = new THREE.OrthographicCamera(-30, 30, 16, -16, 0.1, 220);
      scene.add(new THREE.HemisphereLight('#eff7e4', '#85917e', 2.6));
      const sunlight = new THREE.DirectionalLight('#fff0d1', 3.4);
      sunlight.position.set(-16, 31, 15);
      sunlight.castShadow = true;
      sunlight.shadow.mapSize.set(2048, 2048);
      sunlight.shadow.camera.left = -32;
      sunlight.shadow.camera.right = 32;
      sunlight.shadow.camera.top = 32;
      sunlight.shadow.camera.bottom = -32;
      sunlight.shadow.camera.far = 100;
      sunlight.shadow.normalBias = 0.04;
      sunlight.shadow.bias = -0.0001;
      sunlight.shadow.radius = 3;
      scene.add(sunlight);
      const fill = new THREE.DirectionalLight('#c7e4e5', 0.8);
      fill.position.set(20, 12, -25);
      scene.add(fill);
      const environmentScene = new THREE.Scene();
      environmentScene.background = new THREE.Color('#b4cbc3');
      mesh(new THREE.SphereGeometry(8, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff4de' }), environmentScene, [-12, 18, 8]);
      mesh(new THREE.BoxGeometry(25, 2, 25), new THREE.MeshBasicMaterial({ color: '#445f57' }), environmentScene, [0, -8, 0]);
      const generator = new THREE.PMREMGenerator(renderer);
      const environment = generator.fromScene(environmentScene, 0.05);
      scene.environment = environment.texture;
      generator.dispose();
      environmentScene.traverse(object => { if (object.geometry) object.geometry.dispose(); if (object.material) object.material.dispose(); });
      glowTexture = makeGlowTexture();
      sharedParticleGeometry = particleGeometry();
      effectsRandom = AvatarCore.createRandom(77031);
      createWorld();
      createPlayer();
      loadLevel(0);
      setState('ready');
      bindControls();
      resize();
      updateCamera(1);
      renderer.render(scene, camera);
      document.documentElement.dataset.gameReady = 'true';
      if (new URLSearchParams(location.search).has('debug')) {
        window.AvatarDebug = Object.freeze({
          snapshot: () => ({ state, level: levelIndex + 1, collected, mastered, remaining, journeyTime, deaths, damageTaken, dashesUsed, combat: { health: combat.health, invulnerable: combat.invulnerable, time: combat.time, dashCooldown: combat.dashCooldown, dashRemaining: combat.dashRemaining, enemies: combat.enemies.map(enemy => ({ ...enemy })), projectiles: combat.projectiles.map(projectile => ({ ...projectile })), zones: combat.zones.map(zone => ({ ...zone })) }, player: { x: player.position.x, z: player.position.z }, layout: JSON.parse(JSON.stringify(layout)), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries }),
          step: elapsed => { if (Number.isFinite(elapsed) && elapsed >= 0) updateGame(elapsed); },
          teleport: (horizontal, depth) => { if (Number.isFinite(horizontal) && Number.isFinite(depth) && Math.hypot(horizontal, depth) < AvatarCore.ARENA_RADIUS) player.position.set(horizontal, 0, depth); }
        });
      }
      requestAnimationFrame(frame);
      window.addEventListener('pagehide', () => {
        if (audioContext && audioContext.state !== 'closed') audioContext.suspend().catch(() => {});
      });
    } catch (error) {
      console.error('Não foi possível iniciar o jogo:', error);
      showError('Não foi possível iniciar o WebGL. Abra em um navegador com aceleração de hardware e confira se todos os arquivos estão na mesma pasta.');
    }
  }

  initialize();
})();
