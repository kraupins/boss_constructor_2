import React from 'react';
import { TILES, round } from '../simulator.js';

export const numberInputProps = { type: 'number', step: 'any' };

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function AutoNumberField({ label, value, autoValue, hint, onChange }) {
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
        >
          {isAuto ? 'Зафикс.' : 'Auto'}
        </button>
      </div>
      {!hint ? null : <span className="field-hint">{isAuto ? `Auto: ${displayAuto}` : `Было auto: ${displayAuto}`}</span>}
    </label>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint ? <div className="stat-hint">{hint}</div> : null}
    </div>
  );
}

export function TileBadge({ tileId }) {
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

export function AccordionSection({ title, description, open, onToggle, children }) {
  return (
    <section className={`manual-accordion ${open ? 'open' : ''}`}>
      <button type="button" className="manual-accordion-head" onClick={onToggle}>
        <div>
          <strong>{title}</strong>
          {description ? <span>{description}</span> : null}
        </div>
        <span className="manual-accordion-chevron">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="manual-accordion-body">{children}</div> : null}
    </section>
  );
}

export function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="section-title">
      {eyebrow ? <p className="eyebrow small">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {text ? <p className="muted section-text">{text}</p> : null}
    </div>
  );
}

export function KeyValueList({ rows }) {
  return (
    <dl className="kv-list">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
