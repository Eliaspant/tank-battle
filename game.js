const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ui = {
  modeName: document.getElementById("mode-name"),
  levelName: document.getElementById("level-name"),
  enemies: document.getElementById("enemies"),
  powerup: document.getElementById("powerup"),
  p1Name: document.getElementById("p1-name"),
  p2Name: document.getElementById("p2-name"),
  p1Stats: document.getElementById("p1-stats"),
  p2Stats: document.getElementById("p2-stats"),
  overlay: document.getElementById("overlay"),
  overlayTitle: document.getElementById("overlay-title"),
  overlayText: document.getElementById("overlay-text"),
  restart: document.getElementById("restart"),
  classicButton: document.getElementById("mode-classic"),
  versusButton: document.getElementById("mode-versus"),
};

const TILE = 32;
const GRID = 26;
const PLAYER_SIZE = TILE - 6;
const BULLET_SIZE = 8;
const MAX_ENEMIES = 7;
const DUEL_TARGET = 5;

const TILES = {
  EMPTY: ".",
  BRICK: "#",
  STEEL: "@",
  WATER: "~",
  BUSH: "*",
  BASE: "B",
  SPAWN_1: "1",
  SPAWN_2: "2",
  ENEMY: "E",
};

const DIRS = {
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI / 2 },
  left: { x: -1, y: 0, angle: Math.PI },
  right: { x: 1, y: 0, angle: 0 },
};

const PLAYER_PRESETS = {
  p1: {
    id: "p1",
    label: "P1",
    display: "猎鹰",
    color: "#c6ff89",
    dark: "#173019",
    keys: {
      up: "w",
      down: "s",
      left: "a",
      right: "d",
      fire: "f",
    },
  },
  p2: {
    id: "p2",
    label: "P2",
    display: "守望者",
    color: "#8fd7ff",
    dark: "#0d2e40",
    keys: {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
      fire: "Enter",
    },
  },
};

const LEVELS = [
  {
    name: "铁壁前线",
    map: [
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
      "@E......#....*....#.....E@",
      "@..####.#.@@@@@@.#.####..@",
      "@..#....#........#....#..@",
      "@..#..~~~~..##..~~~~..#..@",
      "@..#..~~~~..##..~~~~..#..@",
      "@..####..####@@####..###.@",
      "@..........*....*........@",
      "@.####.@@@@.##.@@@@.####.@",
      "@....#......##......#....@",
      "@.##.#.####....####.#.##.@",
      "@....#....*....*....#....@",
      "@.@@@@.##.######.##.@@@@.@",
      "@......##....##....##....@",
      "@.####....##.##.##....##.@",
      "@...*..@@@@....@@@@..*...@",
      "@.##....~~~~..~~~~....##.@",
      "@.##....~~~~..~~~~....##.@",
      "@....##....####....##....@",
      "@.@@@@@.##......##.@@@@@.@",
      "@..........##*##.........@",
      "@.####.###......###.####.@",
      "@....#.....#BB#.....#....@",
      "@....#....##BB##....#....@",
      "@..1.......@@@@.......2..@",
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
    ],
    enemyPool: 18,
    powerupRate: 0.28,
  },
  {
    name: "洪流裂谷",
    map: [
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
      "@E....~~~~....**....~~~~E@",
      "@.##..~~~~..######..~~~~.@",
      "@....#....#......#....#..@",
      "@.@@@@.##.######.##.@@@@.@",
      "@......##........##......@",
      "@.####....~~~~~~....####.@",
      "@......##.~~~~~~.##......@",
      "@.##*..##........##..*##.@",
      "@....@.######..######.@..@",
      "@.##.@....*......*....@#.@",
      "@....@.@@@@@@..@@@@@@.@..@",
      "@.##.@........##......@#.@",
      "@....@.######....######..@",
      "@.##....*....@@@@....*##.@",
      "@....######........######@",
      "@.##......##.@@@@.##.....@",
      "@....@@@@.##......##.@@..@",
      "@.##......####..####.....@",
      "@....##..............##..@",
      "@.@@@@@..##.####.##..@@@@@",
      "@........##..BB..##......@",
      "@.####.####..BB..####.##.@",
      "@......*..............*..@",
      "@..1.......@@@@.......2..@",
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
    ],
    enemyPool: 20,
    powerupRate: 0.33,
  },
  {
    name: "钢铁迷城",
    map: [
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
      "@E..@@....##....##....@@E@",
      "@..@@..@@....@@....@@..@@@",
      "@..##..@@.######.@@..##..@",
      "@......@@...**...@@......@",
      "@.@@@@....@@..@@....@@@@.@",
      "@....####....~~....####..@",
      "@.##....@@..~~~~..@@....#@",
      "@....@@....~~~~~~....@@..@",
      "@.@@....##..~~~~..##....@@",
      "@....##..@@..##..@@..##..@",
      "@.##....##........##....#@",
      "@....@@....######....@@..@",
      "@.@@@@.##........##.@@@@.@",
      "@....*.##..@@@@..##.*....@",
      "@.##....#........#....##.@",
      "@....##....####....##....@",
      "@.@@....@@......@@....@@.@",
      "@....@@@@..####..@@@@....@",
      "@.##......##..##......##.@",
      "@....##..##.BB.##..##....@",
      "@.@@@@..##..BB..##..@@@@.@",
      "@......**....##....**....@",
      "@.####....@@@@@@....####.@",
      "@..1.......@@@@.......2..@",
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
    ],
    enemyPool: 22,
    powerupRate: 0.36,
  },
];

