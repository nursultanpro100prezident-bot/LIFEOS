/* eslint-disable */
// LIFEOS — views.jsx
// Day view, Week view, Daily Summary strip, Sidebar (mini-month + categories)

const { useState, useEffect, useMemo, useRef, useCallback } = React;
const { CATEGORIES, CAT_BY_ID, WEEK_BLOCKS, ALL_DAY, tintStyle } = window.LIFEOS_DATA;

// ============== ICONS (minimal stroke set) ==============
function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':   return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'plus':     return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close':    return <svg viewBox="0 0 24 24" {...s}><path d="m6 6 12 12M18 6 6 18"/></svg>;
    case 'chevron-r':return <svg viewBox="0 0 24 24" {...s}><path d="m9 6 6 6-6 6"/></svg>;
    case 'chevron-l':return <svg viewBox="0 0 24 24" {...s}><path d="m15 6-6 6 6 6"/></svg>;
    case 'check':    return <svg viewBox="0 0 24 24" {...s}><path d="m5 12 5 5 9-11"/></svg>;
    case 'recur':    return <svg viewBox="0 0 24 24" {...s}><path d="M3 12a9 9 0 0 1 16-5.7L20 8M21 12a9 9 0 0 1-16 5.7L4 16"/><path d="M20 4v4h-4M4 20v-4h4"/></svg>;
    case 'clock':    return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'bell':     return <svg viewBox="0 0 24 24" {...s}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'pin':      return <svg viewBox="0 0 24 24" {...s}><path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'list':     return <svg viewBox="0 0 24 24" {...s}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'briefcase':return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
    case 'spark':    return <svg viewBox="0 0 24 24" {...s}><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'book':     return <svg viewBox="0 0 24 24" {...s}><path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2Zm0 0a2 2 0 0 1 2-2h13"/></svg>;
    case 'note':     return <svg viewBox="0 0 24 24" {...s}><path d="M9 18V6l12-3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/></svg>;
    case 'heart':    return <svg viewBox="0 0 24 24" {...s}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></svg>;
    case 'tree':     return <svg viewBox="0 0 24 24" {...s}><path d="M12 3 4 14h4l-3 5h14l-3-5h4Z"/><path d="M12 19v3"/></svg>;
    case 'coin':     return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M9 9h4a2 2 0 1 1 0 4h-2a2 2 0 1 0 0 4h4"/></svg>;
    case 'attach':   return <svg viewBox="0 0 24 24" {...s}><path d="m21 12-9 9a5 5 0 0 1-7-7l9-9a3 3 0 0 1 5 5l-9 9a1 1 0 0 1-2-2l8-8"/></svg>;
    case 'sun':      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>;
    case 'moon':     return <svg viewBox="0 0 24 24" {...s}><path d="M21 13.5A9 9 0 1 1 10.5 3a7 7 0 0 0 10.5 10.5Z"/></svg>;
    case 'expand':   return <svg viewBox="0 0 24 24" {...s}><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>;
    case 'arrow-r':  return <svg viewBox="0 0 24 24" {...s}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-up': return <svg viewBox="0 0 24 24" {...s}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'flag':     return <svg viewBox="0 0 24 24" {...s}><path d="M5 21V4a1 1 0 0 1 1-1h12l-2 4 2 4H6"/></svg>;
    case 'sparkles': return <svg viewBox="0 0 24 24" {...s}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5 9 9M15 15l3.5 3.5M5.5 18.5 9 15M15 9l3.5-3.5"/></svg>;
    case 'cmd':      return <svg viewBox="0 0 24 24" {...s}><path d="M9 9h6v6H9z"/><path d="M9 9V6a3 3 0 1 0-3 3h3ZM9 15v3a3 3 0 1 1-3-3h3ZM15 9V6a3 3 0 1 1 3 3h-3ZM15 15v3a3 3 0 1 0 3-3h-3Z"/></svg>;
  }
  return null;
}

// ============== UTILITIES ==============
const HOUR_PX = 56;   // height of one hour in day-view
const DAY_START = 6;  // 06:00
const DAY_END = 22;   // 22:00

