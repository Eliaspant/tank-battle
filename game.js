const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  lives: document.getElementById("lives"),
  score: document.getElementById("score"),
  enemies: document.getElementById("enemies"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayText: document.getElementById("overlay-text"),
  restart: document.getElementById("restart"),
};

const TILE = 32;
const GRID = 26;
const PLAYER_SPEED = 2.2;
const ENEMY_SPEED = 1.35;
const BULLET_SPEED = 6;
const FIRE_COOLDOWN = 320;
const ENEMY_FIRE_COOLDOWN = 1100;
const MAX_ENEMIES = 8;

const DIRS = {
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI / 2 },
  left: { x: -1, y: 0, angle: Math.PI },
  right: { x: 1, y: 0, angle: 0 },
};

const mapTemplate = [
  "##########################",
  "#..............B.........#",
  "#..####..#####...#####...#",
  "#..#.................#...#",
  "#..#..######..####...#...#",
  "#.....#............###...#",
  "#.###.#.###..###.........#",
  "#.....#...#......####....#",
  "#.###.###.#..##..........#",
  "#...#.....#......#####...#",
  "#...#####.#..##..........#",
  "#.........#..............#",
  "#..###.####..#####..###..#",
  "#..............#.........#",
  "#..######..###.#.######..#",
  "#..............#.........#",
  "#.######..###..#####..#..#",
  "#.....#..................#",
  "#.###.#..######..######..#",
  "#...#....#............#..#",
  "#...####.#..########..#..#",
  "#........#............#..#",
  "#..######.######..#####..#",
  "#...........P............#",
  "#...........H............#",
  "##########################",
];

const state = {
  keys: new Set(),
  map: [],
  player: null,
  enemies: [],
  bullets: [],
  particles: [],
  score: 0,
  lives: 3,
  enemyPool: 18,
  lastTime: 0,
  runId: 0,
  running: false,
  gameOver: false,
  victory: false,
};

