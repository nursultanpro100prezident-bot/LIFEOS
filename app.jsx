/* eslint-disable */
// LIFEOS — app.jsx — main shell
// Initialises IndexedDB on mount, loads live data, threads it as props.
// Three-layer storage: IndexedDB → File on disk → GitHub Gist.

const {
  useState:   useStateA,
  useEffect:  useEffectA,
  useCallback: useCallbackA,
  useMemo:    useMemoA,
} = React;

const V = window.LIFEOS_VIEWS;
const O = window.LIFEOS_OVERLAYS;
const D = window.LIFEOS_DATA;    // always reflects latest spliced arrays

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette":     "pastels",
  "theme":       "light",
  "density":     "cozy",
  "showSidebar": true
}/*EDITMODE-END*/;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Splice arr contents in place so module-level var references stay valid */
function spliceArr(arr, newItems) {
  arr.splice(0, arr.length, ...newItems);
}

/** Apply loaded data into the shared window.LIFEOS_DATA globals */
function applyToGlobals({ categories, blocks, allDay }) {
  spliceArr(D.CATEGORIES, categories);
  spliceArr(D.WEEK_BLOCKS, blocks);
  spliceArr(D.ALL_DAY, allDay);
  // Update CAT_BY_ID in-place (components reference same object)
  categories.forEach(c => { D.CAT_BY_ID[c.id] = c; });
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 16, color: 'var(--ink-3)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--hairline-2)',
        borderTopColor: 'var(--ink)',
        animation: 'lifeos-spin 0.7s linear infinite',
      }}/>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em' }}>
        LIFEOS · загрузка данных…
      </div>
      <style>{`@keyframes lifeos-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Storage settings panel ────────────────────────────────────────────────────
function StorageSettings({ syncStatus, onSyncStatusChange }) {
  const [gistToken, setGistToken] = useStateA('');
  const [gistStatus, setGistStatus] = useStateA('');
  const [fileStatus, setFileStatus] = useStateA('');
  const [importing, setImporting] = useStateA(false);
  const fileInputRef = React.useRef(null);

  const handlePickFile = async () => {
    setFileStatus('выбираю…');
    const result = await window.LIFEOS_SYNC.pickSaveFile();
    if (result.status === 'configured') {
      setFileStatus('✅ файл подключён');
      onSyncStatusChange();
    } else if (result.status === 'cancelled') {
      setFileStatus('');
    } else if (result.status === 'unsupported') {
      setFileStatus('⚠️ браузер не поддерживает (нужен Chrome/Edge)');
    } else {
      setFileStatus('❌ ' + (result.message || 'ошибка'));
    }
  };

  const handleConnectGist = async () => {
    const token = gistToken.trim();
    if (!token) return;
    setGistStatus('подключаю…');
    const result = await window.LIFEOS_SYNC.setupGist(token);
    if (result.status === 'configured') {
      setGistStatus(result.existingDataFound
        ? '✅ подключён · найдены существующие данные'
        : '✅ подключён · создан новый Gist');
      setGistToken('');
      onSyncStatusChange();
    } else if (result.status === 'invalid_token') {
      setGistStatus('❌ неверный токен');
    } else {
      setGistStatus('❌ ' + (result.message || 'ошибка сети'));
    }
  };

  const handleSyncNow = async () => {
    setGistStatus('синхронизирую…');
    await window.LIFEOS_SYNC.syncNow();
    setGistStatus('✅ синхронизировано в ' + new Date().toLocaleTimeString());
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      await window.LIFEOS_SYNC.importFromFile(file);
      // Data reload happens via onDataChange callback in App
    } catch(err) {
      alert('Ошибка импорта: ' + err.message);
    }
    setImporting(false);
    e.target.value = '';
  };

  const lastSync = window.LIFEOS_SYNC.getLastSync
    ? window.LIFEOS_SYNC.getLastSync()
    : null;

  return (
    <>
      {/* ── File System ── */}
      <window.TweakSection label="Файл на диске · Слой 2">
        <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
          {syncStatus.fileConfigured
            ? '✅ Файл подключён — данные пишутся автоматически'
            : '⚠️ Не настроен — данные могут потеряться при очистке браузера'}
        </div>
        <window.TweakButton
          label={syncStatus.fileConfigured ? 'Изменить файл' : '+ Выбрать файл сохранения'}
          onClick={handlePickFile}
          secondary={syncStatus.fileConfigured}
        />
        {fileStatus && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', marginTop: 4 }}>
            {fileStatus}
          </div>
        )}
      </window.TweakSection>

      {/* ── GitHub Gist ── */}
      <window.TweakSection label="GitHub Gist · Слой 3">
        {syncStatus.gistConfigured ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
              ✅ Подключён · автосинхронизация каждые 15 мин
              {lastSync && (
                <div style={{ marginTop: 2 }}>
                  Последняя: {lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
            <window.TweakButton label="Синхронизировать сейчас" onClick={handleSyncNow} secondary />
            {gistStatus && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', marginTop: 4 }}>
                {gistStatus}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 6 }}>
              Вставьте GitHub Personal Access Token (scope: gist).{' '}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=LIFEOS"
                target="_blank"
                rel="noopener"
                style={{ color: 'inherit' }}
              >Создать токен →</a>
            </div>
            <input
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                border: '0.5px solid rgba(0,0,0,.15)', borderRadius: 7,
                padding: '5px 8px', width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,.7)', outline: 'none',
              }}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={gistToken}
              onChange={e => setGistToken(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConnectGist(); }}
            />
            <window.TweakButton label="Подключить Gist" onClick={handleConnectGist} />
            {gistStatus && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-2)', marginTop: 4 }}>
                {gistStatus}
              </div>
            )}
          </>
        )}
      </window.TweakSection>

      {/* ── Manual backup ── */}
      <window.TweakSection label="Ручной бэкап">
        <window.TweakButton
          label="⬇ Скачать backup.json"
          onClick={() => window.LIFEOS_SYNC.downloadBackup()}
          secondary
        />
        <window.TweakButton
          label={importing ? 'Импортирую…' : '⬆ Восстановить из файла'}
          onClick={() => fileInputRef.current?.click()}
          secondary
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </window.TweakSection>
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  // ── Loading state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useStateA(true);

  // ── Live data (blocks + categories + allDay as React state) ───────────────
  const [data, setData] = useStateA({
    categories: D.CATEGORIES,
    blocks:     D.WEEK_BLOCKS,
    allDay:     D.ALL_DAY,
  });

  // ── Sync status (for StorageSettings UI) ──────────────────────────────────
  const [syncStatus, setSyncStatus] = useStateA({
    fileConfigured: false,
    gistConfigured: false,
  });

  const refreshSyncStatus = useCallbackA(() => {
    if (window.LIFEOS_SYNC) {
      setSyncStatus({
        fileConfigured: window.LIFEOS_SYNC.isFileConfigured(),
        gistConfigured: window.LIFEOS_SYNC.isGistConfigured(),
      });
    }
  }, []);

  // ── DB init on mount ───────────────────────────────────────────────────────
  useEffectA(() => {
    async function init() {
      // 1. Request persistent storage (protects IndexedDB from auto-eviction)
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(granted => {
          console.log('[LIFEOS] Persistent storage:', granted ? '✅' : '⚠️ not granted');
        });
      }

      // 2. Init sync layer (restores file handle from IndexedDB)
      if (window.LIFEOS_SYNC) {
        const syncInfo = await window.LIFEOS_SYNC.init();
        setSyncStatus({
          fileConfigured: syncInfo.fileConfigured,
          gistConfigured: syncInfo.gistConfigured,
        });
      }

      // 3. Init DB — seeds defaults on first run, loads from DB on subsequent runs
      const loaded = await window.LIFEOS_DB.init(D);

      // 4. If IndexedDB was empty (fresh install after Clear Site Data), try
      //    restoring from file or Gist before falling back to demo data.
      let finalData = { categories: loaded.categories, blocks: loaded.blocks, allDay: loaded.allDay };

      if (loaded.isFirstRun && window.LIFEOS_SYNC) {
        // Try file first
        const fromFile = await window.LIFEOS_SYNC.loadFromFile();
        if (fromFile && (fromFile.blocks || fromFile.WEEK_BLOCKS)) {
          console.log('[LIFEOS] Restored from file after fresh install');
          await window.LIFEOS_DB.importJSON(JSON.stringify(fromFile));
          const reloaded = await window.LIFEOS_DB.loadAll();
          finalData = reloaded;
        } else {
          // Try Gist
          const fromGist = await window.LIFEOS_SYNC.loadFromGist();
          if (fromGist && (fromGist.blocks || fromGist.WEEK_BLOCKS)) {
            console.log('[LIFEOS] Restored from Gist after fresh install');
            await window.LIFEOS_DB.importJSON(JSON.stringify(fromGist));
            const reloaded = await window.LIFEOS_DB.loadAll();
            finalData = reloaded;
          }
        }
      }

      // 5. Splice data into shared globals (for components still reading from DATA.*)
      applyToGlobals(finalData);

      // 6. Update React state → triggers re-render with live data
      setData({ ...finalData });
      setLoading(false);
    }

    // 7. Register for future DB changes (QuickAdd, checklist toggles, etc.)
    window.LIFEOS_DB.onDataChange((updatedData) => {
      applyToGlobals(updatedData);
      setData({ ...updatedData });
    });

    init().catch(err => {
      console.error('[LIFEOS] Init failed:', err);
      // Fallback: render with hardcoded defaults
      setLoading(false);
    });
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [view, setView] = useStateA('day');
  const [selectedDay, setSelectedDay] = useStateA(V.NOW.day);
  const [openBlock, setOpenBlock] = useStateA(null);
  const [searchOpen, setSearchOpen] = useStateA(false);
  const [quickOpen, setQuickOpen] = useStateA(false);
  const [overviewOpen, setOverviewOpen] = useStateA(false);
  const [openCatProfile, setOpenCatProfile] = useStateA(null);

  // ── Tweaks ─────────────────────────────────────────────────────────────────
  const [t, setTweakRaw] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const setTweak = setTweakRaw;

  useEffectA(() => {
    document.body.setAttribute('data-palette', t.palette || 'pastels');
    document.body.setAttribute('data-theme',   t.theme   || 'light');
    document.body.setAttribute('data-density', t.density || 'cozy');
  }, [t.palette, t.theme, t.density]);

  // ── Category filter — persisted in localStorage ────────────────────────────
  const [catFilters, setCatFiltersRaw] = useStateA(() => {
    try {
      const saved = localStorage.getItem('lifeos_catFilters');
      if (saved) return new Set(JSON.parse(saved));
    } catch(e) {}
    return new Set(D.CATEGORIES.map(c => c.id));
  });

  const setCatFilters = useCallbackA((next) => {
    setCatFiltersRaw(next);
    try { localStorage.setItem('lifeos_catFilters', JSON.stringify([...next])); } catch(e) {}
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  // ── Derived data ───────────────────────────────────────────────────────────
  const { blocks, categories, allDay } = data;

  const visibleBlocks = useMemoA(
    () => blocks.filter(b => catFilters.has(b.cat)),
    [blocks, catFilters]
  );

  const dayBlocks = useMemoA(
    () => visibleBlocks.filter(b => b.day === selectedDay),
    [visibleBlocks, selectedDay]
  );

  const dayAllDay = useMemoA(
    () => allDay.filter(a => a.day === selectedDay),
    [allDay, selectedDay]
  );

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

        {/* Sync status indicator */}
        {syncStatus.fileConfigured || syncStatus.gistConfigured ? (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)',
            letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759' }}/>
            {syncStatus.fileConfigured && syncStatus.gistConfigured ? 'файл + gist' : syncStatus.fileConfigured ? 'файл' : 'gist'}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em', opacity: 0.6 }}>
            только IndexedDB
          </div>
        )}

        <div className="pill-group" style={{ marginLeft: 8 }}>
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
            blocks={visibleBlocks}
            categories={categories}
            catFilters={catFilters}
            setCatFilters={setCatFilters}
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
                {view === 'day'
                  ? `${dayBlocks.length} тайм-блоков · план дня`
                  : `7 дней · ${visibleBlocks.length} событий`}
              </div>
            </div>

            <V.DailySummary dayIndex={selectedDay} onOpenOverview={() => setOverviewOpen(true)}/>
          </div>

          {view === 'day' ? (
            <V.DayView
              blocks={dayBlocks}
              allDayItems={dayAllDay}
              dayIndex={selectedDay}
              onOpenBlock={(b) => setOpenBlock(b)}
            />
          ) : (
            <V.WeekView
              blocks={visibleBlocks}
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
      {openBlock && (
        <O.BlockOverlay block={openBlock} onClose={() => setOpenBlock(null)} />
      )}
      {openCatProfile && (
        <O.CategoryProfileDirect catId={openCatProfile} onClose={() => setOpenCatProfile(null)} />
      )}
      {searchOpen && (
        <O.SearchModal
          onClose={() => setSearchOpen(false)}
          onOpenBlock={(b) => setOpenBlock(b)}
          onOpenCategory={setOpenCatProfile}
        />
      )}
      {quickOpen && (
        <O.QuickAdd
          currentDay={selectedDay}
          onClose={() => setQuickOpen(false)}
          onBlockSaved={() => {/* data update comes via LIFEOS_DB.onDataChange */}}
        />
      )}
      {overviewOpen && (
        <O.DayOverview
          dayIndex={selectedDay}
          onClose={() => setOverviewOpen(false)}
          onOpenBlock={(b) => setOpenBlock(b)}
        />
      )}

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
                { label: 'Earthy',  value: 'earthy'  },
                { label: 'Jewel',   value: 'jewel'   },
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
                { label: 'Cozy',    value: 'cozy'    },
                { label: 'Airy',    value: 'airy'    },
              ]}
              onChange={(v) => setTweak('density', v)}
            />
            <window.TweakToggle
              label="Боковая панель"
              value={!!t.showSidebar}
              onChange={(v) => setTweak('showSidebar', v)}
            />
          </window.TweakSection>

          <window.TweakSection label="Палитра · превью">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {categories.map(c => (
                <div key={c.id} style={{ ...D.tintStyle(c.id), background: 'oklch(var(--tint))', borderRadius: 8, padding: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: 3, position: 'absolute', left: 0, top: 0, bottom: 0, background: 'oklch(var(--tint-bar))' }}/>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'oklch(var(--tint-ink))', textTransform: 'uppercase' }}>{c.nameRu}</div>
                </div>
              ))}
            </div>
          </window.TweakSection>

          {/* ── Storage settings ── */}
          <StorageSettings syncStatus={syncStatus} onSyncStatusChange={refreshSyncStatus} />

        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