const DUEL_MAPS = [
  {
    name: "交火穹顶",
    map: [
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
      "@...........**...........@",
      "@..####..@@@@@@..####....@",
      "@..#....~~....~~....#....@",
      "@..#....~~....~~....#....@",
      "@..####....@@....####....@",
      "@..............*.........@",
      "@.@@@@.####..####.@@@@...@",
      "@......#........#........@",
      "@.##...#..****..#...##...@",
      "@......#........#........@",
      "@.@@@@.####..####.@@@@...@",
      "@..............*.........@",
      "@..####....@@....####....@",
      "@..#....~~....~~....#....@",
      "@..#....~~....~~....#....@",
      "@..####..@@@@@@..####....@",
      "@...........**...........@",
      "@........................@",
      "@....@@..............@@..@",
      "@........................@",
      "@..1..................2..@",
      "@........................@",
      "@........................@",
      "@........................@",
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
    ],
  },
  {
    name: "十字战区",
    map: [
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
      "@...........@@...........@",
      "@..****.....@@.....****..@",
      "@..####..########..####..@",
      "@...........@@...........@",
      "@.@@@@@.##..@@..##.@@@@@.@",
      "@......#....@@....#......@",
      "@.##...#..~~~~~~..#...##.@",
      "@......#..~~~~~~..#......@",
      "@.@@@@@.##..@@..##.@@@@@.@",
      "@...........@@...........@",
      "@..####..########..####..@",
      "@...........@@...........@",
      "@.@@@@@.##..@@..##.@@@@@.@",
      "@......#....@@....#......@",
      "@.##...#..~~~~~~..#...##.@",
      "@......#..~~~~~~..#......@",
      "@.@@@@@.##..@@..##.@@@@@.@",
      "@...........@@...........@",
      "@..####..########..####..@",
      "@..****.....@@.....****..@",
      "@..1........@@........2..@",
      "@...........@@...........@",
      "@........................@",
      "@........................@",
      "@@@@@@@@@@@@@@@@@@@@@@@@@@",
    ],
  },
];

const state = {
  keys: new Set(),
  mode: "classic",
  levelIndex: 0,
  map: [],
  runId: 0,
  running: false,
  lastTime: 0,
  players: [],
  enemies: [],
  bullets: [],
  particles: [],
  powerups: [],
  duelScore: { p1: 0, p2: 0 },
  enemyPool: 0,
  enemySpawnTimer: 0,
  activePowerupName: "无",
};

function cloneMap(mapRows) {
  return mapRows.map((row) => row.split(""));
}

