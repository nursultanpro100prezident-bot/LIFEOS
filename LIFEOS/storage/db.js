/* LIFEOS — storage/db.js
 * IndexedDB layer via Dexie.js (loaded as UMD global before Babel scripts).
 * Exposes window.LIFEOS_DB with async CRUD, snapshots, import/export.
 */
(function () {
  'use strict';

  // ── Schema ────────────────────────────────────────────────────────────────
  var db = new Dexie('LIFEOS_v1');
  db.version(1).stores({
    categories:     'id',
    blocks:         'id, day, cat',
    allDay:         'id, day, type',
    checklistState: 'blockId',
    settings:       'key',
    syncMeta:       'key',
    snapshots:      '++id, createdAt',
  });

  // ── Change listeners ──────────────────────────────────────────────────────
  var _listeners = [];

  function _notify(data) {
    _listeners.forEach(function(fn) { fn(data); });
  }

  // ── Core load ─────────────────────────────────────────────────────────────
  async function _loadAll() {
    var results = await Promise.all([
      db.categories.toArray(),
      db.blocks.toArray(),
      db.allDay.toArray(),
    ]);
    return { categories: results[0], blocks: results[1], allDay: results[2] };
  }

  async function _notifyFull() {
    var data = await _loadAll();
    _notify(data);
    // Forward to sync layer (file + Gist) if available
    if (window.LIFEOS_SYNC) {
      window.LIFEOS_SYNC.onDataChanged(data);
    }
    return data;
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.LIFEOS_DB = {
    db: db,

    /** Register a callback invoked after any data mutation.
     *  Receives { categories, blocks, allDay }. */
    onDataChange: function(fn) { _listeners.push(fn); },

    /** Init DB. Seeds from defaultData on first run.
     *  Returns { categories, blocks, allDay, isFirstRun }. */
    init: async function(defaultData) {
      await db.open();
      var count = await db.categories.count();

      if (count === 0) {
        // First run — seed with default/demo data
        await db.transaction('rw', db.categories, db.blocks, db.allDay, async function() {
          await db.categories.bulkPut(defaultData.CATEGORIES);
          await db.blocks.bulkPut(defaultData.WEEK_BLOCKS);
          await db.allDay.bulkPut(defaultData.ALL_DAY);
        });
        return {
          categories: defaultData.CATEGORIES,
          blocks:     defaultData.WEEK_BLOCKS,
          allDay:     defaultData.ALL_DAY,
          isFirstRun: true,
        };
      }

      var data = await _loadAll();
      return Object.assign({ isFirstRun: false }, data);
    },

    loadAll: async function() { return _loadAll(); },

    // ── Blocks ───────────────────────────────────────────────────────────────
    saveBlock: async function(block) {
      await db.blocks.put(block);
      return _notifyFull();
    },

    updateBlock: async function(id, changes) {
      await db.blocks.update(id, changes);
      return _notifyFull();
    },

    deleteBlock: async function(id) {
      await db.blocks.delete(id);
      return _notifyFull();
    },

    // ── Categories ───────────────────────────────────────────────────────────
    saveCategory: async function(category) {
      await db.categories.put(category);
      return _notifyFull();
    },

    updateCategory: async function(id, changes) {
      await db.categories.update(id, changes);
      return _notifyFull();
    },

    // ── All-day items ────────────────────────────────────────────────────────
    saveAllDay: async function(item) {
      await db.allDay.put(item);
      return _notifyFull();
    },

    deleteAllDay: async function(id) {
      await db.allDay.delete(id);
      return _notifyFull();
    },

    // ── Checklist state (granular, no full reload needed) ────────────────────
    saveChecklistState: async function(blockId, checkedSet) {
      await db.checklistState.put({ blockId: blockId, items: Array.from(checkedSet) });
    },

    loadChecklistState: async function(blockId) {
      var r = await db.checklistState.get(blockId);
      return r ? new Set(r.items) : new Set();
    },

    // ── Settings (key/value) ─────────────────────────────────────────────────
    getSetting: async function(key, defaultVal) {
      var r = await db.settings.get(key);
      return (r !== undefined) ? r.value : defaultVal;
    },

    setSetting: async function(key, value) {
      await db.settings.put({ key: key, value: value });
    },

    // ── Snapshots ────────────────────────────────────────────────────────────
    createSnapshot: async function(reason) {
      var data = await _loadAll();
      await db.snapshots.add({
        createdAt: new Date().toISOString(),
        reason:    reason || 'auto',
        data:      data,
      });
      // Keep only 30 most recent
      var all = await db.snapshots.orderBy('id').toArray();
      if (all.length > 30) {
        var toDelete = all.slice(0, all.length - 30).map(function(s) { return s.id; });
        await db.snapshots.bulkDelete(toDelete);
      }
    },

    listSnapshots: async function() {
      return db.snapshots.orderBy('createdAt').reverse().limit(10).toArray();
    },

    restoreSnapshot: async function(id) {
      var snap = await db.snapshots.get(id);
      if (!snap) throw new Error('Snapshot not found: ' + id);
      await db.transaction('rw', db.categories, db.blocks, db.allDay, async function() {
        await db.categories.clear(); await db.categories.bulkPut(snap.data.categories);
        await db.blocks.clear();     await db.blocks.bulkPut(snap.data.blocks);
        await db.allDay.clear();     await db.allDay.bulkPut(snap.data.allDay);
      });
      return _notifyFull();
    },

    // ── Full reset (saves snapshot first) ────────────────────────────────────
    reset: async function(defaultData) {
      await this.createSnapshot('before_reset');
      await db.transaction('rw', db.categories, db.blocks, db.allDay, db.checklistState, async function() {
        await db.categories.clear();    await db.categories.bulkPut(defaultData.CATEGORIES);
        await db.blocks.clear();        await db.blocks.bulkPut(defaultData.WEEK_BLOCKS);
        await db.allDay.clear();        await db.allDay.bulkPut(defaultData.ALL_DAY);
        await db.checklistState.clear();
      });
      return _notifyFull();
    },

    // ── Export / Import ──────────────────────────────────────────────────────
    exportJSON: async function() {
      var data = await _loadAll();
      return JSON.stringify({
        version:    1,
        exportedAt: new Date().toISOString(),
        categories: data.categories,
        blocks:     data.blocks,
        allDay:     data.allDay,
      }, null, 2);
    },

    importJSON: async function(jsonStr) {
      var parsed = JSON.parse(jsonStr);
      var categories = parsed.categories || [];
      var blocks     = parsed.blocks     || parsed.WEEK_BLOCKS || [];
      var allDay     = parsed.allDay     || parsed.ALL_DAY     || [];
      await this.createSnapshot('before_import');
      await db.transaction('rw', db.categories, db.blocks, db.allDay, async function() {
        await db.categories.clear(); await db.categories.bulkPut(categories);
        await db.blocks.clear();     await db.blocks.bulkPut(blocks);
        await db.allDay.clear();     await db.allDay.bulkPut(allDay);
      });
      return _notifyFull();
    },
  };

  console.log('[LIFEOS] DB layer ready (Dexie)');
})();
