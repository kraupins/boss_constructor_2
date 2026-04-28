export const BOARD_SIZE = 7;

export const TILES = {
  wood: {
    id: 'wood',
    label: 'Деревянный меч',
    short: 'ДМ',
    kind: 'sword',
    color: '#8b5a2b',
    textColor: '#fff7df'
  },
  iron: {
    id: 'iron',
    label: 'Железный меч',
    short: 'ЖМ',
    kind: 'sword',
    color: '#9aa3ad',
    textColor: '#101419'
  },
  gold: {
    id: 'gold',
    label: 'Золотой меч',
    short: 'ЗМ',
    kind: 'sword',
    color: '#f1c232',
    textColor: '#1b1600'
  },
  diamond: {
    id: 'diamond',
    label: 'Алмазный меч',
    short: 'АМ',
    kind: 'sword',
    color: '#50c8ff',
    textColor: '#002232'
  },
  clay: {
    id: 'clay',
    label: 'Глиняный шар',
    short: 'ГШ',
    kind: 'pureDamage',
    color: '#c47155',
    textColor: '#fff7f0'
  },
  shield: {
    id: 'shield',
    label: 'Алмазный шар',
    short: 'ЗЩ',
    kind: 'shield',
    color: '#7ee8fa',
    textColor: '#002832'
  },
  bedrock: {
    id: 'bedrock',
    label: 'Бедрок шар',
    short: 'БР',
    kind: 'armorBreak',
    color: '#343038',
    textColor: '#f0eaff'
  }
};

export const DEFAULT_WEIGHTS = {
  wood: 18,
  iron: 16,
  gold: 14,
  diamond: 10,
  clay: 16,
  shield: 14,
  bedrock: 12
};

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Лёгкий',
    hpMul: 0.85,
    armorDelta: -5,
    bossDamageMul: 0.8,
    attackIntervalDelta: 1,
    regenMul: 0.75,
    regenIntervalDelta: 1,
    playerDamageMul: 1.15,
    shieldMul: 1.15,
    breakMul: 1.15,
    targetTurns: 16,
    targetSurvivalHits: 8
  },
  medium: {
    id: 'medium',
    label: 'Средний',
    hpMul: 1,
    armorDelta: 0,
    bossDamageMul: 1,
    attackIntervalDelta: 0,
    regenMul: 1,
    regenIntervalDelta: 0,
    playerDamageMul: 1,
    shieldMul: 1,
    breakMul: 1,
    targetTurns: 23,
    targetSurvivalHits: 6
  },
  hard: {
    id: 'hard',
    label: 'Сложный',
    hpMul: 1.15,
    armorDelta: 5,
    bossDamageMul: 1.2,
    attackIntervalDelta: -1,
    regenMul: 1.25,
    regenIntervalDelta: -1,
    playerDamageMul: 0.85,
    shieldMul: 0.9,
    breakMul: 0.9,
    targetTurns: 32,
    targetSurvivalHits: 4
  }
};

export const BOSS_TYPES = {
  normal: {
    id: 'normal',
    label: 'Обычный',
    armor: 20,
    attackInterval: 4,
    regenInterval: 6,
    regenPercent: 4,
    attackChunks: 4,
    attackDamageMul: 1
  },
  tank: {
    id: 'tank',
    label: 'Бронированный',
    armor: 35,
    attackInterval: 5,
    regenInterval: 7,
    regenPercent: 2,
    attackChunks: 5,
    attackDamageMul: 0.95
  },
  regenerator: {
    id: 'regenerator',
    label: 'Регенерирующий',
    armor: 12,
    attackInterval: 5,
    regenInterval: 4,
    regenPercent: 6,
    attackChunks: 4,
    attackDamageMul: 0.95
  },
  aggressive: {
    id: 'aggressive',
    label: 'Агрессивный',
    armor: 10,
    attackInterval: 3,
    regenInterval: 8,
    regenPercent: 1,
    attackChunks: 5,
    attackDamageMul: 1.18
  },
  final: {
    id: 'final',
    label: 'Финальный',
    armor: 35,
    attackInterval: 4,
    regenInterval: 5,
    regenPercent: 5,
    attackChunks: 6,
    attackDamageMul: 1.12
  }
};

export const MATCH_MULTIPLIERS = [
  { min: 3, value: 1 },
  { min: 4, value: 1.25 },
  { min: 5, value: 1.6 },
  { min: 6, value: 2 },
  { min: 7, value: 2.5 }
];