function showOverlay(title, text) {
  ui.overlayTitle.textContent = title;
  ui.overlayText.textContent = text;
  ui.overlay.classList.remove("hidden");
}

function hideOverlay() {
  ui.overlay.classList.add("hidden");
}

function setModeButtons() {
  ui.classicButton.classList.toggle("active", state.mode === "classic");
  ui.versusButton.classList.toggle("active", state.mode === "versus");
}

function findTiles(symbol) {
  const found = [];
  for (let row = 0; row < state.map.length; row += 1) {
    for (let col = 0; col < state.map[row].length; col += 1) {
      if (state.map[row][col] === symbol) {
        found.push({ row, col });
      }
    }
  }
  return found;
}

function createTank(owner, x, y, dir, config = {}) {
  return {
    id: config.id || owner,
    owner,
    x,
    y,
    dir,
    size: PLAYER_SIZE,
    speed: config.speed || 2,
    color: config.color || "#ff9f7a",
    dark: config.dark || "#472015",
    cooldown: 0,
    fireCooldown: config.fireCooldown || 320,
    brainTimer: 0,
    lives: config.lives || 1,
    shield: 0,
    rapidFire: 0,
    score: config.score || 0,
    label: config.label || owner,
    display: config.display || owner,
    controls: config.controls || null,
    spawn: config.spawn || { x, y, dir },
  };
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function rectFor(entity, dx = 0, dy = 0) {
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
    return TILES.STEEL;
  }
  return state.map[row][col];
}

function isSolid(tile) {
  return tile === TILES.BRICK || tile === TILES.STEEL || tile === TILES.WATER || tile === TILES.BASE;
}

function blocksBullet(tile) {
  return tile === TILES.BRICK || tile === TILES.STEEL || tile === TILES.BASE;
}

function isConcealment(tile) {
  return tile === TILES.BUSH;
}

function collisionWithMap(rect) {
  const points = [
    [rect.x, rect.y],
    [rect.x + rect.size - 1, rect.y],
    [rect.x, rect.y + rect.size - 1],
    [rect.x + rect.size - 1, rect.y + rect.size - 1],
  ];
  return points.some(([x, y]) => isSolid(tileAt(x, y)));
}

function allTanks() {
  return [...state.players.filter((player) => player.lives > 0), ...state.enemies];
}

function activePlayers() {
  return state.players.filter((player) => player.lives > 0);
}

function canMove(tank, dx, dy) {
  const nextRect = rectFor(tank, dx, dy);
  if (collisionWithMap(nextRect)) {
    return false;
  }

  return !allTanks()
    .filter((other) => other !== tank)
    .some((other) => rectsOverlap(nextRect, rectFor(other)));
}

function tryMoveTank(tank, dx, dy) {
  if (dx !== 0 && canMove(tank, dx, 0)) {
    tank.x += dx;
  }

  if (dy !== 0 && canMove(tank, 0, dy)) {
    tank.y += dy;
  }
}

function getLevel() {
  return state.mode === "classic"
    ? LEVELS[state.levelIndex % LEVELS.length]
    : DUEL_MAPS[state.levelIndex % DUEL_MAPS.length];
}

function createPlayerFromSymbol(symbol) {
  const preset = symbol === TILES.SPAWN_1 ? PLAYER_PRESETS.p1 : PLAYER_PRESETS.p2;
  const found = findTiles(symbol)[0];
  state.map[found.row][found.col] = TILES.EMPTY;
  return createTank(
    preset.id,
    found.col * TILE + 3,
    found.row * TILE + 3,
    "up",
    {
      id: preset.id,
      label: preset.label,
      display: preset.display,
      color: preset.color,
      dark: preset.dark,
      controls: preset.keys,
      lives: state.mode === "classic" ? 3 : 5,
      speed: state.mode === "classic" ? 2.2 : 2.35,
      fireCooldown: 280,
      spawn: { x: found.col * TILE + 3, y: found.row * TILE + 3, dir: "up" },
    }
  );
}

