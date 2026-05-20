import React, { useEffect, useMemo, useState } from 'react';
import { BOSS_TYPES, DIFFICULTIES, TILES, round, runAttempts } from '../simulator.js';
import { mergeWizardSidebar } from '../balanceHints.js';

const BOSS_TYPE_HINTS = {
  normal: 'Сбалансированный бой: средняя броня и урон.',
  tank: 'Много брони, медленнее бьёт — нужны мечи и бедрок.',
  regenerator: 'Часто лечится — бой длиннее, важен урон.',
  aggressive: 'Бьёт часто и больно — игроку нужна защита.',
  final: 'Финальный босс: высокие статы по всем параметрам.'
};

const DIFFICULTY_HINTS = {
  easy: 'Проще пройти, бой короче.',
  medium: 'Стандартный баланс для обычного уровня.',
  hard: 'Дольше бой, босс сильнее — для хардкора.'
};

const NAV_GROUPS = [
  { id: 'boss', label: 'Босс', screens: ['name', 'type', 'difficulty'] },
  { id: 'hp', label: 'Здоровье', screens: ['bossHp', 'targetTurns'] },
  { id: 'player', label: 'Игрок', screens: ['playerHp', 'playerDefense', 'playerPower'] },
  { id: 'extra', label: 'Дополнительно', screens: ['extraIntro', 'extraTune'] },
  { id: 'field', label: 'Поле', screens: ['fieldIntro', 'fieldWeights'] },
  { id: 'done', label: 'Готово', screens: ['finish'] }
];

const ALL_SCREENS = NAV_GROUPS.flatMap((group) => group.screens);

function screenToHintStep(screenId) {
  if (['name', 'type', 'difficulty'].includes(screenId)) return 0;
  if (['bossHp', 'targetTurns'].includes(screenId)) return 1;
  if (['playerHp', 'playerDefense', 'playerPower'].includes(screenId)) return 2;
  if (['extraIntro', 'extraTune'].includes(screenId)) return 3;
  if (['fieldIntro', 'fieldWeights'].includes(screenId)) return 4;
  return 5;
}

const numberInputProps = { type: 'number', step: 'any', className: 'wizard-input' };

