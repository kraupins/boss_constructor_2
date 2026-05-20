import React from 'react';

export default function HomeScreen({ onManual, onWizard, onInstruction }) {
  return (
    <div className="home-screen">
      <section className="home-intro panel compact">
        <p className="eyebrow small">MergeCraft</p>
        <h1>Конструктор боссов</h1>
        <p className="muted home-lead">
          Настрой босса для match-3 боя: расчёт статов, симуляция, ручной трай и экспорт. Выбери способ настройки.
        </p>
      </section>

      <div className="home-cards home-cards-triple">
        <button type="button" className="home-card" onClick={onManual}>
          <span className="home-card-icon">⚙</span>
          <h2>Ручная настройка</h2>
          <p>Меню слева, настройки по блокам, симуляция, трай и экспорт — без лишней информации на экране.</p>
          <span className="home-card-cta">Открыть конструктор →</span>
        </button>

        <button type="button" className="home-card home-card-accent" onClick={onWizard}>
          <span className="home-card-icon">✦</span>
          <h2>Мастер (Wizard)</h2>
          <p>Как настройка на телефоне: одно действие на экран, подсказки справа, без лишних полей.</p>
          <span className="home-card-cta">Начать мастер →</span>
        </button>

        <button type="button" className="home-card home-card-wiki" onClick={onInstruction}>
          <span className="home-card-icon">📖</span>
          <h2>Инструкция</h2>
          <p>Wiki по инструменту: каждая формула, каждый тайл и каждый шаг боя — простым языком, с примерами.</p>
          <span className="home-card-cta">Открыть справочник →</span>
        </button>
      </div>
    </div>
  );
}
