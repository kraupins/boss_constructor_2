import { GENERATION_PRESETS, round } from './simulator.js';

export function getBalanceStatus(simulation) {
  if (!simulation) return { label: 'Нет данных', tone: 'default', text: 'Запусти симуляцию, чтобы оценить баланс.' };
  if (simulation.winRate === 0) return { label: 'Не проходится', tone: 'danger', text: 'Автобой ни разу не победил. Нужно ослабить босса или усилить игрока.' };
  if (simulation.winRate < 25) return { label: 'Очень сложно', tone: 'warning', text: 'Победы редкие. Подходит для хардкора, но не для обычного боя.' };
  if (simulation.winRate < 55) return { label: 'Сложно', tone: 'warning', text: 'Бой напряжённый. Хорошо для сложного босса.' };
  if (simulation.winRate <= 85) return { label: 'Нормально', tone: 'success', text: 'Баланс выглядит рабочим: победы есть, но не гарантированы.' };
  return { label: 'Слишком легко', tone: 'info', text: 'Автобой побеждает слишком часто. Можно усилить босса.' };
}

export function buildBalanceAdvice(config, simulation) {
  if (!simulation) {
    return [
      {
        title: 'Сначала запусти симуляцию',
        text: 'После прогона я покажу точечные правки: HP, броня, урон босса, реген, веса тайлов или параметры игрока.',
        impact: 'ожидание данных',
        tone: 'default'
      }
    ];
  }

  const advice = [];
  const winRate = simulation.winRate;
  const best = simulation.bestResult;
  const firstWin = simulation.firstWinResult;
  const avgTurns = Number(simulation.avgTurns) || 0;
  const targetTurns = config.targetTurns;

  if (winRate === 0) {
    const bossHpLeft = best ? Math.max(0, best.finalBossHp) : 0;
    const bossLeftPercent = config.bossMaxHp > 0 ? round((bossHpLeft / config.bossMaxHp) * 100, 1) : 0;

    if (bossLeftPercent > 35) {
      advice.push({
        title: 'Сильно завышено HP босса',
        text: `В лучшем забеге у босса осталось примерно ${bossLeftPercent}% HP. Снизь HP босса на 20–30% или увеличь урон мечей через меньшую целевую длину боя.`,
        impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.75)}`,
        tone: 'danger'
      });
    } else {
      advice.push({
        title: 'Босс почти проходится, но не хватает чуть-чуть урона',
        text: `В лучшем забеге у босса осталось ${bossHpLeft} HP. Снизь HP на 8–12% или дай игроку +5% силы.`,
        impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.9)}`,
        tone: 'warning'
      });
    }

    if (config.bossArmor >= 35) {
      advice.push({
        title: 'Слишком высокая броня босса',
        text: 'При броне 35%+ автобой часто теряет много урона на блоках. Уменьши броню на 5–10% или увеличь вес бедрок-шара.',
        impact: `Броня босса: ${config.bossArmor}% → ${Math.max(0, config.bossArmor - 8)}%`,
        tone: 'warning'
      });
    }

    if (config.regenPercent >= 5 && config.regenInterval <= 5) {
      advice.push({
        title: 'Реген слишком давит',
        text: 'Босс часто лечится и отматывает прогресс боя. Увеличь интервал регена на 1 ход или снизь процент лечения.',
        impact: `Реген: ${config.regenPercent}% / ${config.regenInterval} х. → ${round(config.regenPercent * 0.75, 2)}% / ${config.regenInterval + 1} х.`,
        tone: 'warning'
      });
    }

    if (best?.lose) {
      advice.push({
        title: 'Игрок умирает раньше, чем успевает добить босса',
        text: 'Уменьши урон босса, увеличь интервал атаки на 1 ход или дай игроку больше HP/защиты.',
        impact: `Атака босса: ${config.attackRawDamage} → ${Math.round(config.attackRawDamage * 0.85)}`,
        tone: 'danger'
      });
    }
  } else if (winRate < 45) {
    advice.push({
      title: 'Победы есть, но редкие',
      text: 'Для среднего уровня лучше поднять win rate примерно до 55–75%. Самый мягкий способ — чуть снизить HP босса или поднять вес мечей.',
      impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.92)}`,
      tone: 'warning'
    });

    if (avgTurns > targetTurns * 1.25) {
      advice.push({
        title: 'Бой слишком длинный',
        text: `Средняя длина победы ${avgTurns} ходов при цели ${targetTurns}. Уменьши целевую длину боя или HP босса.`,
        impact: `TargetTurns: ${targetTurns} → ${Math.max(8, Math.round(targetTurns * 0.85))}`,
        tone: 'warning'
      });
    }
  } else if (winRate > 85) {
    advice.push({
      title: 'Босс слишком лёгкий',
      text: 'Автобой побеждает слишком стабильно. Усиль босса через HP, броню или урон атаки.',
      impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 1.15)}`,
      tone: 'info'
    });

    if (firstWin && firstWin.finalPlayerHp > config.playerBattleHp * 0.55) {
      advice.push({
        title: 'Игрок заканчивает бой с большим запасом HP',
        text: 'Подними урон босса на 10–15% или сократи интервал атаки, если хочешь больше напряжения.',
        impact: `Атака босса: ${config.attackRawDamage} → ${Math.round(config.attackRawDamage * 1.12)}`,
        tone: 'info'
      });
    }
  } else {
    advice.push({
      title: 'Баланс выглядит рабочим',
      text: 'Можно оставить текущие значения. Для точной настройки смотри среднюю длину боя и остаток HP игрока при победе.',
      impact: 'правки не обязательны',
      tone: 'success'
    });
  }

  if (simulation.timeouts > simulation.losses && simulation.timeouts > simulation.wins * 0.5) {
    advice.push({
      title: 'Много таймаутов',
      text: 'Бой часто упирается в лимит ходов. Увеличь лимит ходов, снизь HP босса или уменьши реген.',
      impact: `MaxTurns: попробуй ${Math.round(config.targetTurns * 4)}`,
      tone: 'warning'
    });
  }

  if (config.attackInterval <= 3 && config.attackRawDamage > config.playerBattleHp * 0.22) {
    advice.push({
      title: 'Атака босса может быть слишком резкой',
      text: 'Босс бьёт часто и больно. Это нормально для агрессивного босса, но для обычного может быть душно.',
      impact: `Интервал атаки: ${config.attackInterval} → ${config.attackInterval + 1}`,
      tone: 'warning'
    });
  }

  if (advice.length === 0) {
    advice.push({
      title: 'Нет критичных проблем',
      text: 'Симуляция не нашла очевидных перекосов. Можно дальше тестировать вручную.',
      impact: 'без изменений',
      tone: 'success'
    });
  }

  return advice.slice(0, 5);
}

