import React, { useMemo, useState } from 'react';
import { getBalanceStatus } from './balanceHints.js';
import HomeScreen from './components/HomeScreen.jsx';
import InstructionView from './components/InstructionView.jsx';
import ManualView from './components/manual/ManualView.jsx';
import {
  AutoNumberField,
  Field,
  SectionTitle,
  StatCard,
  TileBadge
} from './components/shared.jsx';
import WizardView from './components/WizardView.jsx';
import {
  DEFAULT_WEIGHTS,
  calculateConfig,
  createDefaultForm,
  createPlayerBattle,
  generateRandomBossForm,
  getPlayerHint,
  reshufflePlayerBattle,
  runAttempts,
  togglePlayerSelection
} from './simulator.js';

function updateNestedWeight(form, tileId, value) {
  return {
    ...form,
    weights: {
      ...form.weights,
      [tileId]: value
    }
  };
}

export default function App() {
  const [form, setForm] = useState(createDefaultForm);
  const [simulation, setSimulation] = useState(null);
  const [appMode, setAppMode] = useState('home');
  const [wizardScreenIndex, setWizardScreenIndex] = useState(0);
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

  const runSimulationForForm = (sourceForm, options = {}) => {
    const nextRunIndex = runIndex + 1;
    const freshConfig = calculateConfig(sourceForm);
    const result = runAttempts(freshConfig, {
      attempts: sourceForm.attempts,
      maxTurns: sourceForm.maxTurns,
      seed: `${sourceForm.seed || 'mergecraft'}-run-${nextRunIndex}`
    });
    setRunIndex(nextRunIndex);
    setSimulation(result);
    if (options.switchTab !== false) {
      setActiveTab('simulation');
      if (appMode === 'wizard') setAppMode('manual');
    }
    return result;
  };

  const simulate = () => runSimulationForForm(form);

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
    setGenerationMessage(`Готово: ${nextForm.bossName}`);
    setActiveTab('generator');
    if (appMode === 'home') setAppMode('manual');
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
    setGenerationMessage(`Проверен: ${nextForm.bossName}`);
    if (appMode === 'home') setAppMode('manual');
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
      return togglePlayerSelection(config, current, cell);
    });
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
      setCopyStatus('Скопируй текст вручную из поля ниже.');
    }
  };

  return (
    <main className="app">
      <header className={`hero compact-hero ${appMode === 'wizard' ? 'wizard-topbar' : ''} ${appMode === 'manual' ? 'manual-topbar' : ''}`}>
        <div>
          <p className="eyebrow">MergeCraft</p>
          <h1>
            {appMode === 'home' && 'Конструктор боссов'}
            {appMode === 'instruction' && 'Инструкция'}
            {appMode === 'wizard' && 'Мастер настройки'}
            {appMode === 'manual' && (config.bossName || 'Ручной режим')}
          </h1>
          {appMode === 'home' ? (
            <p className="hero-text">Мастер, полный режим или подробная инструкция — на твой выбор.</p>
          ) : null}
          {appMode === 'instruction' ? (
            <p className="hero-text">Wiki: формулы, бой, тайлы и инструменты — всё по полочкам.</p>
          ) : null}
        </div>
        <div className="hero-actions">
          {appMode !== 'home' ? (
            <button type="button" className="secondary-button" onClick={() => setAppMode('home')}>
              На главную
            </button>
          ) : null}
          {appMode === 'manual' && activeTab !== 'simulation' ? (
            <button type="button" className="primary-button" onClick={simulate}>Проверить</button>
          ) : null}
        </div>
      </header>

      {appMode === 'home' ? (
        <HomeScreen
          onManual={() => {
            setAppMode('manual');
            setActiveTab('builder');
          }}
          onWizard={() => {
            setAppMode('wizard');
            setWizardScreenIndex(0);
          }}
          onInstruction={() => setAppMode('instruction')}
        />
      ) : null}

      {appMode === 'instruction' ? (
        <section className="content single">
          <InstructionView />
        </section>
      ) : (
      <section className="content single">
        {appMode === 'wizard' ? (
          <WizardView
            form={form}
            setForm={setForm}
            setValue={setValue}
            resetWeights={resetWeights}
            autoConfig={autoConfig}
            config={config}
            screenIndex={wizardScreenIndex}
            setScreenIndex={setWizardScreenIndex}
            runIndex={runIndex}
            simulation={simulation}
            onRunFullSimulation={() => runSimulationForForm(form, { switchTab: false })}
            onGoToSimulation={() => {
              setAppMode('manual');
              setActiveTab('simulation');
            }}
            onGoManual={() => {
              setAppMode('manual');
              setActiveTab('builder');
            }}
            updateNestedWeight={updateNestedWeight}
            Field={Field}
            AutoNumberField={AutoNumberField}
            SectionTitle={SectionTitle}
            StatCard={StatCard}
            TileBadge={TileBadge}
          />
        ) : null}

        {appMode === 'manual' ? (
          <ManualView
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            form={form}
            setForm={setForm}
            setValue={setValue}
            resetWeights={resetWeights}
            autoConfig={autoConfig}
            config={config}
            simulation={simulation}
            status={status}
            generatorOptions={generationOptions}
            setGeneratorOptions={setGenerationOptions}
            generationMessage={generationMessage}
            onGenerate={generateBoss}
            onGenerateAndSimulate={generateAndSimulate}
            onSimulate={simulate}
            runIndex={runIndex}
            playerBattle={playerBattle}
            playerHint={playerHint}
            onStartPlay={startPlayerTry}
            onCellClick={clickPlayerCell}
            onHint={() => playerBattle && setPlayerHint(getPlayerHint(config, playerBattle))}
            onClearHint={() => setPlayerHint(null)}
            onReshuffle={() => setPlayerBattle((c) => reshufflePlayerBattle(config, c))}
            copyStatus={copyStatus}
            onCopy={copyText}
          />
        ) : null}
      </section>
      )}
    </main>
  );
}