const SWORD_WEIGHTS = {
  wood: 1,
  iron: 1.7,
  gold: 2.5,
  diamond: 3.4
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function round(value, digits = 0) {
  const power = 10 ** digits;
  return Math.round(value * power) / power;
}

function n(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function createDefaultForm() {
  return {
    bossName: 'Каменный Голем',
    bossHp: 1000,
    difficulty: 'medium',
    bossType: 'normal',

    bossArmor: '',
    attackInterval: '',
    regenInterval: '',
    regenPercent: '',
    attackChunks: '',

    playerPermanentHp: 800,
    playerArmor: 15,
    strengthBonus: 5,
    healthBonus: 0,
    defenseBonus: 5,

    targetTurns: '',
    attempts: 100,
    maxTurns: 90,
    seed: 'mergecraft-boss-1',

    weights: { ...DEFAULT_WEIGHTS }
  };
}

export function calculateConfig(form) {
  const diff = DIFFICULTIES[form.difficulty] ?? DIFFICULTIES.medium;
  const bossType = BOSS_TYPES[form.bossType] ?? BOSS_TYPES.normal;

  const baseBossHp = Math.max(1, n(form.bossHp, 1000));
  const bossMaxHp = Math.max(1, Math.round(baseBossHp * diff.hpMul));

  const baseArmor = form.bossArmor === '' ? bossType.armor : n(form.bossArmor, bossType.armor);
  const bossArmor = clamp(baseArmor + diff.armorDelta, 0, 50);

  const baseAttackInterval = form.attackInterval === '' ? bossType.attackInterval : n(form.attackInterval, bossType.attackInterval);
  const attackInterval = Math.max(2, Math.round(baseAttackInterval + diff.attackIntervalDelta));

  const baseRegenInterval = form.regenInterval === '' ? bossType.regenInterval : n(form.regenInterval, bossType.regenInterval);
  const regenInterval = Math.max(2, Math.round(baseRegenInterval + diff.regenIntervalDelta));

  const baseRegenPercent = form.regenPercent === '' ? bossType.regenPercent : n(form.regenPercent, bossType.regenPercent);
  const regenPercent = clamp(baseRegenPercent * diff.regenMul, 0, 12);

  const attackChunks = Math.max(1, Math.round(form.attackChunks === '' ? bossType.attackChunks : n(form.attackChunks, bossType.attackChunks)));

  const playerPermanentHp = clamp(n(form.playerPermanentHp, 800), 100, 3000);
  const playerArmor = clamp(n(form.playerArmor, 15), 0, 50);
  const strengthBonus = clamp(n(form.strengthBonus, 0), 0, 25);
  const healthBonus = clamp(n(form.healthBonus, 0), 0, 20);
  const defenseBonus = clamp(n(form.defenseBonus, 0), 0, 25);
  const playerBattleHp = clamp(Math.round(playerPermanentHp * (1 + healthBonus / 100)), 1, 3600);

  const targetTurns = Math.max(8, Math.round(form.targetTurns === '' ? diff.targetTurns : n(form.targetTurns, diff.targetTurns)));
  const averageSwordPowerPerTurn = 4.5;
  const armorFactor = Math.max(0.05, 1 - bossArmor / 100);
  const baseSwordDamage = bossMaxHp / (targetTurns * averageSwordPowerPerTurn * armorFactor);

  const swordDamage = Object.fromEntries(
    Object.entries(SWORD_WEIGHTS).map(([tileId, weight]) => [
      tileId,
      Math.max(1, Math.round(baseSwordDamage * weight * diff.playerDamageMul))
    ])
  );

  const clayDamage = Math.max(1, Math.round(swordDamage.wood * 0.25));
  const shieldPerBall = round(0.5 * (4 / attackInterval) * diff.shieldMul, 2);
  const bedrockBreakPerBall = round(clamp(bossArmor * 0.025, 0.4, 1.25) * diff.breakMul, 2);

  const expectedPlayerArmor = clamp(playerArmor + defenseBonus + 5, 0, 75) / 100;
  const targetDamageAfterArmor = playerBattleHp / diff.targetSurvivalHits;
  const bossRawAttackDamage = Math.max(
    1,
    Math.round((targetDamageAfterArmor / Math.max(0.05, 1 - expectedPlayerArmor)) * diff.bossDamageMul * bossType.attackDamageMul)
  );

  const weights = normalizeWeights(form.weights ?? DEFAULT_WEIGHTS);

  return {
    bossName: form.bossName?.trim() || 'Босс',
    difficulty: diff,
    bossType,
    baseBossHp,
    bossMaxHp,
    bossArmor,
    attackInterval,
    attackRawDamage: bossRawAttackDamage,
    attackChunks,
    regenInterval,
    regenPercent,
    targetTurns,
    playerPermanentHp,
    playerBattleHp,
    playerArmor,
    strengthBonus,
    healthBonus,
    defenseBonus,
    battleArmorCap: 75,
    permanentHpCap: 3000,
    battleHpCap: 3600,
    permanentArmorCap: 50,
    strengthCap: 25,
    diamondShieldCap: 25,
    bossArmorBreakCap: bossArmor,
    swordDamage,
    clayDamage,
    shieldPerBall,
    bedrockBreakPerBall,
    weights,
    formulas: buildFormulas({ diff, bossType })
  };
}

function buildFormulas({ diff }) {
  return [
    `BossMaxHP = BaseHP × ${diff.hpMul}`,
    `BossArmor = clamp(BaseArmor + ${diff.armorDelta}%, 0%, 50%)`,
    'BaseSwordDamage = BossMaxHP / (TargetTurns × 4.5 × (1 - BossArmor))',
    `SwordDamage = BaseSwordDamage × SwordWeight × ${diff.playerDamageMul}`,
    'ClayDamage = max(1, round(WoodSwordDamage × 0.25))',
    `ShieldPerBall = 0.5% × (4 / AttackInterval) × ${diff.shieldMul}`,
    `BedrockBreakPerBall = clamp(BossArmor × 0.025, 0.4%, 1.25%) × ${diff.breakMul}`,
    `BossAttackDamage = PlayerBattleHP / ${diff.targetSurvivalHits} / (1 - ExpectedPlayerArmor) × ${diff.bossDamageMul}`,
    'PlayerBattleHP = min(PermanentHP × (1 + HealthBonus), 3600)',
    'PlayerArmorFinal = min(BaseArmor + DefenseBonus + DiamondShield, 75%)'
  ];
}

export function normalizeWeights(weights) {
  const normalized = {};
  for (const tileId of Object.keys(TILES)) {
    normalized[tileId] = Math.max(0, n(weights?.[tileId], DEFAULT_WEIGHTS[tileId] ?? 1));
  }
  const total = Object.values(normalized).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return normalized;
}

export function getMatchMultiplier(count) {
  let result = 1;
  for (const entry of MATCH_MULTIPLIERS) {
    if (count >= entry.min) result = entry.value;
  }
  return result;
}

export function getCascadeMultiplier(cascadeIndex) {
  return Math.min(1 + cascadeIndex * 0.1, 1.5);
}

export function hashSeed(seed) {
  const text = String(seed ?? 'seed');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed) {
  let state = hashSeed(seed) || 1;
  return function rng() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickWeightedTile(weights, rng) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  let roll = rng() * total;
  for (const [tileId, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return tileId;
  }
  return 'wood';
}

function wouldCreateImmediateMatch(board, row, col, tileId) {
  const left1 = col >= 1 ? board[row][col - 1] : null;
  const left2 = col >= 2 ? board[row][col - 2] : null;
  const up1 = row >= 1 ? board[row - 1][col] : null;
  const up2 = row >= 2 ? board[row - 2][col] : null;
  return (left1 === tileId && left2 === tileId) || (up1 === tileId && up2 === tileId);
}

export function createBoard(weights, rng) {
  const board = Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let tile = pickWeightedTile(weights, rng);
      let guard = 0;
      while (wouldCreateImmediateMatch(board, row, col, tile) && guard < 30) {
        tile = pickWeightedTile(weights, rng);
        guard += 1;
      }
      board[row][col] = tile;
    }
  }
  return board;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function swapInPlace(board, a, b) {
  const temp = board[a.row][a.col];
  board[a.row][a.col] = board[b.row][b.col];
  board[b.row][b.col] = temp;
}

export function findMatches(board) {
  const groups = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let start = 0;
    while (start < BOARD_SIZE) {
      const tileId = board[row][start];
      let end = start + 1;
      while (end < BOARD_SIZE && board[row][end] === tileId) end += 1;
      const count = end - start;
      if (tileId && count >= 3) {
        groups.push({
          tileId,
          count,
          orientation: 'row',
          cells: Array.from({ length: count }, (_, i) => ({ row, col: start + i }))
        });
      }
      start = end;
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let start = 0;
    while (start < BOARD_SIZE) {
      const tileId = board[start][col];
      let end = start + 1;
      while (end < BOARD_SIZE && board[end][col] === tileId) end += 1;
      const count = end - start;
      if (tileId && count >= 3) {
        groups.push({
          tileId,
          count,
          orientation: 'col',
          cells: Array.from({ length: count }, (_, i) => ({ row: start + i, col }))
        });
      }
      start = end;
    }
  }

  return groups;
}

function removeAndDrop(board, groups, weights, rng) {
  const marked = new Set();
  for (const group of groups) {
    for (const cell of group.cells) {
      marked.add(`${cell.row}:${cell.col}`);
    }
  }

  for (const key of marked) {
    const [row, col] = key.split(':').map(Number);
    board[row][col] = null;
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const stack = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      if (board[row][col]) stack.push(board[row][col]);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      board[row][col] = stack.shift() ?? pickWeightedTile(weights, rng);
    }
  }
}

export function getLegalMoves(board) {
  const moves = [];
  const dirs = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 }
  ];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      for (const dir of dirs) {
        const nr = row + dir.dr;
        const nc = col + dir.dc;
        if (nr >= BOARD_SIZE || nc >= BOARD_SIZE) continue;
        if (board[row][col] === board[nr][nc]) continue;
        const test = cloneBoard(board);
        swapInPlace(test, { row, col }, { row: nr, col: nc });
        const matches = findMatches(test);
        if (matches.length > 0) {
          moves.push({ from: { row, col }, to: { row: nr, col: nc }, matches });
        }
      }
    }
  }

  return moves;
}

