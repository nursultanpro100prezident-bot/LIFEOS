/* eslint-disable */
// LIFEOS — app.js — main shell wiring views + overlays + tweaks + storage

const { useState: useStateA, useEffect: useEffectA, useCallback: useCallbackA } = React;
const V = window.LIFEOS_VIEWS;
const O = window.LIFEOS_OVERLAYS;
const D = window.LIFEOS_DATA;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "pastels",
  "theme": "light",
  "density": "cozy",
  "showSidebar": true
}/*EDITMODE-END*/;

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'var(--bg)',
      gap: 16, zIndex: 9999
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--hairline)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
        LIFEOS LOADING…
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  const [loading, setLoading]           = useStateA(true);
  const [tick, setTick]                 = useStateA(0);
  const [view, setView]                 = useStateA('day');
  const [selectedDay, setSelectedDay]   = useStateA(V.NOW.day);
  const [openBlock, setOpenBlock]       = useStateA(null);
  const [searchOpen, setSearchOpen]     = useStateA(false);
  const [quickOpen, setQuickOpen]       = useStateA(false);
  const [overviewOpen, setOverviewOpen] = useStateA(false);
  const [openCatProfile, setOpenCatProfile] = useStateA(null);

  // Tweaks
  const [t, setTweakRaw] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const setTweak = setTweakRaw;

  // Apply palette + theme + density to <body>
  useEffectA(() => {
    document.body.setAttribute('data-palette', t.palette || 'pastels');
    document.body.setAttribute('data-theme', t.theme || 'light');
    document.body.setAttribute('data-density', t.density || 'cozy');
  }, [t.palette, t.theme, t.density]);

  // Category filter: persist to localStorage
  const [catFilters, setCatFilters] = useStateA(() => {
    try {
      const saved = localStorage.getItem('lifeos_catFilters');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(D.CATEGORIES.map(c => c.id));
  });

  const updateCatFilters = useCallbackA((next) => {
    setCatFilters(next);
    try { localStorage.setItem('lifeos_catFilters', JSON.stringify([...next])); } catch {}
  }, []);

  // DB init + live reload via onDataChange
  useEffectA(() => {
    const spliceGlobals = (data) => {
      if (data.categories && data.categories.length > 0) {
        D.CATEGORIES.splice(0, D.CATEGORIES.length, ...data.categories);
        data.categories.forEach(c => { D.CAT_BY_ID[c.id] = c; });
      }
      if (data.blocks) {
        D.WEEK_BLOCKS.splice(0, D.WEEK_BLOCKS.length, ...data.blocks);
      }
      if (data.allDay) {
        D.ALL_DAY.splice(0, D.ALL_DAY.length, ...data.allDay);
      }
      setTick(n => n + 1);
    };

    if (window.LIFEOS_DB) {
      window.LIFEOS_DB.onDataChange(spliceGlobals);
    }

    async function init() {
      try {
        if (window.LIFEOS_SYNC) await window.LIFEOS_SYNC.init();
        if (window.LIFEOS_DB) {
          const loaded = await window.LIFEOS_DB.init(D);
          spliceGlobals(loaded);
        }
      } catch (err) {
        console.error('LIFEOS: storage init failed', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Filter blocks by visible categories
  const visibleBlocks = D.WEEK_BLOCKS.filter(b => catFilters.has(b.cat));
  const dayBlocks = visibleBlocks.filter(b => b.day === selectedDay);

  // Keyboard shortcuts
  useEffectA(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'k') { e.preventDefault(); setQuickOpen(true); }
        if (e.key.toLowerCase() === 'f') { e.preventDefault(); setSearchOpen(true); }
      }
      if (!e.metaKey && !e.ctrlKey) {
        if (e.key === 'd' || e.key === 'D') setView('day');
        if (e.key === 'w' || e.key === 'W') setView('week');
        if (e.key === '/') { e.preventDefault(); setSearchOpen(true); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading) return <LoadingScreen />;

  const date = V.WEEK_DATES[selectedDay];

  return (
    <>
      {/* ============ TOP BAR ============ */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot"/>
          LIFEOS
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--hairline)', margin: '0 8px' }}/>
        <div className="crumbs">
          <b>{V.MONTHS_RU[4]}</b> · 2026 · {V.DOW_FULL[selectedDay]}, {date}
        </div>
        <div className="topbar-spacer"/>

        <div className="pill-group">
          <button aria-pressed={view === 'day'}   onClick={() => setView('day')}>День</button>
          <button aria-pressed={view === 'week'}  onClick={() => setView('week')}>Неделя</button>
          <button aria-pressed={view === 'month'} onClick={() => {/* not implemented yet */}}>Месяц</button>
        </div>

        <button className="icon-btn" title="Поиск (⌘F)" onClick={() => setSearchOpen(true)}>
          <V.Icon name="search" size={16}/>
        </button>
        <button className="icon-btn primary" title="Добавить (⌘K)" onClick={() => setQuickOpen(true)}>
          <V.Icon name="plus" size={18}/>
        </button>
      </header>

      {/* ============ MAIN GRID ============ */}
      <div className="main">
        {t.showSidebar && (
          <V.Sidebar
            catFilters={catFilters}
            setCatFilters={updateCatFilters}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onOpenCategory={setOpenCatProfile}
          />
        )}

        <main className="canvas">
          <div className="canvas-header">
            <div>
              <h1 className="canvas-title">
                {view === 'day' ? (
                  <>
                    <span>{date} {V.MONTHS_RU_GEN[4]}</span>
                    <span className="year-mono">— {V.DOW_FULL[selectedDay].toLowerCase()}</span>
                  </>
                ) : (
                  <>
                    <span>Май <span style={{ color: 'var(--ink-3)' }}>18–24</span></span>
                    <span className="year-mono">— нед. 21 · 2026</span>
                  </>
                )}
              </h1>
              <div className="canvas-subtitle">
                {view === 'day' ? `${dayBlocks.length} тайм-блоков · план дня` : `7 дней · ${visibleBlocks.length} событий`}
              </div>
            </div>

            <V.DailySummary dayIndex={selectedDay} onOpenOverview={() => setOverviewOpen(true)}/>
          </div>

          {view === 'day' ? (
            <V.DayView
              blocks={dayBlocks}
              dayIndex={selectedDay}
              onOpenBlock={(b) => setOpenBlock(b)}
            />
          ) : (
            <V.WeekView
              onOpenBlock={(b) => setOpenBlock(b)}
              density={t.density}
              onSelectDay={(d) => { setSelectedDay(d); setView('day'); }}
            />
          )}

          <button className="fab" title="Quick Add · ⌘K" onClick={() => setQuickOpen(true)}>
            <V.Icon name="plus" size={22}/>
          </button>
        </main>
      </div>

      {/* ============ OVERLAYS ============ */}
      {openBlock && <O.BlockOverlay block={openBlock} onClose={() => setOpenBlock(null)} />}
      {openCatProfile && <O.CategoryProfileDirect catId={openCatProfile} onClose={() => setOpenCatProfile(null)} />}
      {searchOpen && <O.SearchModal onClose={() => setSearchOpen(false)} onOpenBlock={(b) => setOpenBlock(b)} onOpenCategory={setOpenCatProfile}/>}
      {quickOpen && <O.QuickAdd onClose={() => setQuickOpen(false)} currentDay={selectedDay}/>}
      {overviewOpen && <O.DayOverview dayIndex={selectedDay} onClose={() => setOverviewOpen(false)} onOpenBlock={(b) => setOpenBlock(b)}/>}

      {/* ============ TWEAKS PANEL ============ */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Палитра & тема">
            <window.TweakRadio
              label="Тема"
              value={t.theme}
              options={[{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }]}
              onChange={(v) => setTweak('theme', v)}
            />
            <window.TweakRadio
              label="Палитра"
              value={t.palette}
              options={[
                { label: 'Pastels', value: 'pastels' },
                { label: 'Earthy', value: 'earthy' },
                { label: 'Jewel', value: 'jewel' },
              ]}
              onChange={(v) => setTweak('palette', v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Плотность">
            <window.TweakRadio
              label="Блоки"
              value={t.density}
              options={[
                { label: 'Compact', value: 'compact' },
                { label: 'Cozy', value: 'cozy' },
                { label: 'Airy', value: 'airy' },
              ]}
              onChange={(v) => setTweak('density', v)}
            />
            <window.TweakToggle
              label="Боковая панель"
              checked={!!t.showSidebar}
              onChange={(v) => setTweak('showSidebar', v)}
            />
          </window.TweakSection>
          <window.TweakSection label="Синхронизация">
            <window.TweakButton
              label="Сохранить в файл"
              onClick={async () => {
                if (window.LIFEOS_SYNC) await window.LIFEOS_SYNC.pickSaveFile();
              }}
            />
            <window.TweakButton
              label="Экспорт JSON"
              onClick={async () => {
                if (!window.LIFEOS_DB) return;
                const json = await window.LIFEOS_DB.exportJSON();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'lifeos-backup.json'; a.click();
                URL.revokeObjectURL(url);
              }}
            />
            <window.TweakButton
              label="Импорт JSON"
              onClick={() => {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = '.json';
                inp.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (!file || !window.LIFEOS_SYNC) return;
                  await window.LIFEOS_SYNC.importFromFile(file);
                };
                inp.click();
              }}
            />
          </window.TweakSection>
          <window.TweakSection label="Палитра · превью">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {D.CATEGORIES.map(c => (
                <div key={c.id} style={{ ...D.tintStyle(c.id), background: 'oklch(var(--tint))', borderRadius: 8, padding: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, background: 'oklch(var(--tint-bar))' }}/>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'oklch(var(--tint-ink))', textTransform: 'uppercase' }}>{c.nameRu}</div>
                </div>
              ))}
            </div>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