function loadLevel() {
  const level = getLevel();
  state.map = cloneMap(level.map);
  state.players = [createPlayerFromSymbol(TILES.SPAWN_1), createPlayerFromSymbol(TILES.SPAWN_2)];
  state.enemies = [];
  state.bullets = [];
  state.particles = [];
  state.powerups = [];
  state.enemyPool = state.mode === "classic" ? level.enemyPool : 0;
  state.enemySpawnTimer = 0;
  state.activePowerupName = "无";

  if (state.mode === "classic") {
    const enemySpawns = findTiles(TILES.ENEMY);
    enemySpawns.forEach((spot) => {
      state.map[spot.row][spot.col] = TILES.EMPTY;
    });
    spawnEnemies(true);
  }
}

function resetScoresForMode() {
  if (state.mode === "versus") {
    state.duelScore = { p1: 0, p2: 0 };
  }
}

function startGame() {
  state.lastTime = 0;
  state.runId += 1;
  state.running = true;
  loadLevel();
  hideOverlay();
  syncHud();
  const runId = state.runId;
  requestAnimationFrame((timestamp) => loop(timestamp, runId));
}

function setMode(nextMode) {
  state.mode = nextMode;
  state.levelIndex = 0;
  resetScoresForMode();
  loadLevel();
  setModeButtons();
  syncHud();
  draw();
  if (nextMode === "classic") {
    showOverlay("基地防守", "守住基地并清空敌军波次。P1 使用 WASD+F，P2 使用方向键+Enter 协同作战。");
  } else {
    showOverlay("双人对战", "玩家 1 与玩家 2 同屏对战。先拿到 5 次击毁即可获胜。");
  }
}

function spawnEnemies(force = false) {
  if (state.mode !== "classic") {
    return;
  }

  const spawnTiles = [
    { row: 1, col: 1 },
    { row: 1, col: 12 },
    { row: 1, col: 24 },
  ];

  while (state.enemyPool > 0 && state.enemies.length < MAX_ENEMIES) {
    if (!force && state.enemySpawnTimer > 0) {
      return;
    }

    const spawn = spawnTiles[Math.floor(Math.random() * spawnTiles.length)];
    const enemy = createTank(
      "enemy",
      spawn.col * TILE + 3,
      spawn.row * TILE + 3,
      "down",
      {
        speed: 1.55 + Math.random() * 0.2,
        fireCooldown: 740 + Math.random() * 260,
      }
    );

    const blocked = allTanks().some((tank) => rectsOverlap(rectFor(enemy), rectFor(tank)));
    if (!blocked && !collisionWithMap(rectFor(enemy))) {
      state.enemies.push(enemy);
      state.enemyPool -= 1;
      state.enemySpawnTimer = 180 + Math.random() * 170;
    }

    if (!force) {
      return;
    }
  }
}

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

function fireBullet(tank) {
  if (!tank || tank.cooldown > 0) {
    return;
  }

  const dir = DIRS[tank.dir];
  const muzzle = tank.size / 2 - 3;
  state.bullets.push({
    x: tank.x + tank.size / 2 - BULLET_SIZE / 2 + dir.x * muzzle,
    y: tank.y + tank.size / 2 - BULLET_SIZE / 2 + dir.y * muzzle,
    size: BULLET_SIZE,
    vx: dir.x * (tank.owner === "enemy" ? 5.2 : 6.4),
    vy: dir.y * (tank.owner === "enemy" ? 5.2 : 6.4),
    owner: tank.owner,
    color: tank.color,
  });

  tank.cooldown = tank.rapidFire > 0 ? tank.fireCooldown * 0.45 : tank.fireCooldown;
}

function updateHumanPlayer(player, delta) {
  if (player.lives <= 0) {
    return;
  }

  const { controls } = player;
  let dx = 0;
  let dy = 0;

  if (state.keys.has(controls.up)) {
    dy -= player.speed * delta;
    player.dir = "up";
  }
  if (state.keys.has(controls.down)) {
    dy += player.speed * delta;
    player.dir = "down";
  }
  if (state.keys.has(controls.left)) {
    dx -= player.speed * delta;
    player.dir = "left";
  }
  if (state.keys.has(controls.right)) {
    dx += player.speed * delta;
    player.dir = "right";
  }

  tryMoveTank(player, dx, dy);
}