function fmtH(hFloat) {
  const h = Math.floor(hFloat);
  const m = Math.round((hFloat - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DOW_SHORT = ['пн','вт','ср','чт','пт','сб','вс'];
const DOW_FULL  = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTHS_RU_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

// Demo "now" — fixed for prototype: Wed May 20 2026, 10:28
const NOW = { day: 2, hour: 10 + 28/60 };
const WEEK_DATES = [18, 19, 20, 21, 22, 23, 24]; // mon-sun

// ============== SIDEBAR ==============
function Sidebar({ catFilters, setCatFilters, selectedDay, setSelectedDay, onOpenCategory }) {
  // Mini-month for May 2026
  const monthGrid = useMemo(() => {
    // May 1 2026 is Friday; week starts Monday → 4 leading dim cells
    const cells = [];
    const dimBefore = 4;
    const days = 31;
    const totalCells = 42;
    for (let i = 0; i < dimBefore; i++) cells.push({ d: 30 - dimBefore + i + 1, dim: true });
    for (let i = 1; i <= days; i++) cells.push({ d: i, dim: false });
    while (cells.length < totalCells) cells.push({ d: cells.length - dimBefore - days + 1, dim: true });
    return cells;
  }, []);

  const toggleCat = (id) => {
    const next = new Set(catFilters);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCatFilters(next);
  };

  // Count blocks per category in the week
  const counts = useMemo(() => {
    const m = {};
    WEEK_BLOCKS.forEach(b => { m[b.cat] = (m[b.cat] || 0) + 1; });
    return m;
  }, []);

  return (
    <aside className="sidebar">
      <div>
        <h2 className="side-section-title">Май · 2026</h2>
        <div className="mini-month">
          {['П','В','С','Ч','П','С','В'].map((d, i) => <div className="dow" key={i}>{d}</div>)}
          {monthGrid.map((c, i) => {
            if (c.dim) return <div key={i} className="day dim">{c.d}</div>;
            const isToday = c.d === 20;
            const isSel = WEEK_DATES.includes(c.d) && selectedDay === WEEK_DATES.indexOf(c.d);
            return (
              <button
                key={i}
                className={`day ${isToday ? 'today' : ''} ${isSel ? 'sel' : ''}`}
                onClick={() => {
                  const idx = WEEK_DATES.indexOf(c.d);
                  if (idx >= 0) setSelectedDay(idx);
                }}
              >{c.d}</button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="side-section-title">Направления жизни</h2>
        <div className="cat-list">
          {CATEGORIES.map(cat => {
            const active = catFilters.has(cat.id);
            return (
              <div
                key={cat.id}
                className={`cat-row ${active ? '' : 'muted'}`}
                style={tintStyle(cat.id)}
                onClick={(e) => { e.stopPropagation(); toggleCat(cat.id); }}
                onDoubleClick={() => onOpenCategory(cat.id)}
              >
                <span className="cat-dot" />
                <span style={{ flex: 1 }}>{cat.nameRu}</span>
                <span className="cat-count">{counts[cat.id] || 0}</span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', padding: '6px 8px' }}>
          dbl-click · открыть профиль
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <h2 className="side-section-title">Быстро</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="cat-row" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
            <kbd style={{ background: 'var(--bg-soft)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '2px 6px', fontSize: 10 }}>⌘K</kbd>
            <span>Quick add</span>
          </button>
          <button className="cat-row" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
            <kbd style={{ background: 'var(--bg-soft)', border: '1px solid var(--hairline)', borderRadius: 6, padding: '2px 6px', fontSize: 10 }}>⌘F</kbd>
            <span>Search life</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ============== TIME BLOCK ==============
function TimeBlock({ block, hourPx = HOUR_PX, dayStart = DAY_START, onClick, compact = false, density = 'cozy' }) {
  const cat = CAT_BY_ID[block.cat];
  const top = (block.start - dayStart) * hourPx;
  const height = Math.max((block.end - block.start) * hourPx - 2, 22);
  return (
    <button
      className={`block ${compact ? 'compact' : ''} block-${density}`}
      style={{
        ...tintStyle(block.cat),
        top, height,
      }}
      onClick={(e) => { e.stopPropagation(); onClick(block); }}
    >
      <div className="block-title">{block.title}</div>
      {!compact && height > 36 && (
        <div className="block-time">
          {fmtH(block.start)}<span style={{ opacity: 0.5 }}>—</span>{fmtH(block.end)}
          {block.recur && <span className="recur" style={{ marginLeft: 'auto' }}><Icon name="recur" size={11}/></span>}
        </div>
      )}
    </button>
  );
}

// ============== DAY VIEW ==============
function DayView({ blocks, allDayItems, dayIndex, onOpenBlock }) {
  const hours = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);

  const isToday = dayIndex === NOW.day;
  const containerRef = useRef(null);

  // Resolve overlap into columns
  const laid = useMemo(() => layoutOverlaps(blocks), [blocks]);

  // Scroll to ~now on mount
  useEffect(() => {
    if (containerRef.current && isToday) {
      const targetY = (NOW.hour - DAY_START - 1) * HOUR_PX;
      containerRef.current.scrollTop = Math.max(0, targetY);
    }
  }, [isToday]);

  return (
    <div className="dayview" ref={containerRef}>
      <div className="hours-gutter" style={{ height: (DAY_END - DAY_START) * HOUR_PX + 24 }}>
        {hours.map(h => (
          <div key={h} className="hour-label" style={{ top: (h - DAY_START) * HOUR_PX }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      <div className="day-canvas" style={{ height: (DAY_END - DAY_START) * HOUR_PX + 24, position: 'relative' }}>
        {hours.map(h => (
          <div key={h} className="day-grid-line" style={{ top: (h - DAY_START) * HOUR_PX }} />
        ))}
        {hours.slice(0, -1).map(h => (
          <div key={`h${h}`} className="day-grid-line half" style={{ top: (h + 0.5 - DAY_START) * HOUR_PX }} />
        ))}

        {laid.map(({ block, col, cols }) => {
          const cat = CAT_BY_ID[block.cat];
          const top = (block.start - DAY_START) * HOUR_PX;
          const height = Math.max((block.end - block.start) * HOUR_PX - 3, 24);
          const widthPct = 100 / cols;
          const leftPct = col * widthPct;
          return (
            <button
              key={block.id}
              className="block"
              style={{
                ...tintStyle(block.cat),
                top, height,
                left: `calc(${leftPct}% + 12px)`,
                width: `calc(${widthPct}% - 16px)`,
                right: 'auto',
              }}
              onClick={() => onOpenBlock(block)}
              data-block-id={block.id}
            >
              <div className="block-title">{block.title}</div>
              {height > 40 && (
                <div className="block-time">
                  {fmtH(block.start)} <span style={{ opacity: 0.5 }}>→</span> {fmtH(block.end)}
                  {block.recur && <span className="recur" style={{ marginLeft: 'auto' }}><Icon name="recur" size={11}/></span>}
                </div>
              )}
              {height > 80 && block.location && (
                <div className="block-meta">
                  <Icon name="pin" size={11}/>{block.location}
                </div>
              )}
              {height > 110 && block.checklist && (
                <div className="block-meta">
                  <Icon name="check" size={11}/>{block.checklist.length} пунктов
                </div>
              )}
            </button>
          );
        })}

        {isToday && (
          <div className="now-bar" style={{ top: (NOW.hour - DAY_START) * HOUR_PX }}>
            <span className="now-label">{fmtH(NOW.hour)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Greedy column packing for overlapping blocks
function layoutOverlaps(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const cols = []; // cols[i] = last end time
  const placed = [];
  for (const b of sorted) {
    let placedCol = -1;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i] <= b.start) { placedCol = i; break; }
    }
    if (placedCol === -1) { cols.push(b.end); placedCol = cols.length - 1; }
    else cols[placedCol] = b.end;
    placed.push({ block: b, col: placedCol });
  }
  // For each block, determine the total parallel cols at that time
  return placed.map(({ block, col }) => {
    const parallel = placed.filter(p => p.block.start < block.end && p.block.end > block.start);
    const maxCol = Math.max(...parallel.map(p => p.col));
    return { block, col, cols: maxCol + 1 };
  });
}

// ============== WEEK VIEW ==============
function WeekView({ onOpenBlock, density, onSelectDay }) {
  const hours = [];
  for (let h = DAY_START; h <= DAY_END; h++) hours.push(h);

  // Categorical density visualisation
  const colDensity = useMemo(() => {
    const out = WEEK_DATES.map(() => ({}));
    WEEK_BLOCKS.forEach(b => {
      out[b.day][b.cat] = (out[b.day][b.cat] || 0) + (b.end - b.start);
    });
    return out;
  }, []);

  return (
    <div className="weekview">
      <div className="hours-gutter" style={{ paddingTop: 88, position: 'relative' }}>
        {hours.map(h => (
          <div key={h} className="hour-label" style={{ top: 88 + (h - DAY_START) * HOUR_PX }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div className="weekgrid">
        <div className="week-heads">
          {WEEK_DATES.map((date, i) => (
            <div key={i} className={`week-head ${i === NOW.day ? 'today' : ''}`} onClick={() => onSelectDay && onSelectDay(i)}>
              <div className="dow">{DOW_SHORT[i]}</div>
              <div className="dom">{date}</div>
              <div className="density-bar">
                {Object.entries(colDensity[i]).map(([cat, h]) => (
                  <span key={cat} style={{ '--seg': `var(--c-${cat}-bar)`, flex: h }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="week-cols">
          {WEEK_DATES.map((date, dayIdx) => {
            const dayBlocks = WEEK_BLOCKS.filter(b => b.day === dayIdx);
            const laid = layoutOverlaps(dayBlocks);
            return (
              <div key={dayIdx} className={`week-col ${dayIdx === NOW.day ? 'today' : ''}`} style={{ height: (DAY_END - DAY_START) * HOUR_PX + 24 }}>
                {hours.map(h => (
                  <div key={h} className="day-grid-line" style={{ top: (h - DAY_START) * HOUR_PX }} />
                ))}
                {laid.map(({ block, col, cols }) => {
                  const top = (block.start - DAY_START) * HOUR_PX;
                  const height = Math.max((block.end - block.start) * HOUR_PX - 2, 18);
                  const widthPct = 100 / cols;
                  return (
                    <button
                      key={block.id}
                      className="block"
                      style={{
                        ...tintStyle(block.cat),
                        top, height,
                        left: `calc(${col * widthPct}% + 3px)`,
                        width: `calc(${widthPct}% - 6px)`,
                        right: 'auto',
                      }}
                      onClick={() => onOpenBlock(block)}
                      data-block-id={block.id}
                    >
                      <div className="block-title" style={{ fontSize: 11.5 }}>{block.title}</div>
                      {height > 28 && (
                        <div className="block-time" style={{ fontSize: 9.5 }}>{fmtH(block.start)}</div>
                      )}
                    </button>
                  );
                })}
                {dayIdx === NOW.day && (
                  <div className="now-bar" style={{ top: (NOW.hour - DAY_START) * HOUR_PX, left: 0 }}>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============== DAILY SUMMARY ==============
function DailySummary({ dayIndex, onOpenOverview }) {
  const dayBlocks = WEEK_BLOCKS.filter(b => b.day === dayIndex);
  const allDay = ALL_DAY.filter(a => a.day === dayIndex);
  const tasks = allDay.filter(a => a.type === 'task').length;
  const reminders = allDay.filter(a => a.type === 'reminder').length;
  const overdue = dayIndex === NOW.day ? 1 : 0;
  const totalHrs = dayBlocks.reduce((s, b) => s + (b.end - b.start), 0);

  return (
    <div className="summary">
      <button className="sum-chip" onClick={onOpenOverview}>
        <span className="sum-num">{dayBlocks.length}</span>
        <span>тайм-блоков</span>
        <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>· {totalHrs.toFixed(1)} ч</span>
      </button>
      <button className="sum-chip">
        <span className="sum-num">{tasks}</span>
        <span>задач</span>
      </button>
      <button className="sum-chip">
        <span className="sum-num">{reminders}</span>
        <span>напомнить</span>
      </button>
      {overdue > 0 && (
        <button className="sum-chip alert">
          <span className="sum-num">{overdue}</span>
          <span>просрочено</span>
        </button>
      )}
    </div>
  );
}

window.LIFEOS_VIEWS = { Sidebar, DayView, WeekView, DailySummary, Icon, fmtH, DOW_FULL, MONTHS_RU, MONTHS_RU_GEN, WEEK_DATES, NOW, HOUR_PX, DAY_START, DAY_END };
