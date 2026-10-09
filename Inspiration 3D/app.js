(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  function fail(message) { $('error').hidden = false; $('error').textContent = message; }
  if (!window.THREE || !THREE.OrbitControls || !window.Sculpture) {
    fail('Não foi possível carregar o projeto. Mantenha index.html, style.css, app.js, sculpture.js e a pasta vendor juntos.'); return;
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070e14');
  scene.fog = new THREE.FogExp2('#070e14', .026);
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); }
  catch (error) { fail('WebGL indisponível. Abra o projeto em um navegador com aceleração gráfica ativada.'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  $('scene').appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Arraste para girar a câmera e use a roda do mouse para aproximar.');
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .055;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * .87;
  scene.add(new THREE.AmbientLight(0xd5e7ef, .65));
  const light = new THREE.PointLight(0xffffff, 1.5, 30);
  light.position.set(3, 4, 5); scene.add(light);
  const rim = new THREE.PointLight(0xffffff, 1.3, 25);
  rim.position.set(-4, 1, -3); scene.add(rim);
  const state = { seed: 'INSPIRATION-108', style: 'lotus', count: 1800, speed: .12, thickness: 1, paused: false };
  let sculpture, connections, data, colors, noticeTimer, rebuildTimer;
  const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  const start = new THREE.Vector3(), end = new THREE.Vector3(), delta = new THREE.Vector3();
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = spriteCanvas.height = 64;
  const ctx = spriteCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.15, '#ffffff');
  gradient.addColorStop(.35, 'rgba(255,255,255,.35)'); gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const sprite = new THREE.CanvasTexture(spriteCanvas);
  // Partículas de fundo com PRNG separado: não interfere na semente da obra.
  const starRandom = Sculpture.randomFromSeed('inspiration-stars');
  const starPositions = [], starColors = [];
  for (let i = 0; i < 950; i++) {
    starPositions.push((starRandom() - .5) * 42, (starRandom() - .5) * 30, (starRandom() - .5) * 32 - 7);
    const c = new THREE.Color().setHSL(.46 + starRandom() * .15, .2, .24 + starRandom() * .32);
    starColors.push(c.r, c.g, c.b);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ size: .065, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(stars);
  function dispose(group) {
    group.traverse(object => {
      if (object.isInstancedMesh && object.dispose) object.dispose();
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    scene.remove(group);
  }
  function updateThickness() {
    data.edges.forEach(([a, b], i) => {
      start.fromArray(data.points[a]); end.fromArray(data.points[b]);
      delta.subVectors(end, start);
      dummy.position.copy(start).add(end).multiplyScalar(.5);
      dummy.quaternion.setFromUnitVectors(up, delta.clone().normalize());
      dummy.scale.set(.004 * state.thickness, Math.max(delta.length(), .00001), .004 * state.thickness);
      dummy.updateMatrix(); connections.setMatrixAt(i, dummy.matrix);
    });
    connections.instanceMatrix.needsUpdate = true;
  }
  function makeRing(radius, height, tilt, color) {
    const vertices = [];
    for (let i = 0; i < 180; i++) {
      const a = i / 180 * Math.PI * 2;
      vertices.push(Math.cos(a) * radius, height + Math.sin(a) * Math.sin(tilt) * radius, Math.sin(a) * Math.cos(tilt) * radius);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: .26, blending: THREE.AdditiveBlending, depthWrite: false }));
  }
  function rebuild() {
    clearTimeout(rebuildTimer);
    if (sculpture) dispose(sculpture);
    data = Sculpture.generate(state);
    colors = data.palette.map((h, i) => new THREE.Color().setHSL(h, i === 2 ? .48 : .65, i === 1 ? .65 : .55));
    sculpture = new THREE.Group();
    const positions = [], vertexColors = [];
    data.points.forEach((point, i) => { positions.push(...point); const c = colors[data.groups[i]]; vertexColors.push(c.r, c.g, c.b); });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    sculpture.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: .095, map: sprite, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    connections = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .48, metalness: .35, transparent: true, opacity: .52 }), data.edges.length);
    connections.frustumCulled = false;
    data.edges.forEach(([a], i) => connections.setColorAt(i, colors[data.groups[a]]));
    updateThickness(); sculpture.add(connections);
    const baseHeight = ['sun', 'moon', 'star'].includes(state.style) ? -2.50 : -1.65;
    for (let i = 0; i < 5; i++) sculpture.add(makeRing(2.45 + i * .15, baseHeight - i * .035, i * .018, colors[i % colors.length]));
    scene.add(sculpture);
    light.color.copy(colors[0]); rim.color.copy(colors[1]);
    $('palette').replaceChildren(...colors.map(c => { const swatch = document.createElement('i'); swatch.style.background = '#' + c.getHexString(); swatch.title = '#' + c.getHexString(); return swatch; }));
    $('stats').textContent = data.points.length.toLocaleString('pt-BR') + ' PONTOS / ' + data.edges.length.toLocaleString('pt-BR') + ' CONEXÕES';
    $('seed').value = state.seed;
    saveURL();
  }
  function saveURL() {
    const params = new URLSearchParams({ seed: state.seed, style: state.style, count: state.count, thickness: state.thickness });
    // Alguns navegadores bloqueiam history.replaceState em file://. A obra continua funcionando.
    try { history.replaceState(null, '', '#' + params.toString()); } catch (_) { /* semente continua disponível no campo */ }
  }
  function restoreURL() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.get('seed')) state.seed = params.get('seed').slice(0, 64);
    if (Object.prototype.hasOwnProperty.call(descriptions, params.get('style'))) state.style = params.get('style');
    const count = Number(params.get('count')), thickness = Number(params.get('thickness'));
    if (count >= 800 && count <= 3200) state.count = Math.round(count / 100) * 100;
    if (thickness >= .5 && thickness <= 2.5) state.thickness = Math.round(thickness * 10) / 10;
    $('density').value = state.count; $('thickness').value = state.thickness;
    updateOutputs();
  }
  function updateOutputs() {
    $('density-value').textContent = state.count;
    $('speed-value').textContent = state.speed.toFixed(2).replace('.', ',') + ' rad/s';
    $('thickness-value').textContent = state.thickness.toFixed(1).replace('.', ',') + '×';
  }
  const descriptions = {
    lotus: ['Lótus do infinito', 'A GEOMETRIA DE UM FLORESCER.', 'Pétalas paramétricas se abrem em torno de um centro luminoso.'],
    sun: ['Sol radiante', 'A LUZ QUE DÁ FORMA AO UNIVERSO.', 'Um núcleo esférico e uma coroa de raios em tons quentes gerados por semente.'],
    moon: ['Lua crescente', 'O SILÊNCIO TAMBÉM TEM LUZ.', 'Um crescente com volume e pontas delicadas, em uma paleta de cores frias.'],
    star: ['Estrela celeste', 'CINCO PONTAS. INFINITAS POSSIBILIDADES.', 'Uma estrela de cinco pontas com profundidade e proporções que variam a cada semente.'],
    name: ['Lucas Pereira', 'SEU NOME EM TRÊS DIMENSÕES.', 'Letras com profundidade, formadas por pontos conectados. Gire a escultura ou exporte sua imagem.']
  };
  function updateStyle() {
    document.querySelectorAll('.style').forEach(button => {
      const active = button.dataset.style === state.style;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    const d = descriptions[state.style];
    $('style-counter').textContent = String(Object.keys(descriptions).indexOf(state.style) + 1).padStart(2, '0') + ' / ' + String(Object.keys(descriptions).length).padStart(2, '0');
    $('art-title').textContent = d[0]; $('art-subtitle').textContent = d[1]; $('style-description').textContent = d[2];
  }
  function notify(message) {
    clearTimeout(noticeTimer); $('notice').textContent = message; $('notice').classList.add('visible');
    noticeTimer = setTimeout(() => $('notice').classList.remove('visible'), 3200);
  }
  let wasMobile = innerWidth <= 760;
  function resetCamera() { camera.position.set(0, 1.4, innerWidth <= 760 ? 20.8 : 11.7); controls.target.set(0, .12, 0); controls.update(); }
  function resize() {
    const w = innerWidth, h = innerHeight, mobile = w <= 760;
    if (mobile !== wasMobile) { wasMobile = mobile; resetCamera(); }
    renderer.setSize(w, h); camera.aspect = w / h;
    camera.clearViewOffset();
    // Desloca a projeção para reservar espaço aos controles sem reduzir o canvas.
    if (!document.body.classList.contains('focused')) {
      if (mobile) camera.setViewOffset(w, h, 0, h * .18, w, h);
      else camera.setViewOffset(w, h, -Math.min(180, w * .145), 0, w, h);
    }
    camera.updateProjectionMatrix();
  }
  document.querySelectorAll('.style').forEach(button => button.addEventListener('click', () => { state.style = button.dataset.style; updateStyle(); rebuild(); }));
  $('generate').addEventListener('click', () => {
    const values = new Uint32Array(2); crypto.getRandomValues(values);
    state.seed = 'INSPIRATION-' + Array.from(values, n => n.toString(36).toUpperCase()).join('-');
    rebuild(); notify('Uma nova escultura nasceu.');
  });
  $('seed-form').addEventListener('submit', event => {
    event.preventDefault(); const value = $('seed').value.trim();
    if (!value) { notify('Digite uma semente para recriar a escultura.'); return; }
    state.seed = value; rebuild(); notify('Escultura recriada com esta semente.');
  });
  $('density').addEventListener('input', event => {
    state.count = Number(event.target.value); updateOutputs(); clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(rebuild, 100);
  });
  $('speed').addEventListener('input', event => { state.speed = Number(event.target.value); updateOutputs(); });
  $('thickness').addEventListener('input', event => { state.thickness = Number(event.target.value); updateOutputs(); updateThickness(); saveURL(); });
  $('pause').addEventListener('click', () => {
    state.paused = !state.paused; $('pause').textContent = state.paused ? '▷ Retomar' : 'Ⅱ Pausar';
    $('pause').setAttribute('aria-pressed', String(state.paused));
  });
  $('reset').addEventListener('click', () => { resetCamera(); if (sculpture) sculpture.rotation.y = 0; notify('Vista inicial restaurada.'); });
  $('focus').addEventListener('click', () => {
    const focused = document.body.classList.toggle('focused');
    $('focus').setAttribute('aria-pressed', String(focused)); $('focus').setAttribute('aria-label', focused ? 'Mostrar painel' : 'Ocultar painel');
    $('focus').title = focused ? 'Mostrar painel' : 'Ocultar painel'; resize();
  });
  $('export').addEventListener('click', () => {
    const oldAspect = camera.aspect, oldView = camera.view ? { ...camera.view } : null;
    const oldRatio = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2());
    const exportButton = $('export'); exportButton.disabled = true;
    try {
      camera.clearViewOffset(); camera.aspect = 1; camera.updateProjectionMatrix();
      renderer.setPixelRatio(1); renderer.setSize(2048, 2048, false); renderer.render(scene, camera);
      renderer.domElement.toBlob(blob => {
        exportButton.disabled = false;
        if (!blob) { notify('Não foi possível exportar a imagem.'); return; }
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'Inspiration-3D-' + state.style + '-' + state.seed.replace(/[^a-z0-9-]/gi, '_') + '.png';
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000); notify('PNG exportado em 2048 × 2048 pixels.');
      }, 'image/png');
    } catch (error) { exportButton.disabled = false; notify('Não foi possível exportar neste navegador.'); }
    finally {
      renderer.setPixelRatio(oldRatio); renderer.setSize(size.x, size.y, false);
      camera.aspect = oldAspect;
      if (oldView && oldView.enabled) camera.setViewOffset(oldView.fullWidth, oldView.fullHeight, oldView.offsetX, oldView.offsetY, oldView.width, oldView.height);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix(); renderer.render(scene, camera);
    }
  });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail('A conexão com a GPU foi interrompida. Recarregue a página para reconstruir a cena.'); });
  addEventListener('resize', resize);
  const clock = new THREE.Clock();
  let elapsed = 0;
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .05);
    if (!state.paused) {
      elapsed += dt;
      sculpture.rotation.y += state.speed * dt;
      stars.rotation.y += dt * .008;
      light.color.setHSL((data.palette[0] + Math.sin(elapsed * .15) * .04 + 1) % 1, .55, .65);
    }
    controls.update(); renderer.render(scene, camera);
  }
  restoreURL(); updateStyle(); rebuild(); resetCamera(); resize(); animate();
  // Estado de leitura para inspeção e validação no navegador.
  window.inspiration3D = { get state() { return { ...state }; }, get data() { return data; }, get angle() { return sculpture.rotation.y; }, renderer, scene, camera };
})();
