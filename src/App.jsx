import React, { useMemo, useState } from 'react';
import {
  BOSS_TYPES,
  DIFFICULTIES,
  DEFAULT_WEIGHTS,
  GENERATION_PRESETS,
  MATCH_MULTIPLIERS,
  TILES,
  calculateConfig,
  createDefaultForm,
  createPlayerBattle,
  generateRandomBossForm,
  getPlayerHint,
  reshufflePlayerBattle,
  round,
  runAttempts,
  togglePlayerSelection
} from './simulator.js';

const numberInputProps = {
  type: 'number',
  step: 'any'
};

const TABS = [
  { id: 'builder', label: 'Конструктор' },
  { id: 'generator', label: 'Генератор' },
  { id: 'stats', label: 'Статы' },
  { id: 'simulation', label: 'Симуляция' },
  { id: 'play', label: 'Трай пользователя' },
  { id: 'summary', label: 'Итог' },
  { id: 'formulas', label: 'Формулы' }
];

function updateNestedWeight(form, tileId, value) {
  return {
    ...form,
    weights: {
      ...form.weights,
      [tileId]: value
    }
  };
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}


function AutoNumberField({ label, value, autoValue, hint, onChange }) {
  const isAuto = value === '' || value === null || value === undefined;
  const displayAuto = typeof autoValue === 'number' ? round(autoValue, 2) : autoValue;

  return (
    <label className={`field auto-field ${isAuto ? 'is-auto' : 'is-manual'}`}>
      <span className="field-label">{label}</span>
      <div className="auto-input-row">
        <input
          {...numberInputProps}
          placeholder={`auto: ${displayAuto}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={isAuto ? 'tiny-button lock' : 'tiny-button'}
          onClick={() => onChange(isAuto ? String(displayAuto) : '')}
          title={isAuto ? 'Записать текущее auto-значение как ручное' : 'Очистить поле и снова считать автоматически'}
        >
          {isAuto ? 'Зафикс.' : 'Auto'}
        </button>
      </div>
      <span className="field-hint">
        {isAuto ? `Сейчас auto: ${displayAuto}. ${hint ?? ''}` : `Ручное значение. Auto было бы: ${displayAuto}.`}
      </span>
    </label>
  );
}

function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="section-title">
      {eyebrow ? <p className="eyebrow small">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {text ? <p className="muted section-text">{text}</p> : null}
    </div>
  );
}

function TileBadge({ tileId }) {
  const tile = TILES[tileId];
  return (
    <span
      className="tile-badge"
      style={{ background: tile.color, color: tile.textColor }}
      title={tile.label}
    >
      {tile.short}
    </span>
  );
}

function BoardView({ board }) {
  if (!board) return null;
  return (
    <div className="board">
      {board.flatMap((row, rowIndex) =>
        row.map((tileId, colIndex) => (
          <div className="board-cell" key={`${rowIndex}-${colIndex}`}>
            <TileBadge tileId={tileId} />
          </div>
        ))
      )}
    </div>
  );
}

function Table({ rows }) {
  return (
    <table className="table">
      <tbody>
        {rows.map(([name, value, hint]) => (
          <tr key={name}>
            <th>{name}</th>
            <td>
              <div>{value}</div>
              {hint ? <small>{hint}</small> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TileTable({ config }) {
  const rows = [
    ['wood', `${config.swordDamage.wood} урона за тайл`, 'Базовый частый урон'],
    ['iron', `${config.swordDamage.iron} урона за тайл`, 'Средний урон'],
    ['gold', `${config.swordDamage.gold} урона за тайл`, 'Высокий урон'],
    ['diamond', `${config.swordDamage.diamond} урона за тайл`, 'Самый сильный меч'],
    ['clay', `${config.clayDamage} чистого урона за тайл`, 'Игнорирует броню босса'],
    ['shield', `+${config.shieldPerBall}% защиты за тайл`, 'Копится до атаки босса'],
    ['bedrock', `-${config.bedrockBreakPerBall}% брони босса за тайл`, 'Копится до урона мечами']
  ];

  return (
    <table className="table tile-table">
      <thead>
        <tr>
          <th>Тайл</th>
          <th>Расчётный эффект</th>
          <th>Вес спавна</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([tileId, effect, hint]) => (
          <tr key={tileId}>
            <td>
              <TileBadge tileId={tileId} /> {TILES[tileId].label}
            </td>
            <td>
              <div>{effect}</div>
              <small>{hint}</small>
            </td>
            <td>{config.weights[tileId]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FormulaList({ formulas }) {
  return (
    <div className="formula-list">
      {formulas.map((formula) => (
        <code key={formula}>{formula}</code>
      ))}
    </div>
  );
}

function getBalanceStatus(simulation) {
  if (!simulation) return { label: 'Нет данных', tone: 'default', text: 'Запусти симуляцию, чтобы оценить баланс.' };
  if (simulation.winRate === 0) return { label: 'Не проходится', tone: 'danger', text: 'Автобой ни разу не победил. Нужно ослабить босса или усилить игрока.' };
  if (simulation.winRate < 25) return { label: 'Очень сложно', tone: 'warning', text: 'Победы редкие. Подходит для хардкора, но не для обычного боя.' };
  if (simulation.winRate < 55) return { label: 'Сложно', tone: 'warning', text: 'Бой напряжённый. Хорошо для сложного босса.' };
  if (simulation.winRate <= 85) return { label: 'Нормально', tone: 'success', text: 'Баланс выглядит рабочим: победы есть, но не гарантированы.' };
  return { label: 'Слишком легко', tone: 'info', text: 'Автобой побеждает слишком часто. Можно усилить босса.' };
}

function buildBalanceAdvice(config, simulation) {
  if (!simulation) {
    return [
      {
        title: 'Сначала запусти симуляцию',
        text: 'После прогона я покажу точечные правки: HP, броня, урон босса, реген, веса тайлов или параметры игрока.',
        impact: 'ожидание данных'
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
        impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.75)}`
      });
    } else {
      advice.push({
        title: 'Босс почти проходится, но не хватает чуть-чуть урона',
        text: `В лучшем забеге у босса осталось ${bossHpLeft} HP. Снизь HP на 8–12% или дай игроку +5% силы.`,
        impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.9)}`
      });
    }

    if (config.bossArmor >= 35) {
      advice.push({
        title: 'Слишком высокая броня босса',
        text: 'При броне 35%+ автобой часто теряет много урона на блоках. Уменьши броню на 5–10% или увеличь вес бедрок-шара.',
        impact: `Броня босса: ${config.bossArmor}% → ${Math.max(0, config.bossArmor - 8)}%`
      });
    }

    if (config.regenPercent >= 5 && config.regenInterval <= 5) {
      advice.push({
        title: 'Реген слишком давит',
        text: 'Босс часто лечится и отматывает прогресс боя. Увеличь интервал регена на 1 ход или снизь процент лечения.',
        impact: `Реген: ${config.regenPercent}% / ${config.regenInterval} х. → ${round(config.regenPercent * 0.75, 2)}% / ${config.regenInterval + 1} х.`
      });
    }

    if (best?.lose) {
      advice.push({
        title: 'Игрок умирает раньше, чем успевает добить босса',
        text: 'Уменьши урон босса, увеличь интервал атаки на 1 ход или дай игроку больше HP/защиты.',
        impact: `Атака босса: ${config.attackRawDamage} → ${Math.round(config.attackRawDamage * 0.85)}`
      });
    }
  } else if (winRate < 45) {
    advice.push({
      title: 'Победы есть, но редкие',
      text: 'Для среднего уровня лучше поднять win rate примерно до 55–75%. Самый мягкий способ — чуть снизить HP босса или поднять вес мечей.',
      impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 0.92)}`
    });

    if (avgTurns > targetTurns * 1.25) {
      advice.push({
        title: 'Бой слишком длинный',
        text: `Средняя длина победы ${avgTurns} ходов при цели ${targetTurns}. Уменьши целевую длину боя или HP босса.`,
        impact: `TargetTurns: ${targetTurns} → ${Math.max(8, Math.round(targetTurns * 0.85))}`
      });
    }
  } else if (winRate > 85) {
    advice.push({
      title: 'Босс слишком лёгкий',
      text: 'Автобой побеждает слишком стабильно. Усиль босса через HP, броню или урон атаки.',
      impact: `BossHP: ${config.bossMaxHp} → ${Math.round(config.bossMaxHp * 1.15)}`
    });

    if (firstWin && firstWin.finalPlayerHp > config.playerBattleHp * 0.55) {
      advice.push({
        title: 'Игрок заканчивает бой с большим запасом HP',
        text: 'Подними урон босса на 10–15% или сократи интервал атаки, если хочешь больше напряжения.',
        impact: `Атака босса: ${config.attackRawDamage} → ${Math.round(config.attackRawDamage * 1.12)}`
      });
    }
  } else {
    advice.push({
      title: 'Баланс выглядит рабочим',
      text: 'Можно оставить текущие значения. Для точной настройки смотри среднюю длину боя и остаток HP игрока при победе.',
      impact: 'правки не обязательны'
    });
  }

  if (simulation.timeouts > simulation.losses && simulation.timeouts > simulation.wins * 0.5) {
    advice.push({
      title: 'Много таймаутов',
      text: 'Бой часто упирается в лимит ходов. Увеличь лимит ходов, снизь HP босса или уменьши реген.',
      impact: `MaxTurns: попробуй ${Math.round(config.targetTurns * 4)}`
    });
  }

  if (config.attackInterval <= 3 && config.attackRawDamage > config.playerBattleHp * 0.22) {
    advice.push({
      title: 'Атака босса может быть слишком резкой',
      text: 'Босс бьёт часто и больно. Это нормально для агрессивного босса, но для обычного может быть душно.',
      impact: `Интервал атаки: ${config.attackInterval} → ${config.attackInterval + 1}`
    });
  }

  if (advice.length === 0) {
    advice.push({
      title: 'Нет критичных проблем',
      text: 'Симуляция не нашла очевидных перекосов. Можно дальше тестировать вручную.',
      impact: 'без изменений'
    });
  }

  return advice.slice(0, 5);
}