function cloneMap() {
  return mapTemplate.map((row) => row.split(""));
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function worldRect(entity, dx = 0, dy = 0) {
  return {
    x: entity.x + dx,
    y: entity.y + dy,
    size: entity.size,
  };
}

function tileAt(x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (row < 0 || row >= GRID || col < 0 || col >= GRID) {
    return "#";
  }
  return state.map[row][col];
}

function isWall(tile) {
  return tile === "#" || tile === "B";
}

function checkWallCollision(rect) {
  const corners = [
    [rect.x, rect.y],
    [rect.x + rect.size - 1, rect.y],
    [rect.x, rect.y + rect.size - 1],
    [rect.x + rect.size - 1, rect.y + rect.size - 1],
  ];

  return corners.some(([x, y]) => isWall(tileAt(x, y)));
}

function createTank(x, y, type) {
  return {
    x,
    y,
    size: TILE - 4,
    dir: "up",
    moveX: 0,
    moveY: 0,
    type,
    speed: type === "player" ? PLAYER_SPEED : ENEMY_SPEED,
    cooldown: 0,
    brainTimer: 0,
  };
}

function findTile(symbol) {
  for (let row = 0; row < state.map.length; row += 1) {
    const col = state.map[row].indexOf(symbol);
    if (col !== -1) {
      return { row, col };
    }
  }
  return null;
}

function resetGame() {
  state.map = cloneMap();
  state.enemies = [];
  state.bullets = [];
  state.particles = [];
  state.score = 0;
  state.lives = 3;
  state.enemyPool = 18;
  state.lastTime = 0;
  state.runId += 1;
  state.running = true;
  state.gameOver = false;
  state.victory = false;

  const playerTile = findTile("P");
  state.player = createTank(playerTile.col * TILE + 2, playerTile.row * TILE + 2, "player");
  state.map[playerTile.row][playerTile.col] = ".";

  spawnEnemies(true);
  hideOverlay();
  syncHud();
  const currentRun = state.runId;
  requestAnimationFrame((timestamp) => loop(timestamp, currentRun));
}

function spawnEnemies(force = false) {
  const spawnTiles = [
    { row: 1, col: 1 },
    { row: 1, col: 12 },
    { row: 1, col: 23 },
  ];

  while (
    state.enemyPool > 0 &&
    state.enemies.length < MAX_ENEMIES &&
    (force || Math.random() > 0.6)
  ) {
    const slot = spawnTiles[Math.floor(Math.random() * spawnTiles.length)];
    const enemy = createTank(slot.col * TILE + 2, slot.row * TILE + 2, "enemy");
    enemy.dir = ["down", "left", "right"][Math.floor(Math.random() * 3)];
    enemy.cooldown = 600;

    const blocked = [state.player, ...state.enemies].some((tank) =>
      rectsOverlap(worldRect(enemy), worldRect(tank))
    );

    if (!blocked) {
      state.enemies.push(enemy);
      state.enemyPool -= 1;
    } else {
      break;
    }

    if (!force) {
      break;
    }
  }
}

function syncHud() {
  ui.lives.textContent = state.lives;
  ui.score.textContent = state.score;
  ui.enemies.textContent = state.enemies.length + state.enemyPool;
}

function showOverlay(title, text) {
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.overlay.classList.remove("hidden");
}

function hideOverlay() {
  ui.overlay.classList.add("hidden");
}

function tryMove(tank, dx, dy) {
  if (dx === 0 && dy === 0) {
    return;
  }

  const next = worldRect(tank, dx, dy);
  if (checkWallCollision(next)) {
    return;
  }

  const others = tank.type === "player" ? state.enemies : [state.player, ...state.enemies.filter((enemy) => enemy !== tank)];
  if (others.some((other) => rectsOverlap(next, worldRect(other)))) {
    return;
  }

  tank.x += dx;
  tank.y += dy;
}

function fireBullet(tank) {
  if (!tank) {
    return;
  }

  if (tank.cooldown > 0) {
    return;
  }

  const dir = DIRS[tank.dir];
  const originX = tank.x + tank.size / 2 - 4 + dir.x * (tank.size / 2 - 4);
  const originY = tank.y + tank.size / 2 - 4 + dir.y * (tank.size / 2 - 4);

  state.bullets.push({
    x: originX,
    y: originY,
    size: 8,
    vx: dir.x * BULLET_SPEED,
    vy: dir.y * BULLET_SPEED,
    owner: tank.type,
  });

  tank.cooldown = tank.type === "player" ? FIRE_COOLDOWN : ENEMY_FIRE_COOLDOWN;
}

function updatePlayer(delta) {
  const player = state.player;
  if (!player) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (state.keys.has("ArrowUp")) {
    dy = -player.speed * delta;
    player.dir = "up";
  } else if (state.keys.has("ArrowDown")) {
    dy = player.speed * delta;
    player.dir = "down";
  }

  if (state.keys.has("ArrowLeft")) {
    dx = -player.speed * delta;
    player.dir = "left";
  } else if (state.keys.has("ArrowRight")) {
    dx = player.speed * delta;
    player.dir = "right";
  }

  tryMove(player, dx, 0);
  tryMove(player, 0, dy);
  player.cooldown = Math.max(0, player.cooldown - delta * 16.67);
}

function pickEnemyDirection(enemy) {
  const options = ["up", "down", "left", "right"].filter((dir) => dir !== enemy.dir);
  if (Math.random() > 0.5) {
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    enemy.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  } else {
    enemy.dir = options[Math.floor(Math.random() * options.length)];
  }
}

function updateEnemies(delta) {
  for (const enemy of state.enemies) {
    enemy.cooldown = Math.max(0, enemy.cooldown - delta * 16.67);
    enemy.brainTimer -= delta * 16.67;

    if (enemy.brainTimer <= 0) {
      enemy.brainTimer = 300 + Math.random() * 700;
      pickEnemyDirection(enemy);
    }

    const dir = DIRS[enemy.dir];
    const dx = dir.x * enemy.speed * delta;
    const dy = dir.y * enemy.speed * delta;
    const beforeX = enemy.x;
    const beforeY = enemy.y;
    tryMove(enemy, dx, 0);
    tryMove(enemy, 0, dy);

    if (beforeX === enemy.x && beforeY === enemy.y) {
      enemy.brainTimer = 0;
    }

    const alignedX = Math.abs(enemy.x - state.player.x) < 20;
    const alignedY = Math.abs(enemy.y - state.player.y) < 20;
    const wantsShot = (alignedX || alignedY) && Math.random() > 0.965;
    if (wantsShot || Math.random() > 0.992) {
      fireBullet(enemy);
    }
  }
}

function destroyTileAt(x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const tile = state.map[row]?.[col];
  if (tile === "B") {
    state.map[row][col] = ".";
    loseGame();
  }
}

function addExplosion(x, y, color) {
  for (let i = 0; i < 10; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 25 + Math.random() * 20,
      color,
    });
  }
}

