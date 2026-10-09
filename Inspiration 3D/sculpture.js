/* Geometria independente do renderer. Cada posição é calculada por fórmulas.
   A semente determina todos os valores aleatórios da escultura. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  function randomFromSeed(seed) {
    let state = 2166136261;
    for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
    return function () {
      state += 0x6D2B79F5;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function generate(options) {
    const style = ['lotus', 'sun', 'moon', 'star', 'name'].includes(options.style) ? options.style : 'lotus';
    const rng = randomFromSeed(String(options.seed));
    const count = Math.max(800, Math.min(3200, Math.round(Number(options.count) || 1800)));
    const points = [], edges = [], groups = [], patches = [];
    const hue = rng();
    const palette = [hue, (hue + .39 + rng() * .12) % 1, (hue + .10) % 1, (hue + .55) % 1];
    function patch(weight, group, fn, wrap = true, columnsRatio = null) { patches.push({ weight, group, fn, wrap, columnsRatio }); }
    function ellipsoid(center, scale, group, weight = 1, angle = 0) {
      patch(weight, group, (u, v) => {
        const phi = .05 + v * (Math.PI - .1), theta = u * TAU;
        const x = Math.sin(phi) * Math.cos(theta) * scale[0];
        const y = Math.cos(phi) * scale[1];
        const z = Math.sin(phi) * Math.sin(theta) * scale[2];
        return [center[0] + x * Math.cos(angle) - y * Math.sin(angle), center[1] + x * Math.sin(angle) + y * Math.cos(angle), center[2] + z];
      });
    }
    if (style === 'name') {
      if (!root.NameSculpture) throw new Error('Contornos de Lucas Pereira não carregados.');
      const depth = .28 + rng() * .16, size = .94 + rng() * .08;
      // Distribui pontos por comprimento, interpolando os contornos das letras.
      // Os anéis em diferentes profundidades são conectados em uma superfície 3D.
      root.NameSculpture.contours.forEach((contour, index) => {
        const lengths = [0];
        for (let i = 0; i < contour.length; i++) {
          const a = contour[i], b = contour[(i + 1) % contour.length];
          lengths.push(lengths[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
        }
        const perimeter = lengths[lengths.length - 1];
        patch(perimeter, index % 2, (u, v) => {
          const distance = u * perimeter;
          let segment = 0;
          while (segment < contour.length - 1 && lengths[segment + 1] < distance) segment++;
          const a = contour[segment], b = contour[(segment + 1) % contour.length];
          const t = (distance - lengths[segment]) / Math.max(lengths[segment + 1] - lengths[segment], .000001);
          return [(a[0] + (b[0] - a[0]) * t) * size, (a[1] + (b[1] - a[1]) * t) * size, (v - .5) * depth];
        }, true, .25);
      });
    } else if (style === 'lotus') {
      const petals = 7 + Math.floor(rng() * 4), twist = rng() * TAU;
      for (let k = 0; k < petals; k++) {
        const a = k / petals * TAU + twist;
        patch(1, k % 2, (u, v) => {
          const reach = Math.sin(v * Math.PI * .82) * 2.9;
          const across = Math.sin(u * TAU) * Math.sin(v * Math.PI) * .70;
          return [Math.cos(a) * reach - Math.sin(a) * across, -1.2 + v * 3.6 + Math.cos(u * TAU) * Math.sin(v * Math.PI) * .22, Math.sin(a) * reach + Math.cos(a) * across];
        });
      }
      ellipsoid([0, -.15, 0], [.52, 1.05, .52], 2, 2);
    } else if (style === 'sun') {
      const warmth = .035 + rng() * .065;
      palette.splice(0, 4, warmth, (warmth + .035) % 1, (warmth + .075) % 1, warmth * .45);
      const radius = 1.20 + rng() * .14;
      ellipsoid([0, .1, 0], [radius, radius, radius], 0, 7);
      const rays = 12 + Math.floor(rng() * 5), phase = rng() * TAU;
      // Cada raio é uma superfície cônica com volume, amostrada ao redor do eixo radial.
      for (let k = 0; k < rays; k++) {
        const angle = k / rays * TAU + phase;
        const length = .75 + rng() * .5, width = .12 + rng() * .07;
        patch(.5, 1 + k % 3, (u, v) => {
          const distance = radius * .92 + v * length;
          const tube = width * (1 - v) + .006;
          const side = Math.cos(u * TAU) * tube;
          return [Math.cos(angle) * distance - Math.sin(angle) * side, .1 + Math.sin(angle) * distance + Math.cos(angle) * side, Math.sin(u * TAU) * tube];
        });
      }
    } else if (style === 'moon') {
      const cool = .53 + rng() * .13;
      palette.splice(0, 4, cool, (cool + .09) % 1, (cool + .18) % 1, (cool + .04) % 1);
      const radius = 2.05 + rng() * .14, fullness = .32 + rng() * .10;
      const depth = .36 + rng() * .17;
      // Seções elípticas afuniladas unem as pontas do crescente; há frente, verso e bordas.
      patch(1, 0, (u, v) => {
        const angle = .008 + v * (Math.PI - .016), arc = Math.sin(angle);
        return [.65 - radius * (1 - fullness) * arc + radius * fullness * arc * Math.cos(u * TAU), .1 + radius * Math.cos(angle), depth * arc * Math.sin(u * TAU)];
      });
    } else if (style === 'star') {
      const outer = 2.30 + rng() * .25, inner = .92 + rng() * .22;
      const depth = .50 + rng() * .24;
      // Contorno de dez vértices alternados, calculados por índice, forma cinco pontas.
      patch(1, 0, (u, v) => {
        const sector = u * 10, k = Math.floor(sector), fraction = sector - k;
        const a = Math.PI / 2 + k * TAU / 10, b = a + TAU / 10;
        const rA = k % 2 === 0 ? outer : inner, rB = k % 2 === 0 ? inner : outer;
        const phi = .015 + v * (Math.PI - .03), scale = Math.sin(phi);
        return [(Math.cos(a) * rA * (1 - fraction) + Math.cos(b) * rB * fraction) * scale, .1 + (Math.sin(a) * rA * (1 - fraction) + Math.sin(b) * rB * fraction) * scale, depth * Math.cos(phi)];
      });
    }
    const weight = patches.reduce((sum, p) => sum + p.weight, 0);
    patches.forEach((p, part) => {
      const n = part === patches.length - 1 ? count - points.length : Math.floor(count * p.weight / weight);
      const columns = Math.max(3, Math.round(p.columnsRatio ? n * p.columnsRatio : Math.sqrt(n * 1.65)));
      const rows = Math.ceil(n / columns), start = points.length;
      for (let i = 0; i < n; i++) {
        const col = i % columns, row = Math.floor(i / columns);
        const point = p.fn(col / columns, rows <= 1 ? .5 : row / (rows - 1));
        // Ruído pequeno preserva a silhueta, mas torna cada rede única.
        const jitter = style === 'name' ? .006 : .019;
        points.push(point.map(x => x + (rng() - .5) * jitter));
        groups.push(p.group);
        if (col > 0) edges.push([start + i - 1, start + i]);
        if (col === columns - 1 && p.wrap) edges.push([start + i, start + i - col]);
        if (row > 0) edges.push([start + i - columns, start + i]);
        if (row > 0 && col > 0 && rng() > .53) edges.push([start + i - columns - 1, start + i]);
      }
    });
    return { points, edges, groups, palette, seed: String(options.seed) };
  }
  root.Sculpture = { generate, randomFromSeed };
})(typeof window !== 'undefined' ? window : globalThis);
