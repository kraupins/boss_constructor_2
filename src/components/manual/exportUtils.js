import { round } from '../../simulator.js';

export function buildExportPayload(config, simulation) {
  return {
    boss: {
      name: config.bossName,
      type: config.bossType.label,
      difficulty: config.difficulty.label,
      baseHp: config.baseBossHp,
      maxHp: config.bossMaxHp,
      armorPercent: config.bossArmor,
      targetTurns: config.targetTurns
    },
    bossAttack: {
      rawDamage: config.attackRawDamage,
      intervalTurns: config.attackInterval,
      chunks: config.attackChunks,
      regenIntervalTurns: config.regenInterval,
      regenPercent: round(config.regenPercent, 2)
    },
    player: {
      permanentHp: config.playerPermanentHp,
      battleHp: config.playerBattleHp,
      baseArmorPercent: config.playerArmor,
      strengthBonusPercent: config.strengthBonus,
      healthBonusPercent: config.healthBonus,
      defenseBonusPercent: config.defenseBonus,
      battleArmorCapPercent: config.battleArmorCap
    },
    tiles: {
      woodSwordDamage: config.swordDamage.wood,
      ironSwordDamage: config.swordDamage.iron,
      goldSwordDamage: config.swordDamage.gold,
      diamondSwordDamage: config.swordDamage.diamond,
      clayBallDamage: config.clayDamage,
      diamondShieldPerBallPercent: config.shieldPerBall,
      bedrockBreakPerBallPercent: config.bedrockBreakPerBall,
      spawnWeights: config.weights
    },
    simulation: simulation
      ? {
          attempts: simulation.attempts,
          wins: simulation.wins,
          losses: simulation.losses,
          timeouts: simulation.timeouts,
          winRatePercent: simulation.winRate,
          firstWinAttempt: simulation.firstWinAttempt,
          averageTurns: simulation.avgTurns,
          averagePlayerHpOnWin: simulation.avgPlayerHpOnWin
        }
      : null
  };
}

export function buildTextReport(config, simulation) {
  const payload = buildExportPayload(config, simulation);
  const lines = [];

  lines.push(`БОСС: ${payload.boss.name}`);
  lines.push(`Тип: ${payload.boss.type} · ${payload.boss.difficulty}`);
  lines.push(`HP: ${payload.boss.maxHp} · Броня: ${payload.boss.armorPercent}%`);
  lines.push(`Атака: ${payload.bossAttack.rawDamage} / ${payload.bossAttack.intervalTurns} х.`);
  lines.push(`Игрок: ${payload.player.battleHp} HP`);
  if (payload.simulation) {
    lines.push(`Win rate: ${payload.simulation.winRatePercent}% (${payload.simulation.wins}/${payload.simulation.attempts})`);
  }
  return lines.join('\n');
}