function WizardNav({ screenIndex, onJump }) {
  const currentScreen = ALL_SCREENS[screenIndex];

  return (
    <nav className="wizard-nav-left panel">
      <p className="eyebrow small">Мастер</p>
      <ul className="wizard-nav-list">
        {NAV_GROUPS.map((group) => {
          const firstIndex = ALL_SCREENS.indexOf(group.screens[0]);
          const lastIndex = ALL_SCREENS.indexOf(group.screens[group.screens.length - 1]);
          const isActive = screenIndex >= firstIndex && screenIndex <= lastIndex;
          const isDone = screenIndex > lastIndex;
          const subIndex = group.screens.indexOf(currentScreen);
          const dotLabel = isDone ? '✓' : isActive && subIndex >= 0 ? subIndex + 1 : '·';

          return (
            <li key={group.id}>
              <button
                type="button"
                className={`wizard-nav-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => onJump(firstIndex)}
                disabled={firstIndex > screenIndex}
              >
                <span className="wizard-nav-dot">{dotLabel}</span>
                <span>{group.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="wizard-nav-progress muted">
        {screenIndex + 1} / {ALL_SCREENS.length}
      </p>
    </nav>
  );
}

function WizardHints({ sidebar }) {
  const { status, hints, isSimulating } = sidebar;
  const topHints = hints.slice(0, 2);

  return (
    <aside className="wizard-aside-right panel">
      <p className="eyebrow small">Подсказка</p>
      <div className="wizard-aside-status">
        <span className={`status-pill ${status.tone}`}>{status.label}</span>
        {isSimulating ? <span className="wizard-sim-loading">Считаю…</span> : null}
      </div>
      {status.text ? <p className="wizard-aside-lead">{status.text}</p> : null}
      {topHints.length === 0 ? (
        <p className="muted wizard-aside-empty">Пока всё спокойно. Продолжай настройку.</p>
      ) : (
        <div className="wizard-aside-hints">
          {topHints.map((item) => (
            <div className={`wizard-aside-hint tone-${item.tone ?? 'default'}`} key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

function OnboardingScreen({ title, description, children, footer }) {
  return (
    <div className="wizard-onboard">
      <div className="wizard-onboard-head">
        <h2>{title}</h2>
        {description ? <p className="wizard-onboard-desc">{description}</p> : null}
      </div>
      <div className="wizard-onboard-body">{children}</div>
      {footer ? <div className="wizard-onboard-footer">{footer}</div> : null}
    </div>
  );
}

function ChoiceCards({ options, value, onChange }) {
  return (
    <div className="wizard-choice-grid">
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className={`wizard-choice-card ${value === option.id ? 'selected' : ''}`}
          onClick={() => onChange(option.id)}
        >
          <strong>{option.label}</strong>
          {option.hint ? <span>{option.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}

export default function WizardView({
  form,
  setForm,
  setValue,
  resetWeights,
  autoConfig,
  config,
  screenIndex,
  setScreenIndex,
  runIndex,
  simulation,
  onRunFullSimulation,
  onGoToSimulation,
  onGoManual,
  updateNestedWeight
}) {
  const [quickSimulation, setQuickSimulation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showExtraTune, setShowExtraTune] = useState(false);
  const [showFieldWeights, setShowFieldWeights] = useState(false);

  const screenId = ALL_SCREENS[screenIndex] ?? 'name';
  const hintStep = screenToHintStep(screenId);

  const sidebar = useMemo(
    () => {
      const merged = mergeWizardSidebar({
        step: hintStep,
        config,
        form,
        quickSimulation,
        isSimulating
      });
      return { ...merged, hints: merged.hints.slice(0, 2) };
    },
    [hintStep, config, form, quickSimulation, isSimulating]
  );

  useEffect(() => {
    if (hintStep < 2) {
      setQuickSimulation(null);
      setIsSimulating(false);
      return undefined;
    }

    setIsSimulating(true);
    const timer = window.setTimeout(() => {
      const result = runAttempts(config, {
        attempts: 8,
        maxTurns: form.maxTurns,
        seed: `${form.seed || 'mergecraft'}-wizard-${runIndex}-${screenId}`
      });
      setQuickSimulation(result);
      setIsSimulating(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [hintStep, config, form.maxTurns, form.seed, runIndex, screenId]);

  const goNext = () => {
    if (screenId === 'extraIntro' && !showExtraTune) {
      const next = ALL_SCREENS.indexOf('fieldIntro');
      setScreenIndex(next);
      return;
    }
    if (screenId === 'fieldIntro' && !showFieldWeights) {
      setScreenIndex(ALL_SCREENS.indexOf('finish'));
      return;
    }
    setScreenIndex((current) => Math.min(ALL_SCREENS.length - 1, current + 1));
  };

  const goBack = () => {
    if (screenId === 'fieldIntro') {
      setScreenIndex(ALL_SCREENS.indexOf(showExtraTune ? 'extraTune' : 'extraIntro'));
      return;
    }
    if (screenId === 'finish' && !showFieldWeights) {
      setScreenIndex(ALL_SCREENS.indexOf('fieldIntro'));
      return;
    }
    setScreenIndex((current) => Math.max(0, current - 1));
  };

  const canNext = (() => {
    if (screenId === 'name') return Boolean(form.bossName?.trim());
    if (screenId === 'bossHp') return Number(form.bossHp) > 0;
    if (screenId === 'playerHp') return Number(form.playerPermanentHp) > 0;
    return true;
  })();

  const navFooter = (
    <div className="wizard-actions">
      <button type="button" className="secondary-button" onClick={goBack} disabled={screenIndex === 0}>
        Назад
      </button>
      {screenId !== 'finish' ? (
        <button type="button" className="primary-button" onClick={goNext} disabled={!canNext}>
          Далее
        </button>
      ) : null}
    </div>
  );

  const bossTypeOptions = Object.values(BOSS_TYPES).map((type) => ({
    id: type.id,
    label: type.label,
    hint: BOSS_TYPE_HINTS[type.id]
  }));

  const difficultyOptions = Object.values(DIFFICULTIES).map((diff) => ({
    id: diff.id,
    label: diff.label,
    hint: DIFFICULTY_HINTS[diff.id]
  }));

  let center = null;

  if (screenId === 'name') {
    center = (
      <OnboardingScreen
        title="Как зовут босса?"
        description="Имя увидишь в бою, отчёте и при экспорте."
        footer={navFooter}
      >
        <input
          className="wizard-input wizard-input-large"
          value={form.bossName}
          onChange={(e) => setValue('bossName', e.target.value)}
          placeholder="Например: Каменный Голем"
          autoFocus
        />
      </OnboardingScreen>
    );
  }

  if (screenId === 'type') {
    center = (
      <OnboardingScreen
        title="Какой это босс?"
        description="Тип задаёт броню, атаку и реген по умолчанию."
        footer={navFooter}
      >
        <ChoiceCards options={bossTypeOptions} value={form.bossType} onChange={(id) => setValue('bossType', id)} />
      </OnboardingScreen>
    );
  }

  if (screenId === 'difficulty') {
    center = (
      <OnboardingScreen
        title="Насколько сложный бой?"
        description="Сложность меняет HP, урон и длину боя."
        footer={navFooter}
      >
        <ChoiceCards options={difficultyOptions} value={form.difficulty} onChange={(id) => setValue('difficulty', id)} />
      </OnboardingScreen>
    );
  }

  if (screenId === 'bossHp') {
    center = (
      <OnboardingScreen
        title="Сколько HP у босса?"
        description={`С учётом сложности получится ${config.bossMaxHp} HP в бою.`}
        footer={navFooter}
      >
        <input
          {...numberInputProps}
          value={form.bossHp}
          onChange={(e) => setValue('bossHp', e.target.value)}
          autoFocus
        />
        <p className="wizard-field-note muted">Базовое значение до множителя сложности ×{config.difficulty.hpMul}</p>
      </OnboardingScreen>
    );
  }

  if (screenId === 'targetTurns') {
    const isAuto = form.targetTurns === '' || form.targetTurns == null;
    center = (
      <OnboardingScreen
        title="Как долго должен длиться бой?"
        description="От этого считается урон мечей. Можно оставить автоматически."
        footer={navFooter}
      >
        <button
          type="button"
          className={`wizard-skip-card ${isAuto ? 'selected' : ''}`}
          onClick={() => setValue('targetTurns', '')}
        >
          <strong>Автоматически</strong>
          <span>~{autoConfig.targetTurns} ходов для {config.difficulty.label.toLowerCase()} сложности</span>
        </button>
        <label className="wizard-inline-field">
          <span>Или своё число ходов</span>
          <input
            {...numberInputProps}
            placeholder={`${autoConfig.targetTurns}`}
            value={form.targetTurns}
            onChange={(e) => setValue('targetTurns', e.target.value)}
          />
        </label>
      </OnboardingScreen>
    );
  }

  if (screenId === 'playerHp') {
    center = (
      <OnboardingScreen
        title="Сколько HP у игрока?"
        description={`В бою будет ${config.playerBattleHp} HP (с учётом бонусов здоровья).`}
        footer={navFooter}
      >
        <input
          {...numberInputProps}
          value={form.playerPermanentHp}
          onChange={(e) => setValue('playerPermanentHp', e.target.value)}
          autoFocus
        />
      </OnboardingScreen>
    );
  }

  if (screenId === 'playerDefense') {
    center = (
      <OnboardingScreen
        title="Насколько игрок защищён?"
        description="Броня снижает урон босса. Бонус защиты добавляется в бою."
        footer={navFooter}
      >
        <label className="wizard-inline-field">
          <span>Броня игрока, %</span>
          <input {...numberInputProps} value={form.playerArmor} onChange={(e) => setValue('playerArmor', e.target.value)} />
        </label>
        <label className="wizard-inline-field">
          <span>Бонус защиты, %</span>
          <input {...numberInputProps} value={form.defenseBonus} onChange={(e) => setValue('defenseBonus', e.target.value)} />
        </label>
      </OnboardingScreen>
    );
  }

  if (screenId === 'playerPower') {
    center = (
      <OnboardingScreen
        title="Усиления игрока"
        description="Необязательно. Можно оставить нули."
        footer={navFooter}
      >
        <label className="wizard-inline-field">
          <span>Бонус силы (урон), %</span>
          <input {...numberInputProps} value={form.strengthBonus} onChange={(e) => setValue('strengthBonus', e.target.value)} />
        </label>
        <label className="wizard-inline-field">
          <span>Бонус здоровья, %</span>
          <input {...numberInputProps} value={form.healthBonus} onChange={(e) => setValue('healthBonus', e.target.value)} />
        </label>
      </OnboardingScreen>
    );
  }

  if (screenId === 'extraIntro') {
    center = (
      <OnboardingScreen
        title="Тонкая настройка босса"
        description="Для большинства боссов хватает значений от типа и сложности."
        footer={(
          <div className="wizard-actions wizard-actions-stack">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setShowExtraTune(false);
                setValue('bossArmor', '');
                setValue('attackInterval', '');
                setValue('regenInterval', '');
                setValue('regenPercent', '');
                setValue('attackChunks', '');
                goNext();
              }}
            >
              Оставить автоматически
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowExtraTune(true);
                setScreenIndex(ALL_SCREENS.indexOf('extraTune'));
              }}
            >
              Настроить вручную
            </button>
            <button type="button" className="ghost-button" onClick={goBack}>Назад</button>
          </div>
        )}
      >
        <ul className="wizard-bullet-list muted">
          <li>Броня сейчас: {config.bossArmor}%</li>
          <li>Атака: {config.attackRawDamage} раз в {config.attackInterval} х.</li>
          <li>Реген: {round(config.regenPercent, 1)}% раз в {config.regenInterval} х.</li>
        </ul>
      </OnboardingScreen>
    );
  }

  if (screenId === 'extraTune') {
    const setAuto = (key) => setValue(key, '');
    center = (
      <OnboardingScreen
        title="Броня, атака и реген"
        description="Пустое поле = автоматический расчёт."
        footer={navFooter}
      >
        <div className="wizard-tune-list">
          {[
            ['bossArmor', 'Броня босса, %', autoConfig.bossArmor],
            ['attackInterval', 'Атака раз в N ходов', autoConfig.attackInterval],
            ['attackChunks', 'Частей атаки', autoConfig.attackChunks],
            ['regenInterval', 'Реген раз в N ходов', autoConfig.regenInterval],
            ['regenPercent', 'Реген, % HP', autoConfig.regenPercent]
          ].map(([key, label, autoVal]) => (
            <label className="wizard-tune-row" key={key}>
              <span>{label}</span>
              <input
                {...numberInputProps}
                placeholder={`auto ${autoVal}`}
                value={form[key]}
                onChange={(e) => setValue(key, e.target.value)}
              />
              <button type="button" className="ghost-button tiny" onClick={() => setAuto(key)}>Auto</button>
            </label>
          ))}
        </div>
      </OnboardingScreen>
    );
  }

  if (screenId === 'fieldIntro') {
    center = (
      <OnboardingScreen
        title="Поле и проверка"
        description="Веса тайлов влияют на урон и защиту. Для начала подойдут стандартные."
        footer={(
          <div className="wizard-actions wizard-actions-stack">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                resetWeights();
                setShowFieldWeights(false);
                goNext();
              }}
            >
              Стандартные веса
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowFieldWeights(true);
                setScreenIndex(ALL_SCREENS.indexOf('fieldWeights'));
              }}
            >
              Настроить веса
            </button>
            <button type="button" className="ghost-button" onClick={goBack}>Назад</button>
          </div>
        )}
      >
        <label className="wizard-inline-field">
          <span>Попыток автопроверки</span>
          <input {...numberInputProps} value={form.attempts} onChange={(e) => setValue('attempts', e.target.value)} />
        </label>
      </OnboardingScreen>
    );
  }

  if (screenId === 'fieldWeights') {
    center = (
      <OnboardingScreen
        title="Веса тайлов"
        description="Чем больше число — тем чаще тайл на поле."
        footer={navFooter}
      >
        <div className="wizard-tile-weights">
          {Object.values(TILES).map((tile) => (
            <label className="wizard-tune-row" key={tile.id}>
              <span>{tile.short} {tile.label}</span>
              <input
                {...numberInputProps}
                value={form.weights[tile.id]}
                onChange={(e) => setForm((current) => updateNestedWeight(current, tile.id, e.target.value))}
              />
            </label>
          ))}
        </div>
        <button type="button" className="ghost-button" onClick={resetWeights}>Сбросить к стандарту</button>
      </OnboardingScreen>
    );
  }

  if (screenId === 'finish') {
    center = (
      <OnboardingScreen
        title="Босс готов"
        description="Проверь баланс автобоем — так поймёшь, проходимый ли босс."
        footer={(
          <div className="wizard-actions wizard-actions-stack">
            <button type="button" className="primary-button" onClick={onRunFullSimulation}>
              {simulation ? 'Проверить снова' : 'Проверить босса'}
            </button>
            {simulation ? (
              <>
                <p className={`wizard-result-line tone-${sidebar.status.tone}`}>
                  Win rate: <b>{simulation.winRate}%</b> ({simulation.wins}/{simulation.attempts})
                </p>
                <button type="button" className="secondary-button" onClick={onGoToSimulation}>
                  Подробная симуляция
                </button>
              </>
            ) : null}
            <button type="button" className="ghost-button" onClick={onGoManual}>
              Открыть ручной режим
            </button>
            <button type="button" className="ghost-button" onClick={goBack}>Назад</button>
          </div>
        )}
      >
        <dl className="wizard-summary-list">
          <div><dt>Имя</dt><dd>{config.bossName}</dd></div>
          <div><dt>Тип</dt><dd>{config.bossType.label}</dd></div>
          <div><dt>HP</dt><dd>{config.bossMaxHp}</dd></div>
          <div><dt>Игрок</dt><dd>{config.playerBattleHp} HP</dd></div>
        </dl>
      </OnboardingScreen>
    );
  }

  return (
    <div className="wizard-shell">
      <WizardNav
        screenIndex={screenIndex}
        onJump={(index) => setScreenIndex(index)}
      />
      <section className="wizard-center panel">
        {center}
      </section>
      <WizardHints sidebar={sidebar} />
    </div>
  );
}