function inferPresetStage(config) {
  const hp = config.baseBossHp;
  const stages = ['early', 'middle', 'late', 'final'];
  for (const stageId of stages) {
    const preset = GENERATION_PRESETS[stageId];
    if (hp >= preset.hp[0] && hp <= preset.hp[1]) return preset;
  }
  if (hp < GENERATION_PRESETS.early.hp[0]) return GENERATION_PRESETS.early;
  return GENERATION_PRESETS.final;
}

function estimateFightMetrics(config, form) {
  const maxTurns = Math.max(20, Number(form.maxTurns) || 90);
  const armorFactor = Math.max(0.05, 1 - config.bossArmor / 100);
  const avgSwordPerTurn = 4.5;
  const damagePerTurn = (config.bossMaxHp / (config.targetTurns * avgSwordPerTurn * armorFactor)) * avgSwordPerTurn * armorFactor;
  const estimatedKillTurns = config.bossMaxHp / Math.max(1, damagePerTurn);
  const attacksInFight = Math.floor(maxTurns / config.attackInterval);
  const bossDamageTotal = attacksInFight * config.attackRawDamage;
  const regenTicks = Math.floor(maxTurns / config.regenInterval);
  const regenTotal = regenTicks * config.bossMaxHp * (config.regenPercent / 100);

  return {
    maxTurns,
    estimatedKillTurns: round(estimatedKillTurns, 1),
    bossDamageTotal: round(bossDamageTotal, 0),
    regenTotal: round(regenTotal, 0),
    attacksInFight
  };
}