function estimateGroupsScore(groups, config, state, cascadeIndex = 0) {
  let score = 0;
  const cascadeMultiplier = getCascadeMultiplier(cascadeIndex);
  const effectiveArmor = clamp(config.bossArmor - state.armorBreak, 0, 50) / 100;

  for (const group of groups) {
    const tile = TILES[group.tileId];
    const matchMultiplier = getMatchMultiplier(group.count);
    const common = group.count * matchMultiplier * cascadeMultiplier;

    if (tile.kind === 'sword') {
      score += common * config.swordDamage[group.tileId] * (1 + config.strengthBonus / 100) * (1 - effectiveArmor);
    } else if (tile.kind === 'pureDamage') {
      score += common * config.clayDamage * 0.85;
    } else if (tile.kind === 'shield') {
      const attackSoonMul = state.attackCounter <= 2 ? 10 : 3;
      const lowHpMul = state.playerHp / config.playerBattleHp < 0.45 ? 1.8 : 1;
      score += common * config.shieldPerBall * attackSoonMul * lowHpMul;
    } else if (tile.kind === 'armorBreak') {
      const armorPressure = Math.max(1, config.bossArmor / 10);
      score += common * config.bedrockBreakPerBall * armorPressure * 4;
    }
  }

  // A small boss-finishing bias: if the boss is low, prefer raw damage.
  if (state.bossHp < config.bossMaxHp * 0.18) score *= 1.15;
  return score;
}