function nearestPlayer(enemy) {
  const candidates = activePlayers();
  if (candidates.length === 0) {
    return null;
  }

  let picked = candidates[0];
  let pickedDistance = Infinity;
  candidates.forEach((player) => {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (distance < pickedDistance) {
      picked = player;
      pickedDistance = distance;
    }
  });
  return picked;
}

function hasLineOfSight(enemy, target) {
  if (!target) {
    return false;
  }

  const sameColumn = Math.abs(enemy.x - target.x) < TILE * 0.4;
  const sameRow = Math.abs(enemy.y - target.y) < TILE * 0.4;
  if (!sameColumn && !sameRow) {
    return false;
  }

  const steps = 18;
  const dx = (target.x - enemy.x) / steps;
  const dy = (target.y - enemy.y) / steps;
  for (let i = 1; i < steps; i += 1) {
    const tile = tileAt(enemy.x + dx * i, enemy.y + dy * i);
    if (blocksBullet(tile) && tile !== TILES.BUSH) {
      return false;
    }
  }
  return true;
}

function chooseEnemyDirection(enemy) {
  const target = nearestPlayer(enemy);
  const horizontal = target.x > enemy.x ? "right" : "left";
  const vertical = target.y > enemy.y ? "down" : "up";
  const choices = Math.abs(target.x - enemy.x) > Math.abs(target.y - enemy.y)
    ? [horizontal, vertical, enemy.dir]
    : [vertical, horizontal, enemy.dir];
  choices.push("up", "down", "left", "right");

  for (const dir of choices) {
    const vector = DIRS[dir];
    if (canMove(enemy, vector.x * enemy.speed * 1.4, vector.y * enemy.speed * 1.4)) {
      enemy.dir = dir;
      return;
    }
  }
}

function updateEnemies(delta, frameMs) {
  state.enemies.forEach((enemy) => {
    enemy.cooldown = Math.max(0, enemy.cooldown - frameMs);
    enemy.brainTimer -= frameMs;

    if (enemy.brainTimer <= 0) {
      enemy.brainTimer = 220 + Math.random() * 320;
      chooseEnemyDirection(enemy);
    }

    const vector = DIRS[enemy.dir];
    const beforeX = enemy.x;
    const beforeY = enemy.y;
    tryMoveTank(enemy, vector.x * enemy.speed * delta, vector.y * enemy.speed * delta);

    if (beforeX === enemy.x && beforeY === enemy.y) {
      chooseEnemyDirection(enemy);
    }

    const target = nearestPlayer(enemy);
    if (target && (hasLineOfSight(enemy, target) || Math.random() > 0.992)) {
      fireBullet(enemy);
    }
  });
}

function damageTile(col, row) {
  const tile = state.map[row]?.[col];
  if (tile === TILES.BRICK) {
    state.map[row][col] = TILES.EMPTY;
    addExplosion(col * TILE + TILE / 2, row * TILE + TILE / 2, "#f7ba6a", 8);
    return true;
  }

  if (tile === TILES.BASE) {
    state.map[row][col] = TILES.EMPTY;
    addExplosion(col * TILE + TILE / 2, row * TILE + TILE / 2, "#ff8c68", 16);
    endClassic(false, "基地被摧毁，防线失守。");
    return true;
  }

  return tile === TILES.STEEL;
}

function addExplosion(x, y, color, count = 12) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4.4,
      vy: (Math.random() - 0.5) * 4.4,
      life: 22 + Math.random() * 24,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function respawnPlayer(player) {
  if (player.lives <= 0) {
    return;
  }

  player.x = player.spawn.x;
  player.y = player.spawn.y;
  player.dir = player.spawn.dir;
  player.shield = 1800;
  player.rapidFire = 0;
}

