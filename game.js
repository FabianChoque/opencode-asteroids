'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Skins ────────────────────────────────────────────────────────────────────
const SKINS = [
  {
    name: 'Clásica',
    verts: [[20,0], [-12,-9], [-7,0], [-12,9]],
    stroke: '#ffffff',
    thrust: 'rgba(255, 130, 0, 0.85)',
    lineWidth: 1.5,
  },
  {
    name: 'Flecha',
    verts: [[22,0], [4,-12], [-8,-8], [-5,0], [-8,8], [4,12]],
    stroke: '#00ccff',
    thrust: 'rgba(0, 180, 255, 0.85)',
    lineWidth: 1.5,
  },
  {
    name: 'Rombo',
    verts: [[20,0], [0,-11], [-14,0], [0,11]],
    stroke: '#00ff88',
    thrust: 'rgba(0, 255, 136, 0.85)',
    lineWidth: 1.8,
  },
  {
    name: 'Estrella',
    verts: [[22,0], [6,-6], [10,-10], [2,-4], [-4,-10], [-6,-2], [-14,0], [-6,2], [-4,10], [2,4], [10,10], [6,6]],
    stroke: '#ff44cc',
    thrust: 'rgba(255, 68, 204, 0.85)',
    lineWidth: 1.5,
  },
  {
    name: 'Crucero',
    verts: [[20,0], [14,-5], [2,-9], [-10,-7], [-14,0], [-10,7], [2,9], [14,5]],
    stroke: '#ffaa00',
    thrust: 'rgba(255, 170, 0, 0.85)',
    lineWidth: 1.5,
  },
];

let skinIndex = parseInt(localStorage.getItem('skinIndex') || '0');
if (skinIndex < 0 || skinIndex >= SKINS.length) skinIndex = 0;
let skinNotification = 0;

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella Fugaz ──────────────────────────────────────────────────────────
class ShootingStar {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.radius = rand(8, 14);
    this.dead = false;
    this.ttl = 3;

    const SPEED = 220;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.rotSpeed = rand(-2, 2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(6, 10);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    // Trail de cola
    this.trail = [];
  }

  update(dt) {
    // Guardar posición anterior para la cola
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 0.8);

    // Cola
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * alpha * 0.5;
      ctx.strokeStyle = `rgba(255,215,0,${a.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.3 * (i / this.trail.length), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cuerpo
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Brillo interior
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    ctx.fill();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting       = false;
    this.invincible      = 3;
    this.shootCooldown   = 0;
    this.dead            = false;
    this.speedMultiplier = 1;
    this.speedTimer      = 0;
    this.shieldTimer     = 0;
    this.tripleTimer     = 0;
  }

  applySpeed(duration) {
    this.speedMultiplier = 2;
    this.speedTimer = duration;
  }

  applyShield(duration) {
    this.shieldTimer = duration;
  }

  applyTriple(duration) {
    this.tripleTimer = duration;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) {
      this.speedTimer -= dt;
      if (this.speedTimer <= 0) this.speedMultiplier = 1;
    }
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) {
      this.tripleTimer -= dt;
      if (this.tripleTimer <= 0) this.tripleTimer = 0;
    }

    const ROT    = 3.5;   // rad/s
    const THRUST = 260 * this.speedMultiplier;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      return [
        new Bullet(ox, oy, this.angle - 0.15),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + 0.15),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];
    const v = skin.verts;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Aura del escudo (se dibuja antes de rotar para que sea siempre circular)
    if (this.shieldTimer > 0) {
      const pulse = 0.3 + Math.sin(Date.now() * 0.01) * 0.15;
      ctx.strokeStyle = `rgba(0, 191, 255, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(this.angle);

    // Brillo dorado cuando speed está activo
    if (this.speedTimer > 0) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath();
      ctx.stroke();
    }