function chooseMove(board, config, state, rng) {
  const moves = getLegalMoves(board);
  if (moves.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const score = estimateGroupsScore(move.matches, config, state) + rng() * 1.5;
    if (score > bestScore) {
      bestScore = score;
      best = { ...move, score };
    }
  }

  return best;
}

function formatMove(move) {
  if (!move) return 'нет хода';
  return `(${move.from.row + 1},${move.from.col + 1}) ↔ (${move.to.row + 1},${move.to.col + 1})`;
}

function applyGroups(groups, config, state, rng, cascadeIndex, log) {
  const cascadeMultiplier = getCascadeMultiplier(cascadeIndex);
  let swordGroups = [];
  let dealtBeforeSwords = 0;
  const lines = [];

  for (const group of groups) {
    const tile = TILES[group.tileId];
    const matchMultiplier = getMatchMultiplier(group.count);
    const valueMultiplier = matchMultiplier * cascadeMultiplier;

    if (tile.kind === 'sword') {
      swordGroups.push({ group, matchMultiplier, valueMultiplier });
      continue;
    }

    if (tile.kind === 'pureDamage') {
      const damage = group.count * config.clayDamage * valueMultiplier;
      state.bossHp = Math.max(0, state.bossHp - damage);
      dealtBeforeSwords += damage;
      lines.push(`${tile.label}: чистый урон ${round(damage)}.`);
    }

    if (tile.kind === 'shield') {
      const gain = group.count * config.shieldPerBall * valueMultiplier;
      const before = state.diamondShield;
      state.diamondShield = clamp(state.diamondShield + gain, 0, config.diamondShieldCap);
      lines.push(`${tile.label}: защита +${round(state.diamondShield - before, 2)}% до атаки босса.`);
    }

    if (tile.kind === 'armorBreak') {
      const gain = group.count * config.bedrockBreakPerBall * valueMultiplier;
      const before = state.armorBreak;
      state.armorBreak = clamp(state.armorBreak + gain, 0, config.bossArmorBreakCap);
      lines.push(`${tile.label}: броня босса -${round(state.armorBreak - before, 2)}% до следующего урона мечами.`);
    }
  }

  if (swordGroups.length > 0 && state.bossHp > 0) {
    const effectiveArmor = clamp(config.bossArmor - state.armorBreak, 0, 50) / 100;
    let swordDamage = 0;
    let blocked = 0;
    let hits = 0;

    for (const { group, valueMultiplier } of swordGroups) {
      const tile = TILES[group.tileId];
      const oneTileDamage = config.swordDamage[group.tileId] * valueMultiplier * (1 + config.strengthBonus / 100);

      for (let i = 0; i < group.count; i += 1) {
        if (rng() < effectiveArmor) {
          blocked += 1;
        } else {
          hits += 1;
          swordDamage += oneTileDamage;
        }
      }

      lines.push(`${tile.label} ×${group.count}: ${round(oneTileDamage)} урона за незаблокированный тайл.`);
    }

    state.bossHp = Math.max(0, state.bossHp - swordDamage);
    lines.push(`Мечи: прошло ${hits}, заблокировано ${blocked}, урон ${round(swordDamage)}. Эффективная броня босса: ${round(effectiveArmor * 100, 2)}%.`);
    state.armorBreak = 0;
  }

  if (lines.length > 0) {
    log.push(`Каскад ${cascadeIndex + 1}: ${lines.join(' ')}`);
  }

  return dealtBeforeSwords;
}