function awardKill(ownerId) {
  const shooter = state.players.find((player) => player.id === ownerId);
  if (shooter) {
    shooter.score += 100;
  }
}

function endClassic(victory, text) {
  state.running = false;
  showOverlay(victory ? "防守成功" : "任务失败", text);
}

function endVersus(winner) {
  state.running = false;
  showOverlay(
    "对战结束",
    `${winner.display} 率先完成 ${DUEL_TARGET} 次击毁。按“开始 / 重开”再打一局。`
  );
}

function hitTank(target, bullet) {
  if (target.shield > 0) {
    addExplosion(target.x + target.size / 2, target.y + target.size / 2, "#ffffff", 6);
    return;
  }

  addExplosion(target.x + target.size / 2, target.y + target.size / 2, bullet.color || "#f7ba6a", 16);

  if (target.owner === "enemy") {
    awardKill(bullet.owner);
    state.enemies = state.enemies.filter((enemy) => enemy !== target);

    if (Math.random() < getLevel().powerupRate) {
      spawnPowerup(target.x + target.size / 2, target.y + target.size / 2);
    }

    if (state.enemies.length === 0 && state.enemyPool === 0) {
      state.levelIndex += 1;
      if (state.levelIndex >= LEVELS.length) {
        endClassic(true, "全部关卡清空，基地成功守住。");
      } else {
        state.running = false;
        showOverlay("关卡完成", `进入下一关：${LEVELS[state.levelIndex].name}。点击开始继续。`);
      }
    }
    return;
  }

  target.lives -= 1;
  if (state.mode === "versus") {
    state.duelScore[bullet.owner] += 1;
    if (state.duelScore[bullet.owner] >= DUEL_TARGET) {
      endVersus(state.players.find((player) => player.id === bullet.owner));
      return;
    }
  }

  if (target.lives > 0) {
    respawnPlayer(target);
    return;
  }

  if (state.mode === "classic") {
    const alive = activePlayers().length > 0;
    if (!alive) {
      endClassic(false, "所有玩家坦克被击毁，阵地失守。");
    }
  } else {
    const winnerId = target.id === "p1" ? "p2" : "p1";
    const winner = state.players.find((player) => player.id === winnerId);
    endVersus(winner);
  }
}

function resolveBulletCollisions() {
  const nextBullets = [];

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    if (
      bullet.x < 0 ||
      bullet.y < 0 ||
      bullet.x > canvas.width ||
      bullet.y > canvas.height
    ) {
      continue;
    }

    const col = Math.floor((bullet.x + bullet.size / 2) / TILE);
    const row = Math.floor((bullet.y + bullet.size / 2) / TILE);
    const tile = state.map[row]?.[col];

    if (blocksBullet(tile)) {
      const consumed = damageTile(col, row);
      addExplosion(bullet.x, bullet.y, tile === TILES.STEEL ? "#9eb6ba" : "#f7ba6a", 8);
      if (consumed) {
        continue;
      }
    }

    const rect = { x: bullet.x, y: bullet.y, size: bullet.size };
    let enemyTargets;
    if (state.mode === "versus") {
      enemyTargets = activePlayers().filter((player) => player.id !== bullet.owner);
    } else if (bullet.owner === "enemy") {
      enemyTargets = activePlayers();
    } else {
      enemyTargets = state.enemies;
    }

    const target = enemyTargets.find((tank) => rectsOverlap(rect, rectFor(tank)));
    if (target) {
      hitTank(target, bullet);
      continue;
    }

    const powerup = state.powerups.find((item) => rectsOverlap(rect, { x: item.x, y: item.y, size: item.size }));
    if (powerup) {
      continue;
    }

    nextBullets.push(bullet);
  }

  state.bullets = nextBullets.filter((bullet, index, bullets) => {
    for (let i = index + 1; i < bullets.length; i += 1) {
      if (rectsOverlap(bullet, bullets[i])) {
        addExplosion(bullet.x, bullet.y, "#ffffff", 6);
        bullets.splice(i, 1);
        return false;
      }
    }
    return true;
  });
}