function hitTank(target, bullet) {
  addExplosion(target.x + target.size / 2, target.y + target.size / 2, bullet.owner === "player" ? "#c3ff8f" : "#ff7a59");

  if (target.type === "player") {
    state.lives -= 1;
    if (state.lives <= 0) {
      loseGame();
    } else {
      const spawn = findTile("H");
      state.player.x = spawn.col * TILE + 2;
      state.player.y = (spawn.row - 1) * TILE + 2;
      state.player.dir = "up";
    }
  } else {
    state.score += 100;
    state.enemies = state.enemies.filter((enemy) => enemy !== target);
    if (state.enemies.length === 0 && state.enemyPool === 0) {
      winGame();
    }
  }

  syncHud();
}

function updateBullets() {
  state.bullets = state.bullets.filter((bullet) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    if (
      bullet.x < 0 ||
      bullet.y < 0 ||
      bullet.x > canvas.width ||
      bullet.y > canvas.height
    ) {
      return false;
    }

    const tile = tileAt(bullet.x, bullet.y);
    if (tile === "#") {
      addExplosion(bullet.x, bullet.y, "#ffd166");
      return false;
    }

    if (tile === "B") {
      destroyTileAt(bullet.x, bullet.y);
      addExplosion(bullet.x, bullet.y, "#ff7a59");
      return false;
    }

    const targets = bullet.owner === "player" ? state.enemies : [state.player];
    const victim = targets.find((tank) =>
      rectsOverlap({ x: bullet.x, y: bullet.y, size: bullet.size }, worldRect(tank))
    );

    if (victim) {
      hitTank(victim, bullet);
      return false;
    }

    return true;
  });
}

function updateParticles() {
  state.particles = state.particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    return particle.life > 0;
  });
}

function loseGame() {
  state.running = false;
  state.gameOver = true;
  showOverlay("基地失守", "敌军突破防线。按 R 或按钮重新开始。");
}

function winGame() {
  state.running = false;
  state.victory = true;
  showOverlay("胜利", "所有敌军已清除。按 R 或按钮再来一局。");
}

function update(delta) {
  updatePlayer(delta);
  updateEnemies(delta);
  updateBullets();
  updateParticles();
  spawnEnemies();
  syncHud();
}

function drawMap() {
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const x = col * TILE;
      const y = row * TILE;

      ctx.fillStyle = (row + col) % 2 === 0 ? "#22301f" : "#263822";
      ctx.fillRect(x, y, TILE, TILE);

      const tile = state.map[row][col];
      if (tile === "#") {
        ctx.fillStyle = "#587246";
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = "#324429";
        ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
      } else if (tile === "B") {
        ctx.fillStyle = "#ff7a59";
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(x + 10, y + 10, TILE - 20, TILE - 20);
      } else if (tile === "H") {
        ctx.fillStyle = "#92af7c";
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
      }
    }
  }
}

function drawTank(tank) {
  if (!tank) {
    return;
  }

  ctx.save();
  ctx.translate(tank.x + tank.size / 2, tank.y + tank.size / 2);
  ctx.rotate(DIRS[tank.dir].angle);

  ctx.fillStyle = tank.type === "player" ? "#c3ff8f" : "#ff946b";
  ctx.fillRect(-tank.size / 2 + 6, -tank.size / 2, tank.size - 12, tank.size);
  ctx.fillRect(-tank.size / 2, -tank.size / 2 + 5, 8, tank.size - 10);
  ctx.fillRect(tank.size / 2 - 8, -tank.size / 2 + 5, 8, tank.size - 10);

  ctx.fillStyle = tank.type === "player" ? "#1c2818" : "#472015";
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillRect(0, -3, tank.size / 2 + 4, 6);
  ctx.restore();
}

function drawBullets() {
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.owner === "player" ? "#f7ffe8" : "#ffd9cc";
    ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 45);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, 4, 4);
  }
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawTank(state.player);
  state.enemies.forEach(drawTank);
  drawBullets();
  drawParticles();
}

function loop(timestamp, runId) {
  if (runId !== state.runId) {
    return;
  }

  if (!state.running) {
    draw();
    return;
  }

  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const delta = Math.min((timestamp - state.lastTime) / 16.67, 1.8);
  state.lastTime = timestamp;

  update(delta);
  draw();

  if (state.running) {
    requestAnimationFrame((nextTimestamp) => loop(nextTimestamp, runId));
  }
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "r" || event.key === "R") {
    resetGame();
    return;
  }

  state.keys.add(event.key);

  if (event.key === " ") {
    fireBullet(state.player);
  }
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key);
});

ui.restart.addEventListener("click", resetGame);

state.map = cloneMap();
const playerTile = findTile("P");
state.player = createTank(playerTile.col * TILE + 2, playerTile.row * TILE + 2, "player");
state.map[playerTile.row][playerTile.col] = ".";
showOverlay("准备开始", "消灭所有敌方坦克，保护地图中的红色基地。");
syncHud();
draw();
