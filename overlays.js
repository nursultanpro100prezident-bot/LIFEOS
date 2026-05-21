/* eslint-disable */
// LIFEOS — overlays.js
// L1/L2 modal, QuickAdd (saves to IndexedDB), Search, DayOverview

const { useState: useStateO, useEffect: useEffectO, useRef: useRefO, useMemo: useMemoO } = React;
const VIEWS = window.LIFEOS_VIEWS;
const DATA  = window.LIFEOS_DATA;
const { Icon, fmtH } = VIEWS;
const { CATEGORIES, CAT_BY_ID, WEEK_BLOCKS, tintStyle } = DATA;

// ── L1 + L2 SHARED CARD ──────────────────────────────────────────────────────
function BlockOverlay({ block, onClose, initialPhase = 'l1' }) {
  const [phase, setPhase]         = useStateO(initialPhase);
  const [closing, setClosing]     = useStateO(false);
  const [checkedItems, setChecked]= useStateO(new Set());

  const cat = DATA.CAT_BY_ID[block.cat];

  // Load persisted checklist state from IndexedDB
  useEffectO(() => {
    if (!window.LIFEOS_DB || !block.id || block.id === 'stub') return;
    window.LIFEOS_DB.loadChecklistState(block.id).then(saved => setChecked(saved));
  }, [block.id]);

  const close = () => { setClosing(true); setTimeout(onClose, 320); };

  useEffectO(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { if (phase === 'l2') setPhase('l1'); else close(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const goalProgress = cat.goals.reduce((s, g) => s + g.progress, 0) / cat.goals.length;

  const toggleCheck = async (i) => {
    const next = new Set(checkedItems);
    if (next.has(i)) next.delete(i); else next.add(i);
    setChecked(next);
    if (window.LIFEOS_DB && block.id !== 'stub') {
      window.LIFEOS_DB.saveChecklistState(block.id, next);
    }
  };

  const cardStyle = phase === 'l2'
    ? { left: '0', top: '0', right: '0', bottom: '0', width: '100%', height: '100%', borderRadius: 0, border: 'none' }
    : { left: '50%', top: '50%', width: 'min(640px, 90vw)', height: 'min(820px, 88vh)', transform: 'translate(-50%, -50%)', borderRadius: 'var(--r-lg)' };

  return (
    <>
      <div className="scrim" onClick={close} style={{ opacity: closing ? 0 : undefined, transition: 'opacity 280ms var(--ease)' }}/>
      <div
        className={`l1-l2-card ${phase} ${closing ? 'closing' : ''}`}
        style={{ ...tintStyle(block.cat), position: 'fixed', zIndex: 65, background: 'var(--bg)', boxShadow: 'var(--shadow-modal)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 520ms var(--ease)', opacity: closing ? 0 : 1, ...cardStyle }}
      >
        <SharedHero block={block} cat={cat} phase={phase} onBack={() => setPhase('l1')} onClose={close} goalProgress={goalProgress}/>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: phase === 'l1' ? 1 : 0, transform: phase === 'l1' ? 'translateY(0)' : 'translateY(-12px)', transition: 'opacity 220ms var(--ease), transform 320ms var(--ease)', pointerEvents: phase === 'l1' ? 'auto' : 'none', overflowY: 'auto' }}>
            <L1Body block={block} cat={cat} checkedItems={checkedItems} toggleCheck={toggleCheck} onOpenContext={() => setPhase('l2')}/>
          </div>
          <div style={{ position: 'absolute', inset: 0, opacity: phase === 'l2' ? 1 : 0, transform: phase === 'l2' ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 320ms 120ms var(--ease), transform 520ms var(--ease)', pointerEvents: phase === 'l2' ? 'auto' : 'none', overflowY: 'auto' }}>
            <L2Body cat={cat} block={block}/>
          </div>
        </div>
      </div>
    </>
  );
}

// ── SHARED HERO ───────────────────────────────────────────────────────────────
function SharedHero({ block, cat, phase, onBack, onClose, goalProgress }) {
  const isL2 = phase === 'l2';
  return (
    <div style={{ background: 'oklch(var(--tint))', position: 'relative', flexShrink: 0, padding: isL2 ? '36px 48px 28px' : '22px 24px 18px', transition: 'padding 520ms var(--ease)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: isL2 ? 6 : 4, background: 'oklch(var(--tint-bar))', transition: 'width 520ms var(--ease)' }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isL2 ? 22 : 14, transition: 'margin 520ms var(--ease)' }}>
        {isL2 ? (
          <button className="l2-back" onClick={onBack} style={{ background: 'oklch(var(--tint-ink) / 0.08)', color: 'oklch(var(--tint-ink))' }}>
            <Icon name="chevron-l" size={16}/><span>{block.title}</span>
          </button>
        ) : (
          <div className="l1-cat-badge"><span className="lb-dot"/>{cat.name}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          {isL2 && <button className="icon-btn" style={{ background: 'oklch(var(--tint-ink) / 0.06)', borderColor: 'transparent', color: 'oklch(var(--tint-ink))' }}><Icon name="sparkles" size={16}/></button>}
          {isL2 && <button className="icon-btn" style={{ background: 'oklch(var(--tint-ink) / 0.06)', borderColor: 'transparent', color: 'oklch(var(--tint-ink))' }}><Icon name="attach" size={16}/></button>}
          <button className="icon-btn" onClick={onClose} style={{ background: 'oklch(var(--tint-ink) / 0.06)', borderColor: 'transparent', color: 'oklch(var(--tint-ink))' }}><Icon name="close" size={16}/></button>
        </div>
      </div>
      {isL2 ? (
        <>
          <div className="l2-cat-line"><span className="lc-dot"/>{cat.nameRu} · life area</div>
          <h1 className="l2-title" style={{ fontSize: 'clamp(48px, 7vw, 72px)' }}>{cat.nameRu}<span className="l2-title-sub">{cat.name}</span></h1>
          <p className="l2-tagline">{cat.tagline}</p>
          <div className="l2-stats">
            <div className="l2-stat"><span className="num">{cat.goals.length}</span><span className="lbl">целей</span></div>
            <div className="l2-stat"><span className="num">{Math.round(goalProgress)}%</span><span className="lbl">прогресс</span></div>
            <div className="l2-stat"><span className="num">{DATA.WEEK_BLOCKS.filter(b => b.cat === cat.id).length}</span><span className="lbl">блоков</span></div>
            <div className="l2-stat"><span className="num">{cat.links.length}</span><span className="lbl">материалов</span></div>
          </div>
        </>
      ) : (
        <>
          <h1 className="l1-title" style={{ fontSize: 32 }}>{block.title}</h1>
          <div className="l1-time">
            <Icon name="clock" size={14}/>
            <span>{fmtH(block.start)} — {fmtH(block.end)}</span>
            {block.recur && <><span style={{ opacity: 0.4 }}>·</span><Icon name="recur" size={12}/><span>повторение</span></>}
          </div>
        </>
      )}
    </div>
  );
}

// ── L1 BODY ───────────────────────────────────────────────────────────────────
function L1Body({ block, cat, checkedItems, toggleCheck, onOpenContext }) {
  return (
    <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {block.location && (
        <div className="l1-row">
          <div className="l1-label">Место</div>
          <div className="l1-val"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="pin" size={14}/>{block.location}</span></div>
        </div>
      )}
      {block.notes && (
        <div className="l1-row">
          <div className="l1-label">Заметка</div>
          <div className="l1-val muted">{block.notes}</div>
        </div>
      )}
      {block.checklist && (
        <div className="l1-row">
          <div className="l1-label">Чек-лист</div>
          <div className="l1-val" style={{ width: '100%' }}>
            <div className="checklist">
              {block.checklist.map((item, i) => {
                const done = checkedItems.has(i);
                return (
                  <div key={i} className={`check-item ${done ? 'done' : ''}`} onClick={() => toggleCheck(i)}>
                    <div className="check-box">{done && <Icon name="check" size={12}/>}</div>
                    <div className="check-text">{item}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 8, letterSpacing: '0.04em' }}>
              {checkedItems.size} / {block.checklist.length} выполнено
            </div>
          </div>
        </div>
      )}
      <div className="l1-row">
        <div className="l1-label">Напомнить</div>
        <div className="l1-val"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="bell" size={14}/>За 10 минут до начала</span></div>
      </div>
      <div className="l1-context-cta" onClick={onOpenContext} style={{ marginTop: 8 }}>
        <div>
          <div className="label-mono">второй уровень · life area</div>
          <div className="cta-title">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'oklch(var(--tint-bar))' }}/>
            Открыть контекст «{cat.nameRu}»
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.02em' }}>
            {cat.goals.length} целей · {cat.links.length} материалов · история
          </div>
        </div>
        <div className="cta-arrow"><Icon name="arrow-r" size={20}/></div>
      </div>
    </div>
  );
}

// ── L2 BODY ───────────────────────────────────────────────────────────────────
function L2Body({ cat }) {
  return (
    <div className="l2-body">
      <div className="l2-block">
        <div className="l2-block-head"><h3>Цели направления</h3><span className="count-mono">{cat.goals.length} активных</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cat.goals.map(g => (
            <div key={g.id} className="goal-item">
              <div className="goal-row1"><div className="goal-title">{g.title}</div><div className="goal-due">{g.due}</div></div>
              <div className="goal-progress"><span style={{ width: `${g.progress}%` }}/></div>
              <div className="goal-meta"><span>{g.owner}</span><span style={{ color: 'var(--ink)' }}>{g.progress}%</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="l2-block">
        <div className="l2-block-head"><h3>Заметка направления</h3><span className="count-mono">обновлено вчера</span></div>
        <div className="notes-card">{cat.notes}</div>
        <div className="l2-block-head" style={{ marginTop: 16 }}><h3>Материалы и ссылки</h3><span className="count-mono">{cat.links.length}</span></div>
        <div className="linked-grid">
          {cat.links.map(l => (
            <div key={l.id} className="link-pill">
              <div className="lp-icon"><Icon name="attach" size={12}/></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{l.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="l2-block full">
        <div className="l2-block-head"><h3>Активность · 12 недель</h3><span className="count-mono">ч/нед</span></div>
        <div className="history-strip">
          {cat.history.map((v, i) => {
            const max = Math.max(...cat.history);
            return <div key={i} className={`hs-bar ${i === cat.history.length - 1 ? 'active' : ''}`} style={{ height: `${(v / max) * 100}%` }} title={`Нед ${i+1}: ${v} ч`}/>;
          })}
        </div>
        <div className="hs-labels"><span>12 нед. назад</span><span>9 нед.</span><span>6 нед.</span><span>3 нед.</span><span>текущая</span></div>
      </div>
      <div className="l2-block full">
        <div className="l2-block-head"><h3>Блоки · текущая неделя</h3><span className="count-mono">{DATA.WEEK_BLOCKS.filter(b => b.cat === cat.id).length}</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DATA.WEEK_BLOCKS.filter(b => b.cat === cat.id).map(b => (
            <div key={b.id} className="allday-chip" style={tintStyle(b.cat)}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>{VIEWS.DOW_FULL[b.day].slice(0,2)}</span>
              <span>{b.title}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>{fmtH(b.start)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
function SearchModal({ onClose, onOpenBlock, onOpenCategory }) {
  const [q, setQ] = useStateO('');
  const inputRef = useRefO(null);
  useEffectO(() => { inputRef.current?.focus(); }, []);
  useEffectO(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemoO(() => {
    const norm = q.trim().toLowerCase();
    const blocks = DATA.WEEK_BLOCKS.filter(b => !norm || b.title.toLowerCase().includes(norm) || (b.notes && b.notes.toLowerCase().includes(norm)));
    const cats   = DATA.CATEGORIES.filter(c => !norm || c.nameRu.toLowerCase().includes(norm) || c.name.toLowerCase().includes(norm));
    const goals  = DATA.CATEGORIES.flatMap(c => c.goals.map(g => ({ ...g, catId: c.id, catName: c.nameRu }))).filter(g => !norm || g.title.toLowerCase().includes(norm));
    return { blocks: blocks.slice(0, 6), cats: cats.slice(0, 4), goals: goals.slice(0, 4) };
  }, [q]);

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet entering" style={{ left: '50%', top: '12%', transform: 'translateX(-50%)', width: 'min(720px, 92vw)', maxHeight: '76vh' }}>
        <div className="search-input-row">
          <Icon name="search" size={20}/>
          <input ref={inputRef} className="search-input" placeholder="Поиск: блоки, цели, направления…" value={q} onChange={(e) => setQ(e.target.value)}/>
          <span className="search-kbd">esc</span>
        </div>
        <div className="search-results">
          {results.blocks.length > 0 && <>
            <div className="search-group-title">Тайм-блоки · {results.blocks.length}</div>
            {results.blocks.map(b => {
              const c = DATA.CAT_BY_ID[b.cat];
              return (
                <div key={b.id} className="search-row" style={tintStyle(b.cat)} onClick={() => { onOpenBlock(b); onClose(); }}>
                  <div className="sr-icon"><Icon name="clock" size={16}/></div>
                  <div className="sr-main">
                    <div className="sr-title">{b.title}</div>
                    <div className="sr-sub">{VIEWS.DOW_FULL[b.day]} · {fmtH(b.start)} — {fmtH(b.end)} · {c.nameRu}</div>
                  </div>
                  <Icon name="chevron-r" size={14}/>
                </div>
              );
            })}
          </>}
          {results.cats.length > 0 && <>
            <div className="search-group-title">Направления</div>
            {results.cats.map(c => (
              <div key={c.id} className="search-row" style={tintStyle(c.id)} onClick={() => { onOpenCategory(c.id); onClose(); }}>
                <div className="sr-icon"><Icon name={c.icon} size={16}/></div>
                <div className="sr-main">
                  <div className="sr-title">{c.nameRu} <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.name}</span></div>
                  <div className="sr-sub">{c.tagline}</div>
                </div>
                <Icon name="chevron-r" size={14}/>
              </div>
            ))}
          </>}
          {results.goals.length > 0 && <>
            <div className="search-group-title">Цели</div>
            {results.goals.map(g => (
              <div key={g.id} className="search-row" style={tintStyle(g.catId)} onClick={() => { onOpenCategory(g.catId); onClose(); }}>
                <div className="sr-icon"><Icon name="flag" size={16}/></div>
                <div className="sr-main">
                  <div className="sr-title">{g.title}</div>
                  <div className="sr-sub">{g.catName} · {g.due} · {g.progress}%</div>
                </div>
                <Icon name="chevron-r" size={14}/>
              </div>
            ))}
          </>}
          {!results.blocks.length && !results.cats.length && !results.goals.length && q.trim() && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Ничего не найдено по «{q}»</div>
          )}
        </div>
      </div>
    </>
  );
}

// ── QUICK ADD (saves to IndexedDB) ────────────────────────────────────────────
function QuickAdd({ onClose, currentDay = 2 }) {
  const [tab, setTab]     = useStateO('block');
  const [cat, setCat]     = useStateO('business');
  const [title, setTitle] = useStateO('');
  const [startH, setStartH] = useStateO(9);
  const [endH, setEndH]     = useStateO(10);
  const [saving, setSaving] = useStateO(false);
  const inputRef = useRefO(null);

  useEffectO(() => { inputRef.current?.focus(); }, []);
  useEffectO(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) { inputRef.current?.focus(); return; }
    setSaving(true);
    try {
      if (window.LIFEOS_DB) {
        if (tab === 'block') {
          await window.LIFEOS_DB.saveBlock({ id: 'u_' + Date.now(), day: currentDay, start: startH, end: endH > startH ? endH : startH + 1, title: trimmed, cat });
        } else {
          await window.LIFEOS_DB.saveAllDay({ id: 'a_' + Date.now(), day: currentDay, title: trimmed, cat, type: tab });
        }
      }
    } catch(e) { console.error('[QuickAdd]', e); }
    onClose();
  };

  const DOW_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const tsStyle = { fontFamily: 'var(--font-mono)', fontSize: 12, border: '1px solid var(--hairline)', borderRadius: 6, padding: '3px 6px', background: 'var(--bg-soft)', color: 'var(--ink)', cursor: 'pointer' };

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet entering" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(560px, 92vw)' }}>
        <div style={{ padding: '20px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            {DOW_SHORT[currentDay]} · Быстро добавить
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
        </div>
        <div className="qa-tabs">
          <button aria-pressed={tab === 'block'}    onClick={() => setTab('block')}>Тайм-блок</button>
          <button aria-pressed={tab === 'task'}     onClick={() => setTab('task')}>Задача</button>
          <button aria-pressed={tab === 'reminder'} onClick={() => setTab('reminder')}>Напоминание</button>
        </div>
        <div className="qa-form">
          <input ref={inputRef} autoFocus className="qa-title-input"
            placeholder={tab === 'block' ? 'Название блока' : tab === 'task' ? 'Что нужно сделать?' : 'О чём напомнить?'}
            value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          />
          {tab === 'block' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>с</span>
              <select style={tsStyle} value={startH} onChange={e => { const h = Number(e.target.value); setStartH(h); if (h >= endH) setEndH(h + 1); }}>
                {Array.from({length: 17}, (_, i) => i + 6).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
              </select>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>до</span>
              <select style={tsStyle} value={endH} onChange={e => setEndH(Number(e.target.value))}>
                {Array.from({length: 17}, (_, i) => i + 7).map(h => <option key={h} value={h} disabled={h <= startH}>{String(h).padStart(2,'0')}:00</option>)}
              </select>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>· {endH - startH} ч</span>
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Направление</div>
            <div className="qa-cat-picker">
              {DATA.CATEGORIES.map(c => (
                <button key={c.id} className="qa-cat-chip" style={tintStyle(c.id)} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                  <span className="qcc-dot"/>{c.nameRu}
                </button>
              ))}
            </div>
          </div>
          <div className="qa-actions">
            <button className="btn ghost" onClick={onClose}>Отмена</button>
            <button className="btn solid" onClick={handleCreate} disabled={saving || !title.trim()} style={{ opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {saving ? 'Сохраняю…' : 'Создать'} {!saving && <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.6 }}>⏎</kbd>}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── DAY OVERVIEW ──────────────────────────────────────────────────────────────
function DayOverview({ dayIndex, onClose, onOpenBlock }) {
  const blocks = DATA.WEEK_BLOCKS.filter(b => b.day === dayIndex).sort((a, b) => a.start - b.start);
  const totals = {};
  blocks.forEach(b => { totals[b.cat] = (totals[b.cat] || 0) + (b.end - b.start); });
  const totalHrs = blocks.reduce((s, b) => s + (b.end - b.start), 0);
  useEffectO(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="sheet entering" style={{ left: '50%', top: '8%', transform: 'translateX(-50%)', width: 'min(560px, 92vw)', maxHeight: '84vh' }}>
        <div style={{ padding: '22px 24px 14px', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{VIEWS.DOW_FULL[dayIndex]}</div>
              <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4 }}>{VIEWS.WEEK_DATES[dayIndex]} {VIEWS.MONTHS_RU_GEN[4]}</div>
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="close" size={16}/></button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 18 }}>
            <div><div style={{ fontSize: 28, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{blocks.length}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>блоков</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{totalHrs.toFixed(1)}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>часов</div></div>
            <div><div style={{ fontSize: 28, fontWeight: 600, fontFeatureSettings: '"tnum"' }}>{(24 - totalHrs).toFixed(1)}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>свободно</div></div>
          </div>
          <div style={{ marginTop: 16, height: 8, background: 'var(--hairline-2)', borderRadius: 4, display: 'flex', overflow: 'hidden' }}>
            {Object.entries(totals).map(([cat, h]) => (
              <div key={cat} style={{ background: `oklch(var(--c-${cat}-bar))`, flex: h, height: '100%' }} title={`${DATA.CAT_BY_ID[cat].nameRu}: ${h} ч`}/>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {Object.entries(totals).sort((a,b) => b[1]-a[1]).map(([cat, h]) => (
              <div key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: `oklch(var(--c-${cat}-bar))` }}/>
                {DATA.CAT_BY_ID[cat].nameRu} · {h} ч
              </div>
            ))}
          </div>
        </div>
        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
          {blocks.map(b => (
            <div key={b.id} className="search-row" style={tintStyle(b.cat)} onClick={() => { onOpenBlock(b); onClose(); }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', width: 56, flexShrink: 0 }}>{fmtH(b.start)}</div>
              <div style={{ width: 3, alignSelf: 'stretch', background: 'oklch(var(--tint-bar))', borderRadius: 2 }}/>
              <div className="sr-main">
                <div className="sr-title">{b.title}</div>
                <div className="sr-sub">{fmtH(b.start)} — {fmtH(b.end)} · {DATA.CAT_BY_ID[b.cat].nameRu}</div>
              </div>
              {b.recur && <Icon name="recur" size={14}/>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CategoryProfileDirect({ catId, onClose }) {
  const cat = DATA.CAT_BY_ID[catId];
  const stubBlock = { id: 'stub', title: cat.nameRu, cat: catId, start: 0, end: 0 };
  return <BlockOverlay block={stubBlock} onClose={onClose} initialPhase="l2"/>;
}

window.LIFEOS_OVERLAYS = { BlockOverlay, SearchModal, QuickAdd, DayOverview, CategoryProfileDirect };