function spawnPowerup(x, y) {
  const types = ["shield", "repair", "rapid"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.powerups.push({
    type,
    x: Math.max(TILE, Math.min(canvas.width - TILE * 2, x - TILE / 2)),
    y: Math.max(TILE, Math.min(canvas.height - TILE * 2, y - TILE / 2)),
    size: TILE - 8,
    life: 7800,
  });
}

function applyPowerup(player, powerup) {
  if (powerup.type === "shield") {
    player.shield = 3200;
    state.activePowerupName = `${player.label} 护盾`;
  } else if (powerup.type === "repair") {
    player.lives = Math.min(player.lives + 1, state.mode === "classic" ? 5 : 7);
    state.activePowerupName = `${player.label} 修复`;
  } else if (powerup.type === "rapid") {
    player.rapidFire = 4200;
    state.activePowerupName = `${player.label} 急速装填`;
  }
}

function updatePowerups(frameMs) {
  state.powerups = state.powerups.filter((powerup) => {
    powerup.life -= frameMs;
    if (powerup.life <= 0) {
      return false;
    }

    const player = state.players.find((tank) =>
      rectsOverlap({ x: powerup.x, y: powerup.y, size: powerup.size }, rectFor(tank))
    );

    if (player) {
      applyPowerup(player, powerup);
      addExplosion(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2, "#fff4bf", 12);
      return false;
    }

    return true;
  });
}

function updateTimers(frameMs) {
  state.players.forEach((player) => {
    player.cooldown = Math.max(0, player.cooldown - frameMs);
    player.shield = Math.max(0, player.shield - frameMs);
    player.rapidFire = Math.max(0, player.rapidFire - frameMs);
  });

  state.enemySpawnTimer = Math.max(0, state.enemySpawnTimer - frameMs);
  if (state.activePowerupName !== "无" && state.powerups.length === 0) {
    const active = state.players.find((player) => player.shield > 0 || player.rapidFire > 0);
    if (!active) {
      state.activePowerupName = "无";
    }
  }
}

function updateParticles() {
  state.particles = state.particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life -= 1;
    return particle.life > 0;
  });
}

function update(frameMs) {
  const delta = Math.min(frameMs / 16.67, 1.8);

  updateTimers(frameMs);
  state.players.forEach((player) => updateHumanPlayer(player, delta));

  if (state.mode === "classic") {
    updateEnemies(delta, frameMs);
    spawnEnemies();
  }

  resolveBulletCollisions();
  updatePowerups(frameMs);
  updateParticles();
  syncHud();
}

function drawTile(row, col, tile) {
  const x = col * TILE;
  const y = row * TILE;

  ctx.fillStyle = (row + col) % 2 === 0 ? "#263524" : "#2b3b29";
  ctx.fillRect(x, y, TILE, TILE);

  if (tile === TILES.BRICK) {
    ctx.fillStyle = "#9f6d43";
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = "#6d4228";
    ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
  } else if (tile === TILES.STEEL) {
    ctx.fillStyle = "#8ea4ac";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = "#53636a";
    ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
  } else if (tile === TILES.WATER) {
    ctx.fillStyle = "#215c8c";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + 5, y + 8, TILE - 10, 5);
    ctx.fillRect(x + 8, y + 18, TILE - 16, 4);
  } else if (tile === TILES.BASE) {
    ctx.fillStyle = "#ff8c68";
    ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = "#ffd57a";
    ctx.fillRect(x + 10, y + 10, TILE - 20, TILE - 20);
  }
}

function drawMap() {
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      const tile = state.map[row][col];
      drawTile(row, col, tile);
    }
  }
}