export function getFormulaHints(step, config, form) {
  const hints = [];
  const metrics = estimateFightMetrics(config, form);

  if (step === 0) {
    hints.push({
      title: 'Множители сложности',
      text: `HP ×${config.difficulty.hpMul}, урон босса ×${config.difficulty.bossDamageMul}, целевой бой ~${config.difficulty.targetTurns} ходов.`,
      tone: 'info'
    });
    hints.push({
      title: 'Архетип босса',
      text: `${config.bossType.label}: броня ${config.bossType.armor}%, атака раз в ${config.bossType.attackInterval} х., реген ${config.bossType.regenPercent}%.`,
      tone: 'info'
    });
    hints.push({
      title: 'Оценка проходимости',
      text: 'Введите HP на следующем шаге — тогда сможем сравнить урон мечей, давление босса и лимит ходов.',
      tone: 'default'
    });
    return hints;
  }

  if (step >= 1) {
    const preset = inferPresetStage(config);
    if (preset.hp && (config.baseBossHp < preset.hp[0] || config.baseBossHp > preset.hp[1])) {
      hints.push({
        title: 'HP вне типичного диапазона этапа',
        text: `Для «${preset.label}» обычно ${preset.hp[0]}–${preset.hp[1]} базового HP. Сейчас ${config.baseBossHp} → итого ${config.bossMaxHp}.`,
        tone: 'info'
      });
    }

    hints.push({
      title: 'Целевая длина боя',
      text: `Мечи настроены убивать босса примерно за ${config.targetTurns} ходов (оценка формул: ~${metrics.estimatedKillTurns} х.).`,
      tone: Math.abs(metrics.estimatedKillTurns - config.targetTurns) > config.targetTurns * 0.35 ? 'warning' : 'info'
    });

    if (metrics.estimatedKillTurns > metrics.maxTurns * 0.85) {
      hints.push({
        title: 'Бой может не уложиться в лимит',
        text: `Оценка длины ~${metrics.estimatedKillTurns} ходов при лимите ${metrics.maxTurns}. Снизь HP на ~${Math.round((1 - metrics.maxTurns * 0.8 / metrics.estimatedKillTurns) * 100)}% или уменьши targetTurns.`,
        impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * (metrics.maxTurns * 0.8 / metrics.estimatedKillTurns))}`,
        tone: 'danger'
      });
    }
  }

  if (step >= 2) {
    const survivalRatio = metrics.bossDamageTotal / Math.max(1, config.playerBattleHp);
    if (survivalRatio > 1.15) {
      hints.push({
        title: 'Игрок может не выжить',
        text: `За ${metrics.maxTurns} ходов босс нанесёт ~${metrics.bossDamageTotal} урона при ${config.playerBattleHp} HP боя. Уменьши урон босса или усиль защиту/HP.`,
        impact: `Атака: ${config.attackRawDamage} → ${Math.round(config.attackRawDamage * 0.88)}`,
        tone: 'danger'
      });
    } else if (survivalRatio < 0.55) {
      hints.push({
        title: 'Давление босса слабое',
        text: `Ожидаемый урон босса ~${metrics.bossDamageTotal} — игроку может быть слишком легко. Можно усилить атаку или сократить интервал.`,
        tone: 'info'
      });
    }
  }

  if (step >= 3) {
    if (config.bossArmor >= 35 && (config.weights?.bedrock ?? 12) < 14) {
      hints.push({
        title: 'Высокая броня без антиброни',
        text: 'При броне 35%+ полезно поднять вес бедрок-шара, иначе мечи теряют много урона.',
        impact: `Вес bedrock: ${config.weights.bedrock} → ${Math.min(20, config.weights.bedrock + 4)}`,
        tone: 'warning'
      });
    }

    if (config.regenPercent >= 5 && config.regenInterval <= 5) {
      const regenPerFight = metrics.regenTotal;
      const regenPercentOfBoss = config.bossMaxHp > 0 ? round((regenPerFight / config.bossMaxHp) * 100, 1) : 0;
      hints.push({
        title: 'Реген откатывает прогресс',
        text: `За бой босс может восстановить ~${regenPerFight} HP (${regenPercentOfBoss}% от MaxHP). Увеличь интервал или снизь %.`,
        impact: `Реген: ${round(config.regenPercent, 2)}% → ${round(config.regenPercent * 0.75, 2)}%`,
        tone: 'warning'
      });
    }

    if (config.attackInterval <= 3 && config.attackRawDamage > config.playerBattleHp * 0.22) {
      hints.push({
        title: 'Резкая атака босса',
        text: 'Частые удары с высоким уроном — для обычного боя может быть душно.',
        tone: 'warning'
      });
    }
  }

  if (step >= 4) {
    const weightTotal = Object.values(config.weights).reduce((sum, value) => sum + value, 0);
    if (weightTotal < 80 || weightTotal > 140) {
      hints.push({
        title: 'Веса тайлов перекошены',
        text: `Сумма весов ${round(weightTotal, 1)} — обычно держат около 100. Проверь, что мечи и шары не выпали из спавна.`,
        tone: 'warning'
      });
    }

    if (metrics.maxTurns < config.targetTurns * 2.5) {
      hints.push({
        title: 'Мало ходов на забег',
        text: `Лимит ${metrics.maxTurns} ходов мал для цели ${config.targetTurns}. Рекомендуем ~${Math.round(config.targetTurns * 3.5)}–${Math.round(config.targetTurns * 4.5)}.`,
        impact: `MaxTurns: ${metrics.maxTurns} → ${Math.round(config.targetTurns * 4)}`,
        tone: 'warning'
      });
    }
  }

  return hints;
}

function dedupeHints(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mergeWizardSidebar({ step, config, form, quickSimulation, isSimulating }) {
  const formulaHints = getFormulaHints(step, config, form);
  const status = quickSimulation ? getBalanceStatus(quickSimulation) : getBalanceStatus(null);
  const simAdvice = quickSimulation && step >= 2 ? buildBalanceAdvice(config, quickSimulation) : [];

  const hints = dedupeHints([
    ...formulaHints,
    ...simAdvice.map((item) => ({ ...item, tone: item.tone ?? (quickSimulation?.winRate === 0 ? 'danger' : 'warning') }))
  ]).slice(0, 6);

  return {
    status: step >= 2 && quickSimulation ? status : step === 0
      ? { label: 'Ждём HP', tone: 'default', text: 'На шаге HP появится оценка проходимости по формулам.' }
      : { label: 'По формулам', tone: 'default', text: 'Быстрая симуляция доступна после ввода статов игрока.' },
    hints,
    isSimulating,
    canQuickSim: step >= 2
  };
}

export function canWizardProceed(step, form) {
  if (step === 0) return Boolean(form.bossName?.trim());
  if (step === 1) return Number(form.bossHp) > 0;
  if (step === 2) return Number(form.playerPermanentHp) > 0;
  return true;
}