function AdvicePanel({ config, simulation }) {
  const status = getBalanceStatus(simulation);
  const advice = buildBalanceAdvice(config, simulation);

  return (
    <section className="panel advice-panel">
      <div className="panel-title-row top-align">
        <div>
          <SectionTitle
            eyebrow="помощник баланса"
            title="Точечные рекомендации"
            text="Появляются после симуляции и подсказывают, что именно поменять."
          />
        </div>
        <span className={`status-pill ${status.tone}`}>{status.label}</span>
      </div>
      <p className="status-text">{status.text}</p>
      <div className="advice-list">
        {advice.map((item) => (
          <div className="advice-item" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
            <span>{item.impact}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimulationResult({ result }) {
  if (!result) {
    return <div className="empty-box">Нажми «Запустить симуляцию», чтобы прогнать автобой.</div>;
  }

  const selectedLog = result.firstWinResult?.log ?? result.bestResult?.log ?? [];
  const selectedBoard = result.firstWinResult?.finalBoard ?? result.bestResult?.finalBoard;

  return (
    <div className="simulation-result">
      <div className="stat-grid four">
        <StatCard label="Попыток" value={result.attempts} />
        <StatCard label="Побед" value={`${result.wins} / ${result.attempts}`} hint={`${result.winRate}%`} tone={result.winRate === 0 ? 'danger' : result.winRate < 45 ? 'warning' : 'success'} />
        <StatCard
          label="Первая победа"
          value={result.firstWinAttempt ? `#${result.firstWinAttempt}` : 'Нет'}
          hint={result.firstWinAttempt ? 'на этой попытке автобой победил впервые' : 'баланс слишком жёсткий или мало попыток'}
        />
        <StatCard label="Средняя длина" value={`${result.avgTurns} ходов`} />
      </div>

      <div className="stat-grid three compact">
        <StatCard label="Поражений" value={result.losses} />
        <StatCard label="Таймаутов" value={result.timeouts} />
        <StatCard label="Среднее HP игрока при победе" value={result.avgPlayerHpOnWin} />
      </div>

      <div className="split">
        <section className="panel small-panel">
          <h3>Финальное поле выбранного забега</h3>
          <BoardView board={selectedBoard} />
        </section>
        <section className="panel log-panel">
          <h3>Лог выбранного забега</h3>
          <div className="log">
            {selectedLog.slice(-90).map((line, index) => (
              <div key={`${index}-${line}`}>{line}</div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BuilderTab({ form, setForm, setValue, resetWeights, autoConfig }) {
  return (
    <div className="tab-grid">
      <section className="panel">
        <SectionTitle eyebrow="шаг 1" title="Босс" text="Основные входные данные. Пустые поля считаются автоматически от типа босса." />
        <div className="fields-grid two">
          <Field label="Название босса">
            <input value={form.bossName} onChange={(e) => setValue('bossName', e.target.value)} />
          </Field>
          <Field label="Базовое HP босса">
            <input {...numberInputProps} value={form.bossHp} onChange={(e) => setValue('bossHp', e.target.value)} />
          </Field>
          <Field label="Тип босса">
            <select value={form.bossType} onChange={(e) => setValue('bossType', e.target.value)}>
              {Object.values(BOSS_TYPES).map((type) => (
                <option value={type.id} key={type.id}>{type.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Сложность">
            <select value={form.difficulty} onChange={(e) => setValue('difficulty', e.target.value)}>
              {Object.values(DIFFICULTIES).map((difficulty) => (
                <option value={difficulty.id} key={difficulty.id}>{difficulty.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="опционально" title="Тонкая настройка босса" text="Можно оставить auto, если нужен быстрый расчёт по типу босса." />
        <div className="fields-grid three">
          <AutoNumberField
            label="Броня босса, %"
            value={form.bossArmor}
            autoValue={autoConfig.bossArmor}
            hint="Из типа босса + поправка сложности."
            onChange={(value) => setValue('bossArmor', value)}
          />
          <AutoNumberField
            label="Атака раз в N ходов"
            value={form.attackInterval}
            autoValue={autoConfig.attackInterval}
            hint="Из типа босса + поправка сложности."
            onChange={(value) => setValue('attackInterval', value)}
          />
          <AutoNumberField
            label="Части атаки"
            value={form.attackChunks}
            autoValue={autoConfig.attackChunks}
            hint="Чем больше частей, тем меньше резкого рандома."
            onChange={(value) => setValue('attackChunks', value)}
          />
          <AutoNumberField
            label="Реген раз в N ходов"
            value={form.regenInterval}
            autoValue={autoConfig.regenInterval}
            hint="Из типа босса + поправка сложности."
            onChange={(value) => setValue('regenInterval', value)}
          />
          <AutoNumberField
            label="Реген, % от MaxHP"
            value={form.regenPercent}
            autoValue={autoConfig.regenPercent}
            hint="Авто уже учитывает множитель сложности."
            onChange={(value) => setValue('regenPercent', value)}
          />
          <AutoNumberField
            label="Целевая длина боя"
            value={form.targetTurns}
            autoValue={autoConfig.targetTurns}
            hint="Меньше ходов = выше урон мечей."
            onChange={(value) => setValue('targetTurns', value)}
          />
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="шаг 2" title="Игрок" text="Эти значения нужны, чтобы босс считал урон и выживаемость относительно игрока." />
        <div className="fields-grid three">
          <Field label="Постоянное HP игрока" hint="100–3000">
            <input {...numberInputProps} value={form.playerPermanentHp} onChange={(e) => setValue('playerPermanentHp', e.target.value)} />
          </Field>
          <Field label="Броня игрока, %" hint="0–50">
            <input {...numberInputProps} value={form.playerArmor} onChange={(e) => setValue('playerArmor', e.target.value)} />
          </Field>
          <Field label="Бонус силы, %" hint="0–25">
            <input {...numberInputProps} value={form.strengthBonus} onChange={(e) => setValue('strengthBonus', e.target.value)} />
          </Field>
          <Field label="Бонус здоровья, %" hint="0–20">
            <input {...numberInputProps} value={form.healthBonus} onChange={(e) => setValue('healthBonus', e.target.value)} />
          </Field>
          <Field label="Бонус защиты, %" hint="0–25">
            <input {...numberInputProps} value={form.defenseBonus} onChange={(e) => setValue('defenseBonus', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="шаг 3" title="Симуляция" text="Повторный запуск использует новый внутренний seed, поэтому можно гонять тесты с теми же настройками." />
        <div className="fields-grid three">
          <Field label="Попыток автобоя">
            <input {...numberInputProps} value={form.attempts} onChange={(e) => setValue('attempts', e.target.value)} />
          </Field>
          <Field label="Лимит ходов на забег">
            <input {...numberInputProps} value={form.maxTurns} onChange={(e) => setValue('maxTurns', e.target.value)} />
          </Field>
          <Field label="Seed">
            <input value={form.seed} onChange={(e) => setValue('seed', e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="panel full-span">
        <div className="panel-title-row">
          <SectionTitle eyebrow="спавн" title="Веса тайлов" text="Чем выше число, тем чаще тайл появляется на поле." />
          <button className="secondary-button" onClick={resetWeights}>Сбросить веса</button>
        </div>
        <div className="weight-grid">
          {Object.values(TILES).map((tile) => (
            <Field label={tile.label} key={tile.id}>
              <div className="weight-field">
                <TileBadge tileId={tile.id} />
                <input
                  {...numberInputProps}
                  value={form.weights[tile.id]}
                  onChange={(e) => setForm((current) => updateNestedWeight(current, tile.id, e.target.value))}
                />
              </div>
            </Field>
          ))}
        </div>
      </section>
    </div>
  );
}

function GeneratorTab({ form, generatorOptions, setGeneratorOptions, config, onGenerate, onGenerateAndSimulate, onSimulate, onPlay, generationMessage }) {
  const preset = GENERATION_PRESETS[generatorOptions.preset] ?? GENERATION_PRESETS.random;

  return (
    <div className="tab-grid one">
      <section className="panel generator-hero-panel">
        <div className="panel-title-row top-align">
          <div>
            <SectionTitle
              eyebrow="генератор"
              title="Случайный босс за один клик"
              text="Выбери этап игры и ограничения, нажми генерацию — конструктор заполнит название, тип, сложность, HP, броню, атаку, реген, игрока и веса тайлов. Все поля потом можно вручную поправить."
            />
            <div className="generator-hint-box">
              <strong>{preset.label}</strong>
              <span>{preset.hint}</span>
            </div>
          </div>
          <div className="actions-row wrap">
            <button className="secondary-button" onClick={onGenerateAndSimulate}>Сгенерировать и проверить</button>
            <button className="primary-button large" onClick={onGenerate}>Сгенерировать босса</button>
          </div>
        </div>

        {generationMessage ? <div className="copy-status generator-message">{generationMessage}</div> : null}

        <div className="fields-grid three generator-controls">
          <Field label="Этап босса" hint="Влияет на диапазон HP, игрока, длительность боя и силу давления.">
            <select
              value={generatorOptions.preset}
              onChange={(e) => setGeneratorOptions((current) => ({ ...current, preset: e.target.value }))}
            >
              {Object.values(GENERATION_PRESETS).map((item) => (
                <option value={item.id} key={item.id}>{item.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Сложность" hint="Можно оставить случайной или зафиксировать.">
            <select
              value={generatorOptions.difficulty}
              onChange={(e) => setGeneratorOptions((current) => ({ ...current, difficulty: e.target.value }))}
            >
              <option value="random">Случайная</option>
              {Object.values(DIFFICULTIES).map((difficulty) => (
                <option value={difficulty.id} key={difficulty.id}>{difficulty.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Тип босса" hint="Можно оставить случайным или выбрать архетип.">
            <select
              value={generatorOptions.bossType}
              onChange={(e) => setGeneratorOptions((current) => ({ ...current, bossType: e.target.value }))}
            >
              <option value="random">Случайный</option>
              {Object.values(BOSS_TYPES).map((type) => (
                <option value={type.id} key={type.id}>{type.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="текущий результат" title="Сгенерированный босс" text="Это уже итоговые значения с учётом сложности. Их можно проверять автосимуляцией или играть руками." />
        <div className="generator-result-grid">
          <StatCard label="Название" value={config.bossName} hint={`${config.bossType.label} / ${config.difficulty.label}`} />
          <StatCard label="HP / броня" value={`${config.bossMaxHp} / ${config.bossArmor}%`} hint={`базовое HP: ${config.baseBossHp}`} />
          <StatCard label="Атака" value={config.attackRawDamage} hint={`раз в ${config.attackInterval} хода, частей: ${config.attackChunks}`} />
          <StatCard label="Реген" value={`${round(config.regenPercent, 2)}%`} hint={`раз в ${config.regenInterval} хода`} />
          <StatCard label="Цель боя" value={`${config.targetTurns} ходов`} hint={`лимит симуляции: ${form.maxTurns}`} />
          <StatCard label="Игрок" value={`${config.playerBattleHp} HP`} hint={`броня ${config.playerArmor}%, сила +${config.strengthBonus}%`} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-title-row top-align">
          <SectionTitle eyebrow="быстрые действия" title="Что делать после генерации" text="Лучший цикл: сгенерировать → прогнать симуляцию → посмотреть советы → сыграть руками → скопировать итог." />
          <div className="actions-row wrap">
            <button className="secondary-button" onClick={onGenerate}>Сгенерировать другой вариант</button>
            <button className="secondary-button" onClick={onPlay}>Сыграть трай</button>
            <button className="primary-button" onClick={onSimulate}>Запустить симуляцию</button>
          </div>
        </div>
        <div className="info-grid generator-tips">
          <div>
            <strong>Ранний</strong>
            <p>Меньше HP и мягкая атака. Хорош для первых глав и обучения.</p>
          </div>
          <div>
            <strong>Средний</strong>
            <p>Базовый баланс: уже важны шары защиты и снижение брони.</p>
          </div>
          <div>
            <strong>Поздний</strong>
            <p>Больше броня, реген и длина боя. Требует развитого игрока.</p>
          </div>
          <div>
            <strong>Финальный</strong>
            <p>Длинный бой с высоким давлением. После генерации обязательно проверять симуляцией.</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="тайлы" title="Веса и эффекты текущего босса" />
        <TileTable config={config} />
      </section>
    </div>
  );
}


function StatsTab({ config }) {
  const bossRows = [
    ['Название', config.bossName],
    ['Тип', config.bossType.label],
    ['Сложность', config.difficulty.label],
    ['Базовое HP', config.baseBossHp],
    ['HP после сложности', config.bossMaxHp, `множитель сложности ×${config.difficulty.hpMul}`],
    ['Броня', `${config.bossArmor}%`, 'кап 50%'],
    ['Цель длины боя', `${config.targetTurns} ходов`]
  ];

  const attackRows = [
    ['Урон атаки босса', config.attackRawDamage],
    ['Интервал атаки', `раз в ${config.attackInterval} хода`],
    ['Части атаки', config.attackChunks, 'каждая часть отдельно проверяется бронёй игрока'],
    ['Реген', `раз в ${config.regenInterval} хода по ${round(config.regenPercent, 2)}%`]
  ];

  const playerRows = [
    ['Постоянное HP', `${config.playerPermanentHp}/${config.permanentHpCap}`],
    ['HP в бою', `${config.playerBattleHp}/${config.battleHpCap}`],
    ['Броня игрока', `${config.playerArmor}%/${config.permanentArmorCap}%`],
    ['Бонус силы', `${config.strengthBonus}%/${config.strengthCap}%`],
    ['Бонус здоровья', `${config.healthBonus}%`],
    ['Бонус защиты', `${config.defenseBonus}%`],
    ['Кап боевой брони', `${config.battleArmorCap}%`]
  ];

  return (
    <div className="tab-grid">
      <section className="panel">
        <SectionTitle eyebrow="босс" title="Основные статы" />
        <Table rows={bossRows} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="босс" title="Атака и реген" />
        <Table rows={attackRows} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="игрок" title="Статы игрока" />
        <Table rows={playerRows} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="тайлы" title="Мечи и шары" />
        <TileTable config={config} />
      </section>
      <section className="panel full-span">
        <SectionTitle eyebrow="матчи" title="Множители совпадений" />
        <div className="multiplier-row">
          {MATCH_MULTIPLIERS.map((item) => (
            <div className="multiplier-card" key={item.min}>
              <span>{item.min}+ тайла</span>
              <strong>×{item.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SimulationTab({ config, simulation, onSimulate, runIndex }) {
  return (
    <div className="tab-grid one">
      <AdvicePanel config={config} simulation={simulation} />
      <section className="panel result-panel">
        <div className="panel-title-row top-align">
          <div>
            <SectionTitle
              eyebrow="автобой"
              title="Автосимуляция забегов"
              text="Автобой проверяет доступные swap-ы, оценивает пользу хода и выбирает лучший с небольшим рандомом."
            />
            <p className="muted">Запуск №{runIndex}. Повторный запуск оставляет настройки теми же, но делает новый прогон.</p>
          </div>
          <div className="actions-row">
            <button className="secondary-button" onClick={onSimulate}>Перезапустить</button>
            <button className="primary-button" onClick={onSimulate}>Запустить симуляцию</button>
          </div>
        </div>
        <SimulationResult result={simulation} />
      </section>
    </div>
  );
}


function buildExportPayload(config, simulation) {
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

function buildTextReport(config, simulation) {
  const payload = buildExportPayload(config, simulation);
  const lines = [];

  lines.push(`БОСС: ${payload.boss.name}`);
  lines.push(`Тип: ${payload.boss.type}`);
  lines.push(`Сложность: ${payload.boss.difficulty}`);
  lines.push('');
  lines.push('ОСНОВНЫЕ СТАТЫ БОССА');
  lines.push(`HP: ${payload.boss.maxHp} (база: ${payload.boss.baseHp})`);
  lines.push(`Броня: ${payload.boss.armorPercent}%`);
  lines.push(`Целевая длина боя: ${payload.boss.targetTurns} ходов`);
  lines.push('');
  lines.push('АТАКА И РЕГЕН БОССА');
  lines.push(`Урон атаки: ${payload.bossAttack.rawDamage}`);
  lines.push(`Интервал атаки: раз в ${payload.bossAttack.intervalTurns} хода`);
  lines.push(`Части атаки: ${payload.bossAttack.chunks}`);
  lines.push(`Реген: раз в ${payload.bossAttack.regenIntervalTurns} хода по ${payload.bossAttack.regenPercent}% MaxHP`);
  lines.push('');
  lines.push('ИГРОК ДЛЯ РАСЧЁТА');
  lines.push(`HP игрока: ${payload.player.battleHp} (постоянное: ${payload.player.permanentHp})`);
  lines.push(`Броня игрока: ${payload.player.baseArmorPercent}%`);
  lines.push(`Бонус силы: ${payload.player.strengthBonusPercent}%`);
  lines.push(`Бонус здоровья: ${payload.player.healthBonusPercent}%`);
  lines.push(`Бонус защиты: ${payload.player.defenseBonusPercent}%`);
  lines.push('');
  lines.push('ТАЙЛЫ');
  lines.push(`Деревянный меч: ${payload.tiles.woodSwordDamage} урона`);
  lines.push(`Железный меч: ${payload.tiles.ironSwordDamage} урона`);
  lines.push(`Золотой меч: ${payload.tiles.goldSwordDamage} урона`);
  lines.push(`Алмазный меч: ${payload.tiles.diamondSwordDamage} урона`);
  lines.push(`Глиняный шар: ${payload.tiles.clayBallDamage} чистого урона`);
  lines.push(`Алмазный шар: +${payload.tiles.diamondShieldPerBallPercent}% защиты за тайл`);
  lines.push(`Бедрок шар: -${payload.tiles.bedrockBreakPerBallPercent}% брони босса за тайл`);
  lines.push('');

  if (payload.simulation) {
    lines.push('СИМУЛЯЦИЯ');
    lines.push(`Попыток: ${payload.simulation.attempts}`);
    lines.push(`Побед: ${payload.simulation.wins}`);
    lines.push(`Поражений: ${payload.simulation.losses}`);
    lines.push(`Таймаутов: ${payload.simulation.timeouts}`);
    lines.push(`Win rate: ${payload.simulation.winRatePercent}%`);
    lines.push(`Первая победа: ${payload.simulation.firstWinAttempt ?? 'нет'}`);
    lines.push(`Средняя длина: ${payload.simulation.averageTurns} ходов`);
    lines.push(`Среднее HP игрока при победе: ${payload.simulation.averagePlayerHpOnWin}`);
  } else {
    lines.push('СИМУЛЯЦИЯ: ещё не запускалась');
  }

  lines.push('');
  lines.push('ФОРМУЛЫ');
  config.formulas.forEach((formula) => lines.push(`- ${formula}`));

  return lines.join('\n');
}


function percent(current, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function BattleMeter({ label, value, max, tone = 'player', detail }) {
  const width = percent(value, max);
  return (
    <div className={`battle-meter ${tone}`}>
      <div className="battle-meter-top">
        <span>{label}</span>
        <strong>{round(value)} / {max}</strong>
      </div>
      <div className="battle-meter-track">
        <div className="battle-meter-fill" style={{ width: `${width}%` }} />
      </div>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function PlayTile({ tileId, selected, hinted, onClick }) {
  const tile = TILES[tileId];
  return (
    <button
      type="button"
      className={`play-cell ${selected ? 'selected' : ''} ${hinted ? 'hinted' : ''}`}
      onClick={onClick}
      title={tile.label}
      style={{ '--tile-bg': tile.color, '--tile-text': tile.textColor }}
    >
      <span>{tile.short}</span>
    </button>
  );
}

function PlayBoard({ battle, hintMove, onCellClick }) {
  if (!battle) {
    return (
      <div className="play-board-placeholder">
        <strong>Поле ещё не создано</strong>
        <span>Нажми «Новый трай», чтобы начать ручной бой по текущим формулам.</span>
      </div>
    );
  }

  const isSelected = (row, col) => battle.selected?.row === row && battle.selected?.col === col;
  const isHinted = (row, col) => {
    if (!hintMove) return false;
    return (hintMove.from.row === row && hintMove.from.col === col) || (hintMove.to.row === row && hintMove.to.col === col);
  };

  return (
    <div className="play-board">
      {battle.board.flatMap((row, rowIndex) =>
        row.map((tileId, colIndex) => (
          <PlayTile
            key={`${rowIndex}-${colIndex}`}
            tileId={tileId}
            selected={isSelected(rowIndex, colIndex)}
            hinted={isHinted(rowIndex, colIndex)}
            onClick={() => onCellClick({ row: rowIndex, col: colIndex })}
          />
        ))
      )}
    </div>
  );
}

function TileLegend({ config }) {
  const rows = [
    ['wood', `${config.swordDamage.wood} урона`],
    ['iron', `${config.swordDamage.iron} урона`],
    ['gold', `${config.swordDamage.gold} урона`],
    ['diamond', `${config.swordDamage.diamond} урона`],
    ['clay', `${config.clayDamage} чистого`],
    ['shield', `+${config.shieldPerBall}% защиты`],
    ['bedrock', `-${config.bedrockBreakPerBall}% брони`]
  ];

  return (
    <div className="play-legend">
      {rows.map(([tileId, value]) => (
        <div className="legend-item" key={tileId}>
          <TileBadge tileId={tileId} />
          <div>
            <strong>{TILES[tileId].label}</strong>
            <span>{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function UserTryTab({ config, battle, hintMove, onStart, onCellClick, onHint, onClearHint, onReshuffle }) {
  const state = battle?.state;
  const playerArmorNow = state
    ? Math.min(config.playerArmor + config.defenseBonus + state.diamondShield, config.battleArmorCap)
    : Math.min(config.playerArmor + config.defenseBonus, config.battleArmorCap);
  const bossArmorNow = state ? Math.max(0, config.bossArmor - state.armorBreak) : config.bossArmor;

  const resultTone = battle?.status === 'win' ? 'success' : battle?.status === 'lose' ? 'danger' : 'info';
  const resultLabel = battle?.status === 'win' ? 'Победа' : battle?.status === 'lose' ? 'Поражение' : 'В процессе';

  return (
    <div className="user-try-layout">
      <section className="panel play-hero-card boss-side">
        <p className="eyebrow small">босс</p>
        <h2>{config.bossName}</h2>
        <p className="muted">{config.bossType.label} / {config.difficulty.label}</p>
        <div className="boss-avatar">♛</div>
        <BattleMeter
          label="HP босса"
          value={state ? state.bossHp : config.bossMaxHp}
          max={config.bossMaxHp}
          tone="boss"
          detail={`Броня сейчас: ${round(bossArmorNow, 2)}%`}
        />
        <div className="mini-stat-grid">
          <span>Атака: <b>{config.attackRawDamage}</b></span>
          <span>До атаки: <b>{state ? state.attackCounter : config.attackInterval}</b></span>
          <span>Реген: <b>{round(config.regenPercent, 2)}%</b></span>
          <span>До регена: <b>{state ? state.regenCounter : config.regenInterval}</b></span>
        </div>
      </section>

      <section className="panel play-main-card">
        <div className="panel-title-row top-align">
          <div>
            <SectionTitle
              eyebrow="ручной тест"
              title="Сыграй матч-3 против текущего босса"
              text="Кликай по тайлу, потом по соседнему. Если swap создаёт матч 3+, ход применяется, считаются каскады, броня, атака и реген босса."
            />
            <div className={`try-status ${resultTone}`}>{battle ? `${resultLabel}: ${battle.message}` : 'Нажми «Новый трай», чтобы создать поле.'}</div>
          </div>
          <div className="actions-row wrap">
            <button className="secondary-button" onClick={onHint} disabled={!battle || battle.status !== 'playing'}>Подсказать ход</button>
            <button className="secondary-button" onClick={onClearHint} disabled={!hintMove}>Скрыть подсказку</button>
            <button className="secondary-button" onClick={onReshuffle} disabled={!battle || battle.status !== 'playing'}>Перемешать</button>
            <button className="primary-button" onClick={onStart}>{battle ? 'Новый трай' : 'Начать трай'}</button>
          </div>
        </div>

        <div className="play-center">
          <PlayBoard battle={battle} hintMove={hintMove} onCellClick={onCellClick} />
        </div>

        <div className="play-rules-card">
          <strong>Правила текущего трая</strong>
          <span>Матч 4/5/6+ даёт множитель. Алмазный шар копит защиту до атаки босса. Бедрок шар режет броню босса до следующего урона мечами. Глиняный шар бьёт чистым уроном.</span>
        </div>
      </section>

      <section className="panel play-hero-card player-side">
        <p className="eyebrow small">игрок</p>
        <h2>Персонаж</h2>
        <p className="muted">Тестовый герой из текущих настроек</p>
        <div className="player-avatar">◆</div>
        <BattleMeter
          label="HP игрока"
          value={state ? state.playerHp : config.playerBattleHp}
          max={config.playerBattleHp}
          tone="player"
          detail={`Защита сейчас: ${round(playerArmorNow, 2)}%`}
        />
        <div className="mini-stat-grid">
          <span>Ход: <b>{state ? state.turn : 0}</b></span>
          <span>Сила: <b>+{config.strengthBonus}%</b></span>
          <span>Щит: <b>{state ? round(state.diamondShield, 2) : 0}%</b></span>
          <span>Срез брони: <b>{state ? round(state.armorBreak, 2) : 0}%</b></span>
        </div>
      </section>

      <section className="panel play-info-card">
        <SectionTitle eyebrow="тайлы" title="Что делает каждый тайл" />
        <TileLegend config={config} />
      </section>

      <section className="panel play-log-card">
        <SectionTitle eyebrow="лог" title="История ручного боя" text="Последние события сверху вниз: swap, матчи, кубики брони, урон, реген и атаки босса." />
        <div className="log play-log">
          {(battle?.log ?? ['Трай ещё не начат.']).slice(-120).map((line, index) => (
            <div key={`${index}-${line}`}>{line}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryTab({ config, simulation, copyStatus, onCopy }) {
  const payload = buildExportPayload(config, simulation);
  const report = buildTextReport(config, simulation);
  const json = JSON.stringify(payload, null, 2);
  const advice = buildBalanceAdvice(config, simulation);

  return (
    <div className="tab-grid one">
      <section className="panel">
        <div className="panel-title-row top-align">
          <SectionTitle
            eyebrow="итог"
            title="Готовые значения босса"
            text="Здесь собраны финальные параметры, которые можно быстро скопировать в документ, таблицу или будущий игровой конфиг."
          />
          <div className="actions-row wrap">
            <button className="secondary-button" onClick={() => onCopy(report, 'Текстовый отчёт скопирован')}>Копировать отчёт</button>
            <button className="primary-button" onClick={() => onCopy(json, 'JSON скопирован')}>Копировать JSON</button>
          </div>
        </div>
        {copyStatus ? <div className="copy-status">{copyStatus}</div> : null}

        <div className="summary-cards">
          <StatCard label="Босс" value={config.bossName} hint={`${config.bossType.label} / ${config.difficulty.label}`} />
          <StatCard label="HP / броня" value={`${config.bossMaxHp} / ${config.bossArmor}%`} hint={`База HP: ${config.baseBossHp}`} />
          <StatCard label="Атака" value={config.attackRawDamage} hint={`раз в ${config.attackInterval} хода, частей: ${config.attackChunks}`} />
          <StatCard label="Реген" value={`${round(config.regenPercent, 2)}%`} hint={`раз в ${config.regenInterval} хода`} />
        </div>
      </section>

      <section className="panel">
        <SectionTitle eyebrow="копируемый отчёт" title="Текст для ГДД / заметок" text="Можно скопировать как обычный текст и вставить в Notion, Google Docs или задачу." />
        <textarea className="export-box" readOnly value={report} />
      </section>

      <section className="panel">
        <SectionTitle eyebrow="конфиг" title="JSON для будущей интеграции" text="Это не финальный формат для Unity, но уже удобная основа: ключи стабильные и разделены по блокам." />
        <textarea className="export-box code" readOnly value={json} />
      </section>

      <section className="panel">
        <SectionTitle eyebrow="рекомендации" title="Что поправить дальше" />
        <div className="advice-list">
          {advice.map((item) => (
            <div className="advice-item" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
              <span>{item.impact}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FormulasTab({ config }) {
  return (
    <div className="tab-grid one">
      <section className="panel">
        <SectionTitle
          eyebrow="расчёт"
          title="Формулы этого босса"
          text="Здесь собраны основные правила, по которым конструктор получил итоговые значения."
        />
        <FormulaList formulas={config.formulas} />
      </section>
      <section className="panel">
        <SectionTitle eyebrow="подсказка" title="Как читать расчёт" />
        <div className="info-grid">
          <div>
            <strong>Броня</strong>
            <p>Не режет урон напрямую в бою, а даёт шанс заблокировать отдельный удар или часть атаки.</p>
          </div>
          <div>
            <strong>Целевая длина боя</strong>
            <p>Чем меньше это число, тем больше урон мечей. Чем больше — тем дольше бой.</p>
          </div>
          <div>
            <strong>Алмазный шар</strong>
            <p>Даёт временную защиту игроку до следующей атаки босса.</p>
          </div>
          <div>
            <strong>Бедрок шар</strong>
            <p>Снижает броню босса до следующего урона мечами.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState(createDefaultForm);
  const [simulation, setSimulation] = useState(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [runIndex, setRunIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const [generationOptions, setGenerationOptions] = useState({ preset: 'random', difficulty: 'random', bossType: 'random' });
  const [generationMessage, setGenerationMessage] = useState('');
  const [playerBattle, setPlayerBattle] = useState(null);
  const [playerHint, setPlayerHint] = useState(null);
  const config = useMemo(() => calculateConfig(form), [form]);
  const autoConfig = useMemo(() => calculateConfig({
    ...form,
    bossArmor: '',
    attackInterval: '',
    regenInterval: '',
    regenPercent: '',
    attackChunks: '',
    targetTurns: ''
  }), [form]);
  const status = getBalanceStatus(simulation);

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const runSimulationForForm = (sourceForm) => {
    const nextRunIndex = runIndex + 1;
    const freshConfig = calculateConfig(sourceForm);
    const result = runAttempts(freshConfig, {
      attempts: sourceForm.attempts,
      maxTurns: sourceForm.maxTurns,
      seed: `${sourceForm.seed || 'mergecraft'}-run-${nextRunIndex}`
    });
    setRunIndex(nextRunIndex);
    setSimulation(result);
    setActiveTab('simulation');
    return result;
  };

  const simulate = () => {
    runSimulationForForm(form);
  };

  const generateBoss = () => {
    const nextForm = generateRandomBossForm(form, {
      ...generationOptions,
      seed: `generator-${Date.now()}-${runIndex}`
    });
    setForm(nextForm);
    setSimulation(null);
    setPlayerBattle(null);
    setPlayerHint(null);
    setCopyStatus('');
    setGenerationMessage(`Сгенерирован: ${nextForm.bossName}. Проверь автобоем или сыграй трай.`);
    setActiveTab('generator');
    return nextForm;
  };

  const generateAndSimulate = () => {
    const nextForm = generateRandomBossForm(form, {
      ...generationOptions,
      seed: `generator-${Date.now()}-${runIndex}`
    });
    setForm(nextForm);
    setPlayerBattle(null);
    setPlayerHint(null);
    setCopyStatus('');
    setGenerationMessage(`Сгенерирован и проверен автобоем: ${nextForm.bossName}.`);
    runSimulationForForm(nextForm);
  };

  const resetWeights = () => {
    setForm((current) => ({ ...current, weights: { ...DEFAULT_WEIGHTS } }));
  };

  const startPlayerTry = () => {
    const freshConfig = calculateConfig(form);
    setPlayerBattle(createPlayerBattle(freshConfig, { seed: `${form.seed || 'mergecraft'}-player-${Date.now()}` }));
    setPlayerHint(null);
    setActiveTab('play');
  };

  const clickPlayerCell = (cell) => {
    setPlayerBattle((current) => {
      if (!current) return current;
      const next = togglePlayerSelection(config, current, cell);
      return next;
    });
    setPlayerHint(null);
  };

  const showPlayerHint = () => {
    if (!playerBattle) return;
    setPlayerHint(getPlayerHint(config, playerBattle));
  };

  const reshufflePlayer = () => {
    setPlayerBattle((current) => reshufflePlayerBattle(config, current));
    setPlayerHint(null);
  };

  const copyText = async (text, message) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const element = document.createElement('textarea');
        element.value = text;
        document.body.appendChild(element);
        element.select();
        document.execCommand('copy');
        document.body.removeChild(element);
      }
      setCopyStatus(message);
    } catch (error) {
      setCopyStatus('Не получилось скопировать автоматически — выдели текст вручную.');
    }
  };

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MergeCraft / Boss Constructor</p>
          <h1>Конструктор боссов для 3-в-ряд боя</h1>
          <p className="hero-text">
            Вводишь босса и сложность — получаешь расчёт статов, формулы, симуляцию забегов и точечные советы по балансу.
          </p>
        </div>
        <div className="hero-actions">
          <span className={`status-pill ${status.tone}`}>{status.label}</span>
          <button className="secondary-button" onClick={() => setActiveTab('generator')}>Генератор</button>
          <button className="secondary-button" onClick={startPlayerTry}>Сыграть трай</button>
          <button className="primary-button" onClick={simulate}>Запустить симуляцию</button>
        </div>
      </header>

      <section className="summary-strip">
        <StatCard label="HP босса" value={config.bossMaxHp} hint={`База: ${config.baseBossHp}`} />
        <StatCard label="Броня босса" value={`${config.bossArmor}%`} hint="кап 50%" />
        <StatCard label="Атака босса" value={config.attackRawDamage} hint={`раз в ${config.attackInterval} хода`} />
        <StatCard label="HP игрока" value={config.playerBattleHp} hint={`кап ${config.battleHpCap}`} />
        <StatCard label="Win rate" value={simulation ? `${simulation.winRate}%` : '—'} hint={simulation ? `${simulation.wins}/${simulation.attempts}` : 'нет симуляции'} tone={status.tone} />
      </section>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="content single">
        {activeTab === 'builder' ? (
          <BuilderTab form={form} setForm={setForm} setValue={setValue} resetWeights={resetWeights} autoConfig={autoConfig} />
        ) : null}

        {activeTab === 'generator' ? (
          <GeneratorTab
            form={form}
            generatorOptions={generationOptions}
            setGeneratorOptions={setGenerationOptions}
            config={config}
            onGenerate={generateBoss}
            onGenerateAndSimulate={generateAndSimulate}
            onSimulate={simulate}
            onPlay={startPlayerTry}
            generationMessage={generationMessage}
          />
        ) : null}

        {activeTab === 'stats' ? <StatsTab config={config} /> : null}

        {activeTab === 'simulation' ? (
          <SimulationTab config={config} simulation={simulation} onSimulate={simulate} runIndex={runIndex} />
        ) : null}

        {activeTab === 'play' ? (
          <UserTryTab
            config={config}
            battle={playerBattle}
            hintMove={playerHint}
            onStart={startPlayerTry}
            onCellClick={clickPlayerCell}
            onHint={showPlayerHint}
            onClearHint={() => setPlayerHint(null)}
            onReshuffle={reshufflePlayer}
          />
        ) : null}

        {activeTab === 'summary' ? (
          <SummaryTab config={config} simulation={simulation} copyStatus={copyStatus} onCopy={copyText} />
        ) : null}

        {activeTab === 'formulas' ? <FormulasTab config={config} /> : null}
      </section>
    </main>
  );
}
