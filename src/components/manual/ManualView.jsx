import React, { useMemo, useState } from 'react';
import { BOSS_TYPES, DIFFICULTIES, GENERATION_PRESETS, TILES, round } from '../../simulator.js';
import { buildBalanceAdvice, getBalanceStatus, mergeWizardSidebar } from '../../balanceHints.js';
import {
  AccordionSection,
  AutoNumberField,
  Field,
  KeyValueList,
  StatCard,
  TileBadge,
  numberInputProps
} from '../shared.jsx';
import { buildExportPayload, buildTextReport } from './exportUtils.js';

const MANUAL_NAV = [
  { id: 'builder', label: 'Босс' },
  { id: 'generator', label: 'Генератор' },
  { id: 'simulation', label: 'Симуляция' },
  { id: 'play', label: 'Трай' },
  { id: 'summary', label: 'Итог' }
];

function ManualAside({ activeTab, config, form, simulation, status }) {
  const hintStep = activeTab === 'builder' ? 1 : activeTab === 'simulation' ? 5 : 2;
  const sidebar = useMemo(
    () => mergeWizardSidebar({ step: hintStep, config, form, quickSimulation: simulation, isSimulating: false }),
    [hintStep, config, form, simulation]
  );

  if (activeTab === 'play') {
    return (
      <aside className="manual-aside panel">
        <p className="eyebrow small">Как играть</p>
        <p className="manual-aside-lead">Кликни тайл, затем соседний. Матч 3+ — ход засчитан.</p>
        <ul className="manual-aside-tips">
          <li>Мечи бьют босса</li>
          <li>Щит — защита до атаки</li>
          <li>Бедрок — срез брони</li>
        </ul>
      </aside>
    );
  }

  if (activeTab === 'generator') {
    return (
      <aside className="manual-aside panel">
        <p className="eyebrow small">Совет</p>
        <p className="manual-aside-lead">Сгенерируй босса, потом открой «Симуляция» для проверки баланса.</p>
      </aside>
    );
  }

  if (activeTab === 'summary') {
    return (
      <aside className="manual-aside panel">
        <p className="eyebrow small">Экспорт</p>
        <p className="manual-aside-lead">Скопируй отчёт в задачу или JSON для интеграции в игру.</p>
      </aside>
    );
  }

  const hints = sidebar.hints.slice(0, 2);

  return (
    <aside className="manual-aside panel">
      <p className="eyebrow small">Сейчас</p>
      <span className={`status-pill ${status.tone}`}>{status.label}</span>
      <KeyValueList
        rows={[
          ['HP босса', config.bossMaxHp],
          ['Атака', `${config.attackRawDamage} / ${config.attackInterval} х.`],
          ['Игрок', `${config.playerBattleHp} HP`],
          ['Win rate', simulation ? `${simulation.winRate}%` : '—']
        ]}
      />
      {hints.length > 0 ? (
        <div className="manual-aside-hints">
          {hints.map((item) => (
            <div className={`wizard-aside-hint tone-${item.tone ?? 'default'}`} key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function ManualBuilder({ form, setForm, setValue, resetWeights, autoConfig, config }) {
  const [openSection, setOpenSection] = useState('main');

  const toggle = (id) => setOpenSection((current) => (current === id ? '' : id));

  return (
    <div className="manual-page">
      <header className="manual-page-head">
        <h2>Настройка босса</h2>
        <p>Основное — всегда под рукой. Остальное в раскрывающихся блоках.</p>
      </header>

      <AccordionSection title="Основное" description="Имя, HP, тип, сложность" open={openSection === 'main'} onToggle={() => toggle('main')}>
        <div className="manual-fields">
          <Field label="Название">
            <input value={form.bossName} onChange={(e) => setValue('bossName', e.target.value)} />
          </Field>
          <Field label="Базовое HP">
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
              {Object.values(DIFFICULTIES).map((d) => (
                <option value={d.id} key={d.id}>{d.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <p className="muted manual-note">Итоговое HP в бою: <b>{config.bossMaxHp}</b></p>
      </AccordionSection>

      <AccordionSection title="Игрок" description="HP и бонусы" open={openSection === 'player'} onToggle={() => toggle('player')}>
        <div className="manual-fields three">
          <Field label="HP">
            <input {...numberInputProps} value={form.playerPermanentHp} onChange={(e) => setValue('playerPermanentHp', e.target.value)} />
          </Field>
          <Field label="Броня, %">
            <input {...numberInputProps} value={form.playerArmor} onChange={(e) => setValue('playerArmor', e.target.value)} />
          </Field>
          <Field label="Сила, %">
            <input {...numberInputProps} value={form.strengthBonus} onChange={(e) => setValue('strengthBonus', e.target.value)} />
          </Field>
          <Field label="Здоровье, %">
            <input {...numberInputProps} value={form.healthBonus} onChange={(e) => setValue('healthBonus', e.target.value)} />
          </Field>
          <Field label="Защита, %">
            <input {...numberInputProps} value={form.defenseBonus} onChange={(e) => setValue('defenseBonus', e.target.value)} />
          </Field>
        </div>
      </AccordionSection>

      <AccordionSection title="Дополнительно" description="Броня, атака, реген — можно оставить auto" open={openSection === 'extra'} onToggle={() => toggle('extra')}>
        <div className="manual-fields two">
          <AutoNumberField label="Броня босса, %" value={form.bossArmor} autoValue={autoConfig.bossArmor} onChange={(v) => setValue('bossArmor', v)} />
          <AutoNumberField label="Атака / N ходов" value={form.attackInterval} autoValue={autoConfig.attackInterval} onChange={(v) => setValue('attackInterval', v)} />
          <AutoNumberField label="Части атаки" value={form.attackChunks} autoValue={autoConfig.attackChunks} onChange={(v) => setValue('attackChunks', v)} />
          <AutoNumberField label="Реген / N ходов" value={form.regenInterval} autoValue={autoConfig.regenInterval} onChange={(v) => setValue('regenInterval', v)} />
          <AutoNumberField label="Реген, %" value={form.regenPercent} autoValue={autoConfig.regenPercent} onChange={(v) => setValue('regenPercent', v)} />
          <AutoNumberField label="Длина боя" value={form.targetTurns} autoValue={autoConfig.targetTurns} onChange={(v) => setValue('targetTurns', v)} />
        </div>
      </AccordionSection>

      <AccordionSection title="Поле и проверка" description="Веса тайлов, попытки симуляции" open={openSection === 'field'} onToggle={() => toggle('field')}>
        <div className="manual-fields three">
          <Field label="Попыток">
            <input {...numberInputProps} value={form.attempts} onChange={(e) => setValue('attempts', e.target.value)} />
          </Field>
          <Field label="Лимит ходов">
            <input {...numberInputProps} value={form.maxTurns} onChange={(e) => setValue('maxTurns', e.target.value)} />
          </Field>
        </div>
        <div className="manual-tile-weights">
          {Object.values(TILES).map((tile) => (
            <label key={tile.id} className="manual-tile-row">
              <TileBadge tileId={tile.id} />
              <input
                {...numberInputProps}
                value={form.weights[tile.id]}
                onChange={(e) => setForm((c) => ({ ...c, weights: { ...c.weights, [tile.id]: e.target.value } }))}
              />
            </label>
          ))}
        </div>
        <button type="button" className="ghost-button" onClick={resetWeights}>Сбросить веса</button>
      </AccordionSection>

      <AccordionSection title="Все числа" description="Итоговые статы и формулы" open={openSection === 'details'} onToggle={() => toggle('details')}>
        <KeyValueList
          rows={[
            ['Босс', `${config.bossName} · ${config.bossType.label}`],
            ['HP / броня', `${config.bossMaxHp} / ${config.bossArmor}%`],
            ['Атака', `${config.attackRawDamage} (${config.attackChunks} частей)`],
            ['Реген', `${round(config.regenPercent, 1)}% / ${config.regenInterval} х.`],
            ['Меч (дерево)', config.swordDamage.wood],
            ['Игрок в бою', `${config.playerBattleHp} HP`]
          ]}
        />
        <details className="manual-formulas-details">
          <summary>Формулы расчёта</summary>
          <ul>
            {config.formulas.map((line) => (
              <li key={line}><code>{line}</code></li>
            ))}
          </ul>
        </details>
      </AccordionSection>
    </div>
  );
}

function ManualGenerator({ generatorOptions, setGeneratorOptions, config, onGenerate, onGenerateAndSimulate, generationMessage, onGoSimulation, onGoPlay }) {
  const preset = GENERATION_PRESETS[generatorOptions.preset] ?? GENERATION_PRESETS.random;

  return (
    <div className="manual-page">
      <header className="manual-page-head">
        <h2>Генератор</h2>
        <p>Случайный босс за один клик. Потом проверь в симуляции.</p>
      </header>

      <div className="manual-generator-actions">
        <button type="button" className="primary-button" onClick={onGenerate}>Сгенерировать</button>
        <button type="button" className="secondary-button" onClick={onGenerateAndSimulate}>Сгенерировать и проверить</button>
      </div>

      {generationMessage ? <p className="copy-status">{generationMessage}</p> : null}

      <div className="manual-fields three">
        <Field label="Этап">
          <select value={generatorOptions.preset} onChange={(e) => setGeneratorOptions((c) => ({ ...c, preset: e.target.value }))}>
            {Object.values(GENERATION_PRESETS).map((item) => (
              <option value={item.id} key={item.id}>{item.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Сложность">
          <select value={generatorOptions.difficulty} onChange={(e) => setGeneratorOptions((c) => ({ ...c, difficulty: e.target.value }))}>
            <option value="random">Случайная</option>
            {Object.values(DIFFICULTIES).map((d) => (
              <option value={d.id} key={d.id}>{d.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Тип">
          <select value={generatorOptions.bossType} onChange={(e) => setGeneratorOptions((c) => ({ ...c, bossType: e.target.value }))}>
            <option value="random">Случайный</option>
            {Object.values(BOSS_TYPES).map((t) => (
              <option value={t.id} key={t.id}>{t.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <p className="muted manual-note">{preset.label}: {preset.hint}</p>

      <KeyValueList
        rows={[
          ['Босс', config.bossName],
          ['HP', `${config.bossMaxHp} (${config.bossArmor}% броня)`],
          ['Игрок', `${config.playerBattleHp} HP`]
        ]}
      />

      <div className="manual-quick-links">
        <button type="button" className="secondary-button" onClick={onGoSimulation}>Симуляция →</button>
        <button type="button" className="secondary-button" onClick={onGoPlay}>Трай →</button>
      </div>
    </div>
  );
}

function ManualSimulation({ config, simulation, onSimulate, runIndex }) {
  const [showDetails, setShowDetails] = useState(false);
  const status = getBalanceStatus(simulation);
  const advice = buildBalanceAdvice(config, simulation).slice(0, 3);

  return (
    <div className="manual-page">
      <header className="manual-page-head">
        <h2>Автопроверка</h2>
        <p>Компьютер играет матч-3 много раз и считает шанс победы.</p>
      </header>

      <div className="manual-sim-hero">
        <div className={`manual-sim-rate tone-${status.tone}`}>
          <span>Win rate</span>
          <strong>{simulation ? `${simulation.winRate}%` : '—'}</strong>
        </div>
        <span className={`status-pill ${status.tone}`}>{status.label}</span>
      </div>

      {simulation ? (
        <div className="manual-sim-stats">
          <StatCard label="Побед" value={`${simulation.wins} / ${simulation.attempts}`} />
          <StatCard label="Средняя длина" value={`${simulation.avgTurns} х.`} />
          <StatCard label="Первая победа" value={simulation.firstWinAttempt ? `#${simulation.firstWinAttempt}` : 'Нет'} />
        </div>
      ) : (
        <p className="muted">Ещё не запускали. Нажми кнопку ниже.</p>
      )}

      <div className="manual-generator-actions">
        <button type="button" className="primary-button" onClick={onSimulate}>
          {simulation ? 'Перезапустить' : 'Запустить симуляцию'}
        </button>
      </div>
      <p className="muted manual-note">Запуск №{runIndex}</p>

      {advice.length > 0 && simulation ? (
        <div className="manual-advice-compact">
          {advice.map((item) => (
            <div className="advice-item" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      {simulation ? (
        <>
          <button type="button" className="ghost-button" onClick={() => setShowDetails((v) => !v)}>
            {showDetails ? 'Скрыть лог' : 'Показать лог боя'}
          </button>
          {showDetails ? (
            <div className="log manual-log">
              {(simulation.firstWinResult?.log ?? simulation.bestResult?.log ?? []).slice(-40).map((line, i) => (
                <div key={`${i}-${line}`}>{line}</div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function percent(current, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function BattleMeter({ label, value, max, tone = 'player' }) {
  return (
    <div className={`battle-meter ${tone}`}>
      <div className="battle-meter-top">
        <span>{label}</span>
        <strong>{round(value)} / {max}</strong>
      </div>
      <div className="battle-meter-track">
        <div className="battle-meter-fill" style={{ width: `${percent(value, max)}%` }} />
      </div>
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
      style={{ '--tile-bg': tile.color, '--tile-text': tile.textColor }}
    >
      <span>{tile.short}</span>
    </button>
  );
}

function ManualPlay({ config, battle, hintMove, onStart, onCellClick, onHint, onClearHint, onReshuffle }) {
  const [showLog, setShowLog] = useState(false);
  const state = battle?.state;
  const resultLabel = battle?.status === 'win' ? 'Победа' : battle?.status === 'lose' ? 'Поражение' : battle ? 'В бою' : '';

  const isSelected = (row, col) => battle?.selected?.row === row && battle?.selected?.col === col;
  const isHinted = (row, col) => hintMove && (
    (hintMove.from.row === row && hintMove.from.col === col) || (hintMove.to.row === row && hintMove.to.col === col)
  );

  return (
    <div className="manual-page manual-play-page">
      <header className="manual-page-head">
        <h2>Трай</h2>
        <p className={battle?.status === 'win' ? 'tone-success' : battle?.status === 'lose' ? 'tone-danger' : ''}>
          {battle ? resultLabel : 'Сыграй матч-3 против текущего босса'}
        </p>
      </header>

      <div className="manual-play-meters">
        <BattleMeter label={config.bossName} value={state ? state.bossHp : config.bossMaxHp} max={config.bossMaxHp} tone="boss" />
        <BattleMeter label="Игрок" value={state ? state.playerHp : config.playerBattleHp} max={config.playerBattleHp} tone="player" />
      </div>

      <div className="manual-play-board-wrap">
        {!battle ? (
          <div className="play-board-placeholder">
            <strong>Начни трай</strong>
            <span>Поле 7×7 появится после старта</span>
          </div>
        ) : (
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
        )}
      </div>

      <div className="manual-play-actions">
        <button type="button" className="primary-button" onClick={onStart}>{battle ? 'Новый трай' : 'Начать'}</button>
        <button type="button" className="secondary-button" onClick={onHint} disabled={!battle || battle.status !== 'playing'}>Подсказка</button>
        <button type="button" className="ghost-button" onClick={onReshuffle} disabled={!battle || battle.status !== 'playing'}>Перемешать</button>
        {hintMove ? <button type="button" className="ghost-button" onClick={onClearHint}>Скрыть</button> : null}
      </div>

      {battle ? (
        <button type="button" className="ghost-button" onClick={() => setShowLog((v) => !v)}>
          {showLog ? 'Скрыть лог' : 'Лог боя'}
        </button>
      ) : null}
      {showLog && battle ? (
        <div className="log manual-log">{(battle.log ?? []).slice(-30).map((line, i) => <div key={`${i}-${line}`}>{line}</div>)}</div>
      ) : null}
    </div>
  );
}

function ManualSummary({ config, simulation, copyStatus, onCopy }) {
  const [detailTab, setDetailTab] = useState('short');
  const payload = buildExportPayload(config, simulation);
  const report = buildTextReport(config, simulation);
  const json = JSON.stringify(payload, null, 2);
  const advice = buildBalanceAdvice(config, simulation).slice(0, 2);

  return (
    <div className="manual-page">
      <header className="manual-page-head">
        <h2>Итог</h2>
        <p>Готовые значения для копирования.</p>
      </header>

      <KeyValueList
        rows={[
          ['Босс', config.bossName],
          ['Тип', `${config.bossType.label} · ${config.difficulty.label}`],
          ['HP / броня', `${config.bossMaxHp} / ${config.bossArmor}%`],
          ['Атака', config.attackRawDamage],
          ['Win rate', simulation ? `${simulation.winRate}%` : 'не проверяли']
        ]}
      />

      <div className="manual-generator-actions">
        <button type="button" className="primary-button" onClick={() => onCopy(report, 'Отчёт скопирован')}>Копировать отчёт</button>
        <button type="button" className="secondary-button" onClick={() => onCopy(json, 'JSON скопирован')}>Копировать JSON</button>
      </div>
      {copyStatus ? <p className="copy-status">{copyStatus}</p> : null}

      {advice.length > 0 ? (
        <div className="manual-advice-compact">
          {advice.map((item) => (
            <div className="advice-item" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="manual-detail-tabs">
        <button type="button" className={detailTab === 'short' ? 'active' : ''} onClick={() => setDetailTab('short')}>Отчёт</button>
        <button type="button" className={detailTab === 'json' ? 'active' : ''} onClick={() => setDetailTab('json')}>JSON</button>
      </div>
      <textarea className="export-box export-box-fixed code" readOnly value={detailTab === 'json' ? json : report} />
    </div>
  );
}

export default function ManualView({
  activeTab,
  setActiveTab,
  form,
  setForm,
  setValue,
  resetWeights,
  autoConfig,
  config,
  simulation,
  status,
  generatorOptions,
  setGeneratorOptions,
  generationMessage,
  onGenerate,
  onGenerateAndSimulate,
  onSimulate,
  runIndex,
  playerBattle,
  playerHint,
  onStartPlay,
  onCellClick,
  onHint,
  onClearHint,
  onReshuffle,
  copyStatus,
  onCopy
}) {
  return (
    <div className="manual-shell">
      <nav className="manual-nav-left panel">
        <p className="eyebrow small">Режим</p>
        <ul className="wizard-nav-list">
          {MANUAL_NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`wizard-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="manual-center panel">
        {activeTab === 'builder' ? (
          <ManualBuilder form={form} setForm={setForm} setValue={setValue} resetWeights={resetWeights} autoConfig={autoConfig} config={config} />
        ) : null}
        {activeTab === 'generator' ? (
          <ManualGenerator
            generatorOptions={generatorOptions}
            setGeneratorOptions={setGeneratorOptions}
            config={config}
            onGenerate={onGenerate}
            onGenerateAndSimulate={onGenerateAndSimulate}
            generationMessage={generationMessage}
            onGoSimulation={() => setActiveTab('simulation')}
            onGoPlay={() => setActiveTab('play')}
          />
        ) : null}
        {activeTab === 'simulation' ? (
          <ManualSimulation config={config} simulation={simulation} onSimulate={onSimulate} runIndex={runIndex} />
        ) : null}
        {activeTab === 'play' ? (
          <ManualPlay
            config={config}
            battle={playerBattle}
            hintMove={playerHint}
            onStart={onStartPlay}
            onCellClick={onCellClick}
            onHint={onHint}
            onClearHint={onClearHint}
            onReshuffle={onReshuffle}
          />
        ) : null}
        {activeTab === 'summary' ? (
          <ManualSummary config={config} simulation={simulation} copyStatus={copyStatus} onCopy={onCopy} />
        ) : null}
      </section>

      <ManualAside activeTab={activeTab} config={config} form={form} simulation={simulation} status={status} />
    </div>
  );
}
