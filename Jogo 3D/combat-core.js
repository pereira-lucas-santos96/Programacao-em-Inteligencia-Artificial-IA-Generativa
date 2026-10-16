(function (root) {
  'use strict';

  const core = root.AvatarCore;
  const MAX_HEALTH = 3;
  const DASH_DURATION = 0.22;
  const DASH_COOLDOWN = 2.6;

  function normalized(direction) {
    const length = Math.hypot(direction.x, direction.z);
    return length ? { x: direction.x / length, z: direction.z / length } : { x: 0, z: 1 };
  }

  class CombatSimulation {
    constructor(index, layout) {
      this.level = core.LEVELS[index];
      this.index = index;
      this.layout = layout;
      this.random = core.createRandom(layout.seed + 9743);
      this.health = MAX_HEALTH;
      this.invulnerable = index > 0 ? 2.5 : 0;
      this.time = 0;
      this.dashRemaining = 0;
      this.dashCooldown = 0;
      this.facing = { x: 0.6, z: 0.8 };
      this.dashDirection = this.facing;
      this.enemies = layout.enemies.map((enemy, id) => ({ ...enemy, id }));
      this.turrets = layout.turrets.map((obstacleIndex, id) => ({ obstacleIndex, id, cooldown: 3 + id * 0.65, warning: 0, target: null }));
      this.projectiles = [];
      this.zones = [];
      this.nextHazard = 5;
      this.sequence = 0;
      this.events = [];
      this.path = [];
    }

    requestDash(direction) {
      if (this.health <= 0 || this.dashCooldown > 0) return false;
      this.dashDirection = normalized(Math.hypot(direction.x, direction.z) ? direction : this.facing);
      this.dashRemaining = DASH_DURATION;
      this.dashCooldown = DASH_COOLDOWN;
      return true;
    }

    damage(source) {
      if (this.health <= 0 || this.invulnerable > 0 || this.dashRemaining > 0) return false;
      this.health -= 1;
      this.invulnerable = 1.35;
      this.events.push({ type: 'damage', source, health: this.health });
      return true;
    }

    update(seconds, position, direction) {
      this.events = [];
      this.path = [{ x: position.x, z: position.z }];
      let remaining = Math.min(Math.max(seconds, 0), 0.25);
      let current = { x: position.x, z: position.z };
      while (remaining > 1e-8 && this.health > 0) {
        const delta = Math.min(remaining, 1 / 60);
        this.time += delta;
        this.invulnerable = Math.max(0, this.invulnerable - delta);
        this.dashCooldown = Math.max(0, this.dashCooldown - delta);
        const previous = current;
        if (Math.hypot(direction.x, direction.z)) this.facing = normalized(direction);
        current = core.moveCircle(current, this.dashRemaining > 0 ? this.dashDirection : direction, delta, this.layout.obstacles, core.PLAYER_SPEED * (this.dashRemaining > 0 ? 2.8 : 1));
        this.path.push(current);
        if (this.time > 2.5) {
          this.updateEnemies(delta, previous, current);
          this.updateTurrets(delta, current);
          this.updateProjectiles(delta, previous, current);
          this.updateZones(delta, current);
        }
        this.dashRemaining = Math.max(0, this.dashRemaining - delta);
        remaining -= delta;
      }
      return current;
    }

    updateEnemies(delta, previous, current) {
      for (const enemy of this.enemies) {
        const towards = normalized({ x: current.x - enemy.x, z: current.z - enemy.z });
        const steering = { ...towards };
        for (const obstacle of this.layout.obstacles) {
          const ahead = { x: enemy.x + towards.x * 1.3, z: enemy.z + towards.z * 1.3, radius: enemy.radius + 0.2 };
          if (core.overlaps(ahead, obstacle)) {
            const away = normalized({ x: enemy.x - obstacle.x, z: enemy.z - obstacle.z });
            const side = towards.x * away.z - towards.z * away.x >= 0 ? 1 : -1;
            steering.x += away.x * 1.7 - towards.z * side;
            steering.z += away.z * 1.7 + towards.x * side;
          }
        }
        for (const other of this.enemies) {
          if (enemy === other) continue;
          const gap = core.distance(enemy, other);
          if (gap > 0 && gap < 1.5) {
            steering.x += (enemy.x - other.x) / gap * 0.7;
            steering.z += (enemy.z - other.z) / gap * 0.7;
          }
        }
        const next = core.moveCircle(enemy, steering, delta, this.layout.obstacles, this.level.hunterSpeed, enemy.radius);
        const relativeStart = { x: enemy.x - previous.x, z: enemy.z - previous.z };
        const relativeEnd = { x: next.x - current.x, z: next.z - current.z };
        if (core.segmentImpact(relativeStart, relativeEnd, { x: 0, z: 0 }, enemy.radius + core.PLAYER_RADIUS) !== null) this.damage('caçador elemental');
        enemy.x = next.x;
        enemy.z = next.z;
      }
    }

    updateTurrets(delta, current) {
      for (const turret of this.turrets) {
        if (turret.warning > 0) {
          turret.warning -= delta;
          if (turret.warning <= 0) {
            const obstacle = this.layout.obstacles[turret.obstacleIndex];
            const direction = normalized({ x: turret.target.x - obstacle.x, z: turret.target.z - obstacle.z });
            this.projectiles.push({ id: this.sequence++, x: obstacle.x + direction.x * (obstacle.radius + 0.3), z: obstacle.z + direction.z * (obstacle.radius + 0.3), direction, radius: 0.22, life: 4.2, owner: turret.obstacleIndex });
            turret.cooldown = this.level.shotInterval;
            turret.target = null;
          }
        } else {
          turret.cooldown -= delta;
          if (turret.cooldown <= 0) {
            turret.warning = 0.85;
            turret.target = { x: current.x, z: current.z };
          }
        }
      }
    }

    updateProjectiles(delta, previous, current) {
      this.projectiles = this.projectiles.filter(projectile => {
        const next = { x: projectile.x + projectile.direction.x * this.level.projectileSpeed * delta, z: projectile.z + projectile.direction.z * this.level.projectileSpeed * delta };
        let blockedAt = Infinity;
        this.layout.obstacles.forEach((obstacle, index) => {
          if (index === projectile.owner) return;
          const impact = core.segmentImpact(projectile, next, obstacle, obstacle.radius + projectile.radius);
          if (impact !== null) blockedAt = Math.min(blockedAt, impact);
        });
        const hit = core.segmentImpact({ x: projectile.x - previous.x, z: projectile.z - previous.z }, { x: next.x - current.x, z: next.z - current.z }, { x: 0, z: 0 }, projectile.radius + core.PLAYER_RADIUS);
        if (hit !== null && hit <= blockedAt) {
          if (this.dashRemaining > 0) this.events.push({ type: 'deflect', x: current.x, z: current.z });
          else this.damage('projétil elemental');
          return false;
        }
        if (blockedAt !== Infinity) return false;
        projectile.x = next.x;
        projectile.z = next.z;
        projectile.life -= delta;
        return projectile.life > 0 && Math.hypot(next.x, next.z) < core.ARENA_RADIUS + 1;
      });
    }

    updateZones(delta, current) {
      if (!this.level.hazardCount) return;
      this.nextHazard -= delta;
      if (this.nextHazard <= 0) {
        for (let zoneIndex = 0; zoneIndex < this.level.hazardCount; zoneIndex += 1) {
          const offset = zoneIndex === 0 ? { x: 0, z: 0 } : core.randomPoint(this.random, 4.8);
          const target = { x: current.x + offset.x, z: current.z + offset.z };
          const radius = 1.55 + this.index * 0.15;
          const distance = Math.hypot(target.x, target.z);
          if (distance > core.ARENA_RADIUS - radius) {
            target.x *= (core.ARENA_RADIUS - radius) / distance;
            target.z *= (core.ARENA_RADIUS - radius) / distance;
          }
          this.zones.push({ ...target, id: this.sequence++, radius, warning: 1.25, active: 0.5 });
        }
        this.nextHazard = 8 - this.index;
        this.events.push({ type: 'warning' });
      }
      this.zones = this.zones.filter(zone => {
        if (zone.warning > 0) zone.warning = Math.max(0, zone.warning - delta);
        else {
          zone.active -= delta;
          if (core.distance(zone, current) < zone.radius + core.PLAYER_RADIUS) this.damage('erupção elemental');
        }
        return zone.active > 0;
      });
    }
  }

  root.AvatarCombat = Object.freeze({ CombatSimulation, MAX_HEALTH, DASH_DURATION, DASH_COOLDOWN });
})(globalThis);
