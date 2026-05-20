import React, { useEffect, useMemo, useState } from 'react';
import { INSTRUCTION_ARTICLES, INSTRUCTION_CATEGORIES } from '../instructionContent.js';
import { TileBadge } from './shared.jsx';

function BlockRenderer({ block }) {
  if (block.type === 'text') {
    return <p className="wiki-p">{block.content}</p>;
  }

  if (block.type === 'formula') {
    return <pre className="wiki-formula">{block.content}</pre>;
  }

  if (block.type === 'example') {
    return (
      <div className="wiki-example">
        <p className="wiki-example-label">Пример: {block.title}</p>
        <p>{block.content}</p>
      </div>
    );
  }

  if (block.type === 'list') {
    return (
      <ul className="wiki-list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="wiki-table-wrap">
        <table className="wiki-table">
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join('|')}>
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'tip') {
    return (
      <div className={`wiki-tip tone-${block.tone ?? 'info'}`}>
        <strong>{block.title}</strong>
        <p>{block.content}</p>
      </div>
    );
  }

  if (block.type === 'tiles') {
    return (
      <div className="wiki-tiles">
        {block.ids.map((tileId) => (
          <span className="wiki-tile-chip" key={tileId}>
            <TileBadge tileId={tileId} />
          </span>
        ))}
      </div>
    );
  }

  return null;
}

function WikiArticle({ article, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className={`wiki-article ${open ? 'open' : ''}`}>
      <button type="button" className="wiki-article-head" onClick={() => setOpen((v) => !v)}>
        <div>
          <h3>{article.title}</h3>
        </div>
        <span className="wiki-article-chevron">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="wiki-article-body">
          {article.blocks.map((block, index) => (
            <BlockRenderer block={block} key={`${article.id}-${index}`} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function InstructionView() {
  const [categoryId, setCategoryId] = useState(INSTRUCTION_CATEGORIES[0].id);
  const [query, setQuery] = useState('');

  const category = INSTRUCTION_CATEGORIES.find((item) => item.id === categoryId) ?? INSTRUCTION_CATEGORIES[0];

  const articles = useMemo(() => {
    const list = INSTRUCTION_ARTICLES[categoryId] ?? [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return list;

    return list.filter((article) => {
      const haystack = [
        article.title,
        ...article.blocks.flatMap((block) => {
          if (block.type === 'text' || block.type === 'formula' || block.type === 'example') return [block.content, block.title ?? ''];
          if (block.type === 'list') return block.items;
          if (block.type === 'tip') return [block.title, block.content];
          if (block.type === 'table') return [...block.headers, ...block.rows.flat()];
          return [];
        })
      ]
        .flat()
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [categoryId, query]);

  useEffect(() => {
    const main = document.querySelector('.instruction-center');
    if (main) main.scrollTop = 0;
  }, [categoryId]);

  return (
    <div className="instruction-shell">
      <nav className="instruction-nav-left panel" aria-label="Разделы инструкции">
        <p className="eyebrow small">Категории</p>
        <ul className="wizard-nav-list">
          {INSTRUCTION_CATEGORIES.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={`wizard-nav-item ${categoryId === item.id ? 'active' : ''}`}
                onClick={() => setCategoryId(item.id)}
              >
                <span className="wizard-nav-dot" aria-hidden>{index + 1}</span>
                <span className="instruction-nav-label">
                  <span className="instruction-nav-icon">{item.icon}</span>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="instruction-center panel">
        <header className="instruction-head">
          <div>
            <p className="eyebrow small">Инструкция</p>
            <h2>{category.label}</h2>
            <p className="instruction-lead">{category.description}</p>
          </div>
          <label className="instruction-search">
            <span className="field-label">Поиск в разделе</span>
            <input
              type="search"
              placeholder="Например: каскад, броня, реген…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </header>

        {articles.length === 0 ? (
          <p className="muted instruction-empty">Ничего не найдено. Сбрось поиск или открой другую категорию.</p>
        ) : (
          <div className="wiki-articles">
            {articles.map((article, index) => (
              <WikiArticle article={article} key={article.id} defaultOpen={index === 0 && !query} />
            ))}
          </div>
        )}
      </section>

      <aside className="instruction-aside panel">
        <p className="eyebrow small">Подсказка</p>
        <p className="instruction-aside-lead">
          Открой статью кнопкой «+». Всё написано простым языком: сначала смысл, потом формула, потом пример с числами.
        </p>
        <ul className="instruction-aside-tips">
          <li>Новичку: «С чего начать» → «Ход боя» → «Все формулы»</li>
          <li>Балансировщику: «Урон игрока», «Босс», «Инструменты»</li>
          <li>Быстрые определения: «Словарь»</li>
        </ul>
        <p className="instruction-aside-note muted">
          Числа в примерах иллюстративные. Реальные значения смотри в конструкторе после настройки босса.
        </p>
      </aside>
    </div>
  );
}