function drawTank(tank) {
  const onBush = isConcealment(tileAt(tank.x + tank.size / 2, tank.y + tank.size / 2));

  ctx.save();
  ctx.translate(tank.x + tank.size / 2, tank.y + tank.size / 2);
  ctx.rotate(DIRS[tank.dir].angle);
  ctx.globalAlpha = onBush ? 0.76 : 1;

  ctx.fillStyle = tank.color;
  ctx.fillRect(-tank.size / 2 + 6, -tank.size / 2, tank.size - 12, tank.size);
  ctx.fillRect(-tank.size / 2, -tank.size / 2 + 5, 8, tank.size - 10);
  ctx.fillRect(tank.size / 2 - 8, -tank.size / 2 + 5, 8, tank.size - 10);

  ctx.fillStyle = tank.dark;
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillRect(0, -3, tank.size / 2 + 4, 6);

  if (tank.shield > 0) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, tank.size / 2 + 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBushes() {
  for (let row = 0; row < GRID; row += 1) {
    for (let col = 0; col < GRID; col += 1) {
      if (state.map[row][col] !== TILES.BUSH) {
        continue;
      }

      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = "#406c31";
      ctx.beginPath();
      ctx.arc(x + 9, y + 12, 8, 0, Math.PI * 2);
      ctx.arc(x + 18, y + 10, 7, 0, Math.PI * 2);
      ctx.arc(x + 13, y + 20, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBullets() {
  state.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color || "#ffffff";
    ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
  });
}

function drawPowerups() {
  state.powerups.forEach((powerup) => {
    const pulse = 0.65 + Math.sin(powerup.life / 240) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = powerup.type === "shield" ? "#e7f6ff" : powerup.type === "repair" ? "#ffd57a" : "#c6ff89";
    ctx.fillRect(powerup.x, powerup.y, powerup.size, powerup.size);
    ctx.globalAlpha = 1;
  });
}

function drawParticles() {
  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / 34);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  activePlayers().forEach(drawTank);
  state.enemies.forEach(drawTank);
  drawBushes();
  drawBullets();
  drawPowerups();
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

  const frameMs = Math.min(timestamp - state.lastTime, 30);
  state.lastTime = timestamp;

  update(frameMs);
  draw();

  if (state.running) {
    requestAnimationFrame((nextTime) => loop(nextTime, runId));
  }
}

function syncHud() {
  const level = getLevel();
  const p1 = state.players.find((player) => player.id === "p1");
  const p2 = state.players.find((player) => player.id === "p2");

  ui.modeName.textContent = state.mode === "classic" ? "基地防守" : "双人对战";
  ui.levelName.textContent = level.name;
  ui.enemies.textContent = state.mode === "classic"
    ? `${state.enemies.length + state.enemyPool} 辆`
    : `${state.duelScore.p1} : ${state.duelScore.p2}`;
  ui.powerup.textContent = state.activePowerupName;
  ui.p1Name.textContent = p1 ? p1.display : "猎鹰";
  ui.p2Name.textContent = p2 ? p2.display : "守望者";
  ui.p1Stats.textContent = p1
    ? `生命 ${p1.lives} / 分数 ${p1.score}${p1.shield > 0 ? " / 护盾" : ""}${p1.rapidFire > 0 ? " / 连射" : ""}`
    : "生命 0 / 分数 0";
  ui.p2Stats.textContent = p2
    ? `生命 ${p2.lives} / 分数 ${p2.score}${p2.shield > 0 ? " / 护盾" : ""}${p2.rapidFire > 0 ? " / 连射" : ""}`
    : "生命 0 / 分数 0";
}

window.addEventListener("keydown", (event) => {
  const key = normalizeKey(event.key);
  const blocked = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Enter",
    " ",
    "w",
    "a",
    "s",
    "d",
    "f",
  ];

  if (blocked.includes(key)) {
    event.preventDefault();
  }

  if (key === "r") {
    startGame();
    return;
  }

  state.keys.add(key);

  state.players.forEach((player) => {
    if (player.controls && key === player.controls.fire) {
      fireBullet(player);
    }
  });
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(normalizeKey(event.key));
});

ui.classicButton.addEventListener("click", () => setMode("classic"));
ui.versusButton.addEventListener("click", () => setMode("versus"));
ui.restart.addEventListener("click", startGame);

setModeButtons();
loadLevel();
syncHud();
showOverlay("准备进入战场", "选择模式后开始。基地防守支持双人协作；双人对战为同屏 1v1。");
draw();