function resolveBoardAfterMove(board, config, state, rng, log) {
  let cascadeIndex = 0;
  let totalGroups = 0;

  while (cascadeIndex < 12 && state.bossHp > 0) {
    const groups = findMatches(board);
    if (groups.length === 0) break;

    totalGroups += groups.length;
    applyGroups(groups, config, state, rng, cascadeIndex, log);
    removeAndDrop(board, groups, config.weights, rng);
    cascadeIndex += 1;
  }

  return { cascades: cascadeIndex, groups: totalGroups };
}

function bossTurn(config, state, log, rng) {
  state.attackCounter -= 1;
  state.regenCounter -= 1;

  if (state.attackCounter <= 0 && state.playerHp > 0 && state.bossHp > 0) {
    const playerArmorFinal = clamp(
      config.playerArmor + config.defenseBonus + state.diamondShield,
      0,
      config.battleArmorCap
    );
    const chunkDamage = config.attackRawDamage / config.attackChunks;
    let passed = 0;
    let blocked = 0;
    let damage = 0;

    for (let i = 0; i < config.attackChunks; i += 1) {
      if (rng() < playerArmorFinal / 100) {
        blocked += 1;
      } else {
        passed += 1;
        damage += chunkDamage;
      }
    }

    state.playerHp = Math.max(0, state.playerHp - damage);
    log.push(`Босс атакует: прошло ${passed}, заблокировано ${blocked}, урон игроку ${round(damage)}. Защита игрока: ${round(playerArmorFinal, 2)}%.`);
    state.diamondShield = 0;
    state.attackCounter = config.attackInterval;
  }

  if (state.regenCounter <= 0 && state.bossHp > 0) {
    const heal = config.bossMaxHp * (config.regenPercent / 100);
    const before = state.bossHp;
    state.bossHp = Math.min(config.bossMaxHp, state.bossHp + heal);
    log.push(`Босс восстанавливает HP: +${round(state.bossHp - before)}.`);
    state.regenCounter = config.regenInterval;
  }
}

function reshuffleBoard(config, rng) {
  let board = createBoard(config.weights, rng);
  let guard = 0;
  while (getLegalMoves(board).length === 0 && guard < 20) {
    board = createBoard(config.weights, rng);
    guard += 1;
  }
  return board;
}