    // Brillo cyan cuando triple shot está activo
    if (this.tripleTimer > 0) {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(v[0][0], v[0][1]);
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1]);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = skin.lineWidth;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.moveTo(v[0][0], v[0][1]);
    for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.thrust;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.type = ['speed', 'shield', 'triple'][Math.floor(Math.random() * 3)];
    this.ttl = 8;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.lineWidth = 2;

    if (this.type === 'speed') {
      // Rayo: polígono tipo relámpago
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(-3, -10);
      ctx.lineTo(2, -10);
      ctx.lineTo(-1, -2);
      ctx.lineTo(4, -2);
      ctx.lineTo(-3, 10);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'shield') {
      // Escudo: hexágono cian
      ctx.fillStyle = '#00BFFF';
      ctx.strokeStyle = '#0099CC';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const method = i === 0 ? 'moveTo' : 'lineTo';
        ctx[method](Math.cos(a) * 10, Math.sin(a) * 10);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Triple shot: 3 puntos en abanico
      ctx.fillStyle = '#00FFFF';
      ctx.strokeStyle = '#00CED1';
      ctx.lineWidth = 2;
      const r = 3;
      // Centro
      ctx.beginPath();
      ctx.arc(0, -7, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Izquierda
      ctx.beginPath();
      ctx.arc(-5, 3, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Derecha
      ctx.beginPath();
      ctx.arc(5, 3, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  shootingStarTimer = rand(5, 12);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  ship.reset();
  shootingStarTimer = rand(5, 12);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

function maybeSpawnShootingStar(dt) {
  if (asteroids.length === 0) return;
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    // Elegir borde aleatorio: 0=arriba, 1=derecha, 2=abajo, 3=izquierda
    const side = randInt(0, 3);
    let x, y, angle;
    switch (side) {
      case 0: x = rand(0, W); y = -10; angle = Math.PI / 2 + rand(-0.4, 0.4); break;
      case 1: x = W + 10; y = rand(0, H); angle = Math.PI + rand(-0.4, 0.4); break;
      case 2: x = rand(0, W); y = H + 10; angle = -Math.PI / 2 + rand(-0.4, 0.4); break;
      case 3: x = -10; y = rand(0, H); angle = rand(-0.4, 0.4); break;
    }
    shootingStars.push(new ShootingStar(x, y, angle));
    shootingStarTimer = rand(5, 12);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Ciclar skins con Tab
  if (pressed('Tab')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    localStorage.setItem('skinIndex', skinIndex);
    skinNotification = 1.5;
  }
  if (skinNotification > 0) skinNotification -= dt;

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));
  maybeSpawnShootingStar(dt);

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // 15% de probabilidad de soltar power-up de velocidad
        if (Math.random() < 0.15) {
          powerUps.push(new PowerUp(a.x, a.y));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + 12) {
      p.dead = true;
      if (p.type === 'speed') {
        ship.applySpeed(5);
      } else if (p.type === 'shield') {
        ship.applyShield(4);
      } else if (p.type === 'triple') {
        ship.applyTriple(5);
      }
    }
  }

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += 300;
        explode(s.x, s.y, 10);
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets = bullets.filter(b => !b.dead);

  // Nave vs estrella fugaz
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const s of shootingStars) {
      if (dist(ship, s) < ship.radius + s.radius) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  const v = skin.verts;
  const scale = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(v[0][0] * scale, v[0][1] * scale);
  for (let i = 1; i < v.length; i++)
    ctx.lineTo(v[i][0] * scale, v[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador de triple shot activo
  if (ship && ship.tripleTimer > 0) {
    ctx.fillStyle = '#00FFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TRIPLE SHOT ${ship.tripleTimer.toFixed(1)}s`, 14, H - 30);
  }

  // Indicador de velocidad activa
  if (ship && ship.speedTimer > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, H - 14);
  }

  // Indicador de escudo activo
  if (ship && ship.shieldTimer > 0) {
    ctx.fillStyle = '#00BFFF';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ESCUDO ${ship.shieldTimer.toFixed(1)}s`, 14, H - 28);
  }

  // Notificación de skin
  if (skinNotification > 0) {
    const alpha = Math.min(1, skinNotification / 0.3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = SKINS[skinIndex].stroke;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, W / 2, H - 40);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
