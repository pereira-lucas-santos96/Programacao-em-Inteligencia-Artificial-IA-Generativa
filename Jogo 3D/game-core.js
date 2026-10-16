(function (root) {
  'use strict';

  const ARENA_RADIUS = 17;
  const PLAYER_RADIUS = 0.48;
  const PLAYER_SPEED = 7.3;
  const LEVELS = [
    { element: 'air', icon: 'wind', name: 'Ar', title: 'O Templo do Ar', location: 'TEMPLO DO AR DO SUL', lesson: 'Prepare sua esquiva', message: 'Leve como o vento.', count: 8, obstacles: 12, time: 65, hunters: 0, turrets: 0, hazardCount: 0, hunterSpeed: 0, shotInterval: 0, projectileSpeed: 0, color: '#648478', seed: 1337 },
    { element: 'water', icon: 'water', name: 'Água', title: 'O Santuário da Água', location: 'TRIBO DA ÁGUA DO NORTE', lesson: 'Fuja dos caçadores', message: 'Flua como a água.', count: 10, obstacles: 16, time: 60, hunters: 2, turrets: 1, hazardCount: 0, hunterSpeed: 2.9, shotInterval: 3.5, projectileSpeed: 8, color: '#608eaa', seed: 2674 },
    { element: 'earth', icon: 'earth', name: 'Terra', title: 'O Jardim da Terra', location: 'REINO DA TERRA', lesson: 'Cuidado onde pisa', message: 'Firme como a terra.', count: 12, obstacles: 20, time: 55, hunters: 3, turrets: 2, hazardCount: 1, hunterSpeed: 3.4, shotInterval: 3, projectileSpeed: 9, color: '#a38a63', seed: 4011 },
    { element: 'fire', icon: 'fire', name: 'Fogo', title: 'O Coração do Fogo', location: 'TEMPLO DO SOL', lesson: 'Sobreviva ao cerco', message: 'Vivo como o fogo.', count: 14, obstacles: 24, time: 50, hunters: 4, turrets: 3, hazardCount: 2, hunterSpeed: 3.9, shotInterval: 2.5, projectileSpeed: 10, color: '#bc7258', seed: 5348 },
    { element: 'metal', icon: 'metal', name: 'Metal', title: 'O Caminho do Metal', location: 'CIDADE DE ZAOFU', lesson: 'O desafio do Avatar', message: 'O equilíbrio está em você.', count: 16, obstacles: 28, time: 45, hunters: 5, turrets: 4, hazardCount: 3, hunterSpeed: 4.4, shotInterval: 2, projectileSpeed: 11, color: '#7c8492', seed: 6685 }
  ];

  function createRandom(seed) {
    let state = seed >>> 0;
    return function () {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function distance(first, second) {
    return Math.sqrt((first.x - second.x) ** 2 + (first.z - second.z) ** 2);
  }

  function overlaps(first, second, gap = 0) {
    return distance(first, second) < first.radius + second.radius + gap;
  }

  function randomPoint(random, radius) {
    const angle = random() * Math.PI * 2;
    const length = Math.sqrt(random()) * radius;
    return { x: Math.cos(angle) * length, z: Math.sin(angle) * length };
  }

  function generateLevel(index) {
    const level = LEVELS[index];
    if (!level) throw new RangeError('Fase inválida.');
    const random = createRandom(level.seed);
    const obstacles = [];
    const items = [];
    const spawn = { x: 0, z: 0, radius: 3.1 };
    const elements = ['air', 'water', 'earth', 'fire', 'metal'];

    function place(radius, occupied, gap, minimumDistance = 0) {
      for (let attempt = 0; attempt < 12000; attempt += 1) {
        const candidate = { ...randomPoint(random, ARENA_RADIUS - radius - 0.9), radius };
        if (distance(candidate, spawn) >= minimumDistance && !overlaps(candidate, spawn) && occupied.every(other => !overlaps(candidate, other, gap))) return candidate;
      }
      throw new Error('Não foi possível gerar uma fase acessível.');
    }

    for (let obstacleIndex = 0; obstacleIndex < level.obstacles; obstacleIndex += 1) {
      const radius = 0.7 + random() * 0.28;
      const position = place(radius, obstacles, PLAYER_RADIUS * 2 + 0.65);
      const element = obstacleIndex % 3 === 0 ? level.element : elements[(obstacleIndex + index) % elements.length];
      obstacles.push({ ...position, element, rotation: random() * Math.PI * 2, phase: random() * Math.PI * 2 });
    }
    for (let itemIndex = 0; itemIndex < level.count; itemIndex += 1) {
      const position = place(0.36, [...obstacles, ...items], PLAYER_RADIUS + 0.35);
      items.push({ ...position, phase: random() * Math.PI * 2 });
    }
    const enemies = [];
    for (let enemyIndex = 0; enemyIndex < level.hunters; enemyIndex += 1) {
      enemies.push({ ...place(0.55, [...obstacles, ...items, ...enemies], 0.55, 8), phase: random() * Math.PI * 2 });
    }
    const candidates = obstacles.map((obstacle, index) => ({ index, order: random() }));
    candidates.sort((first, second) => first.order - second.order);
    const turrets = candidates.slice(0, level.turrets).map(candidate => candidate.index);
    return { seed: level.seed, obstacles, items, enemies, turrets };
  }

  function moveCircle(position, direction, delta, obstacles, speed = PLAYER_SPEED, radius = PLAYER_RADIUS) {
    const magnitude = Math.hypot(direction.x, direction.z);
    if (!magnitude) return { x: position.x, z: position.z };
    const movement = Math.min(Math.max(delta, 0), 0.1) * speed;
    const steps = Math.max(1, Math.ceil(movement / (radius * 0.5)));
    const increment = { x: direction.x / magnitude * movement / steps, z: direction.z / magnitude * movement / steps };
    const result = { x: position.x, z: position.z, radius };
    for (let step = 0; step < steps; step += 1) {
      result.x += increment.x;
      result.z += increment.z;
      for (let iteration = 0; iteration < 4; iteration += 1) {
        for (const obstacle of obstacles) {
          const separation = distance(result, obstacle);
          const minimum = radius + obstacle.radius;
          if (separation < minimum) {
            const normalX = separation > 0.00001 ? (result.x - obstacle.x) / separation : 1;
            const normalZ = separation > 0.00001 ? (result.z - obstacle.z) / separation : 0;
            result.x = obstacle.x + normalX * (minimum + 0.001);
            result.z = obstacle.z + normalZ * (minimum + 0.001);
          }
        }
        const edge = Math.hypot(result.x, result.z);
        if (edge > ARENA_RADIUS - radius) {
          result.x *= (ARENA_RADIUS - radius) / edge;
          result.z *= (ARENA_RADIUS - radius) / edge;
        }
      }
    }
    return { x: result.x, z: result.z };
  }

  function movePlayer(position, direction, delta, obstacles) {
    return moveCircle(position, direction, delta, obstacles);
  }

  function segmentImpact(start, end, center, radius) {
    const offsetX = start.x - center.x;
    const offsetZ = start.z - center.z;
    const directionX = end.x - start.x;
    const directionZ = end.z - start.z;
    const constant = offsetX ** 2 + offsetZ ** 2 - radius ** 2;
    if (constant <= 0) return 0;
    const quadratic = directionX ** 2 + directionZ ** 2;
    if (quadratic < 1e-12) return null;
    const linear = 2 * (offsetX * directionX + offsetZ * directionZ);
    const discriminant = linear ** 2 - 4 * quadratic * constant;
    if (discriminant < 0) return null;
    const impact = (-linear - Math.sqrt(discriminant)) / (2 * quadratic);
    return impact >= 0 && impact <= 1 ? impact : null;
  }

  function formatTime(seconds) {
    const whole = Math.max(0, Math.ceil(seconds));
    return String(Math.floor(whole / 60)).padStart(2, '0') + ':' + String(whole % 60).padStart(2, '0');
  }

  root.AvatarCore = Object.freeze({ ARENA_RADIUS, PLAYER_RADIUS, PLAYER_SPEED, LEVELS, createRandom, distance, overlaps, randomPoint, generateLevel, movePlayer, moveCircle, segmentImpact, formatTime });
})(globalThis);