export function simulateBattle(config, options = {}) {
  const maxTurns = Math.max(1, Number(options.maxTurns) || 90);
  const seed = options.seed ?? 'battle';
  const rng = createRng(seed);
  let board = reshuffleBoard(config, rng);

  const state = {
    bossHp: config.bossMaxHp,
    playerHp: config.playerBattleHp,
    diamondShield: 0,
    armorBreak: 0,
    attackCounter: config.attackInterval,
    regenCounter: config.regenInterval,
    turn: 0
  };

  const log = [];
  let reshuffles = 0;

  while (state.turn < maxTurns && state.bossHp > 0 && state.playerHp > 0) {
    const move = chooseMove(board, config, state, rng);

    if (!move) {
      board = reshuffleBoard(config, rng);
      reshuffles += 1;
      log.push(`Нет доступных ходов. Поле перемешано. Всего перемешиваний: ${reshuffles}.`);
      continue;
    }

    swapInPlace(board, move.from, move.to);
    state.turn += 1;
    log.push(`Ход ${state.turn}: ${formatMove(move)}. Оценка хода: ${round(move.score, 1)}.`);

    const resolved = resolveBoardAfterMove(board, config, state, rng, log);
    log.push(`После хода ${state.turn}: HP босса ${round(state.bossHp)}/${config.bossMaxHp}, HP игрока ${round(state.playerHp)}/${config.playerBattleHp}, каскадов ${resolved.cascades}.`);

    if (state.bossHp <= 0) break;
    bossTurn(config, state, log, rng);
  }

  const win = state.bossHp <= 0 && state.playerHp > 0;
  const lose = state.playerHp <= 0;
  const timeout = !win && !lose;

  log.push(
    win
      ? `Победа на ${state.turn} ходу. Осталось HP игрока: ${round(state.playerHp)}.`
      : lose
        ? `Поражение на ${state.turn} ходу. У босса осталось HP: ${round(state.bossHp)}.`
        : `Лимит ходов (${maxTurns}) закончился. У босса осталось HP: ${round(state.bossHp)}, у игрока HP: ${round(state.playerHp)}.`
  );

  return {
    win,
    lose,
    timeout,
    turns: state.turn,
    finalBossHp: round(state.bossHp),
    finalPlayerHp: round(state.playerHp),
    finalBoard: board,
    reshuffles,
    log
  };
}

export function runAttempts(config, options = {}) {
  const attempts = clamp(Math.round(Number(options.attempts) || 100), 1, 5000);
  const maxTurns = Math.max(1, Number(options.maxTurns) || 90);
  const seed = options.seed ?? 'attempts';

  const results = [];
  let firstWinAttempt = null;
  let firstWinResult = null;
  let bestResult = null;

  for (let i = 1; i <= attempts; i += 1) {
    const result = simulateBattle(config, {
      maxTurns,
      seed: `${seed}-attempt-${i}`
    });
    results.push(result);

    if (result.win && firstWinAttempt === null) {
      firstWinAttempt = i;
      firstWinResult = result;
    }

    if (!bestResult) {
      bestResult = result;
    } else {
      const bestScore = (bestResult.win ? 100000 : 0) + bestResult.finalPlayerHp - bestResult.finalBossHp - bestResult.turns * 0.1;
      const score = (result.win ? 100000 : 0) + result.finalPlayerHp - result.finalBossHp - result.turns * 0.1;
      if (score > bestScore) bestResult = result;
    }
  }

  const wins = results.filter((r) => r.win).length;
  const losses = results.filter((r) => r.lose).length;
  const timeouts = results.filter((r) => r.timeout).length;
  const winResults = results.filter((r) => r.win);
  const avgTurns = winResults.length
    ? winResults.reduce((sum, r) => sum + r.turns, 0) / winResults.length
    : results.reduce((sum, r) => sum + r.turns, 0) / results.length;
  const avgPlayerHpOnWin = winResults.length
    ? winResults.reduce((sum, r) => sum + r.finalPlayerHp, 0) / winResults.length
    : 0;

  return {
    attempts,
    wins,
    losses,
    timeouts,
    winRate: round((wins / attempts) * 100, 1),
    firstWinAttempt,
    avgTurns: round(avgTurns, 1),
    avgPlayerHpOnWin: round(avgPlayerHpOnWin, 1),
    firstWinResult,
    bestResult,
    results
  };
}
