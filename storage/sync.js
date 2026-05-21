/* LIFEOS — storage/sync.js
 * Two resilience layers on top of IndexedDB:
 *
 *  Layer 2 — File System Access API
 *    Writes lifeos-data.json to a real file on the user's disk.
 *    Survives "Clear site data", browser reinstall, OS reinstall.
 *    FileSystemFileHandle persisted in IndexedDB syncMeta store.
 *
 *  Layer 3 — GitHub Gist
 *    Stores one private JSON file in the user's GitHub account.
 *    Survives device change. Requires a Personal Access Token (scope: gist).
 *    Token stored in localStorage (never leaves the device unless used in fetch).
 *
 * Both are debounced and fully automatic after initial one-time setup.
 * Exposes window.LIFEOS_SYNC.
 */
(function () {
  'use strict';

  // ── Storage keys ─────────────────────────────────────────────────────────
  var FILE_HANDLE_KEY = 'lifeos_file_handle';
  var GIST_TOKEN_KEY  = 'lifeos_gist_token';
  var GIST_ID_KEY     = 'lifeos_gist_id';
  var LAST_SYNC_KEY   = 'lifeos_last_gist_sync';

  // ── Runtime state ─────────────────────────────────────────────────────────
  var _fileHandle = null;
  var _fileTimer  = null;
  var _gistTimer  = null;

  // ── File System Access API internals ──────────────────────────────────────
  async function _restoreFileHandle() {
    try {
      var r = await window.LIFEOS_DB.db.syncMeta.get(FILE_HANDLE_KEY);
      if (!r) return false;
      var handle = r.value;
      // Check/request permission without user gesture (may silently fail)
      var perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') { _fileHandle = handle; return true; }
      // Will need a gesture to actually get permission — store handle for later
      _fileHandle = handle;
      return 'needs-gesture'; // caller can request on next user interaction
    } catch (e) {
      return false;
    }
  }

  async function _ensureFilePermission() {
    if (!_fileHandle) return false;
    try {
      var perm = await _fileHandle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') return true;
      perm = await _fileHandle.requestPermission({ mode: 'readwrite' });
      return perm === 'granted';
    } catch (e) {
      return false;
    }
  }

  async function _writeToFile(data) {
    if (!_fileHandle) return;
    var ok = await _ensureFilePermission();
    if (!ok) return;
    try {
      var writable = await _fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    } catch (e) {
      console.warn('[LIFEOS Sync] File write failed:', e.message);
    }
  }

  async function _readFromFile(handle) {
    handle = handle || _fileHandle;
    if (!handle) return null;
    try {
      var file = await handle.getFile();
      var text = await file.text();
      if (!text || text === '{}') return null;
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  // ── GitHub Gist internals ─────────────────────────────────────────────────
  function _gistToken() { return localStorage.getItem(GIST_TOKEN_KEY); }
  function _gistId()    { return localStorage.getItem(GIST_ID_KEY); }

  function _gistHeaders() {
    var token = _gistToken();
    if (!token) return null;
    return { Authorization: 'token ' + token, 'Content-Type': 'application/json' };
  }

  async function _syncToGist(data) {
    var headers = _gistHeaders();
    var gistId  = _gistId();
    if (!headers || !gistId) return;
    try {
      var res = await fetch('https://api.github.com/gists/' + gistId, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({
          files: { 'lifeos-data.json': { content: JSON.stringify(data, null, 2) } },
        }),
      });
      if (res.ok) {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        console.log('[LIFEOS Sync] Gist ✓', new Date().toLocaleTimeString());
      } else {
        console.warn('[LIFEOS Sync] Gist HTTP', res.status);
      }
    } catch (e) {
      console.warn('[LIFEOS Sync] Gist failed:', e.message);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.LIFEOS_SYNC = {

    // Called by DB layer after every mutation (debounced internally)
    onDataChanged: function(data) {
      // Layer 2: file on disk (debounced 2 s)
      clearTimeout(_fileTimer);
      _fileTimer = setTimeout(function() { _writeToFile(data); }, 2000);

      // Layer 3: GitHub Gist (debounced 15 min)
      clearTimeout(_gistTimer);
      _gistTimer = setTimeout(function() { _syncToGist(data); }, 15 * 60 * 1000);
    },

    // Called once on app boot — restores any persisted handles
    init: async function() {
      var fileStatus = await _restoreFileHandle();
      return {
        fileConfigured:  !!_fileHandle,
        fileNeedsGesture: fileStatus === 'needs-gesture',
        gistConfigured:  !!(localStorage.getItem(GIST_TOKEN_KEY) && localStorage.getItem(GIST_ID_KEY)),
        lastGistSync:    localStorage.getItem(LAST_SYNC_KEY),
      };
    },

    // Try to load data from file (called on boot if IndexedDB is empty)
    loadFromFile: async function() {
      return _readFromFile();
    },

    // Try to load data from Gist (called on boot if IndexedDB and file both empty)
    loadFromGist: async function() {
      var headers = _gistHeaders();
      var gistId  = _gistId();
      if (!headers || !gistId) return null;
      try {
        var res = await fetch('https://api.github.com/gists/' + gistId, { headers: headers });
        if (!res.ok) return null;
        var gist = await res.json();
        var content = gist.files && gist.files['lifeos-data.json'] && gist.files['lifeos-data.json'].content;
        if (!content || content === '{}') return null;
        return JSON.parse(content);
      } catch (e) {
        console.warn('[LIFEOS Sync] Gist load failed:', e.message);
        return null;
      }
    },

    // ── File setup (requires user gesture) ───────────────────────────────────
    hasFileSupport: function() {
      return typeof window.showSaveFilePicker === 'function';
    },

    isFileConfigured: function() { return !!_fileHandle; },

    // Let user choose where to save — shows OS file picker
    pickSaveFile: async function() {
      if (!this.hasFileSupport()) return { status: 'unsupported' };
      try {
        var handle = await window.showSaveFilePicker({
          suggestedName: 'lifeos-data.json',
          types: [{
            description: 'LIFEOS Data',
            accept: { 'application/json': ['.json'] },
          }],
        });
        await handle.requestPermission({ mode: 'readwrite' });
        await window.LIFEOS_DB.db.syncMeta.put({ key: FILE_HANDLE_KEY, value: handle });
        _fileHandle = handle;
        // Write current data immediately
        var data = await window.LIFEOS_DB.loadAll();
        await _writeToFile(data);
        return { status: 'configured' };
      } catch (e) {
        if (e.name === 'AbortError') return { status: 'cancelled' };
        return { status: 'error', message: e.message };
      }
    },

    // Let user pick an existing lifeos-data.json to restore from
    pickOpenFile: async function() {
      if (!this.hasFileSupport()) return { status: 'unsupported' };
      try {
        var handles = await window.showOpenFilePicker({
          types: [{
            description: 'LIFEOS Data',
            accept: { 'application/json': ['.json'] },
          }],
        });
        var handle = handles[0];
        await handle.requestPermission({ mode: 'readwrite' });
        await window.LIFEOS_DB.db.syncMeta.put({ key: FILE_HANDLE_KEY, value: handle });
        _fileHandle = handle;
        var data = await _readFromFile(handle);
        return { status: 'ok', data: data };
      } catch (e) {
        if (e.name === 'AbortError') return { status: 'cancelled' };
        return { status: 'error', message: e.message };
      }
    },

    disconnectFile: async function() {
      _fileHandle = null;
      try { await window.LIFEOS_DB.db.syncMeta.delete(FILE_HANDLE_KEY); } catch(e) {}
    },

    // ── GitHub Gist setup ────────────────────────────────────────────────────
    isGistConfigured: function() {
      return !!(localStorage.getItem(GIST_TOKEN_KEY) && localStorage.getItem(GIST_ID_KEY));
    },

    getLastSync: function() {
      var iso = localStorage.getItem(LAST_SYNC_KEY);
      return iso ? new Date(iso) : null;
    },

    // Validate token + create/find Gist + do initial sync
    setupGist: async function(token) {
      // 1. Validate token
      try {
        var testRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: 'token ' + token },
        });
        if (!testRes.ok) return { status: 'invalid_token' };
      } catch(e) {
        return { status: 'network_error', message: e.message };
      }

      // 2. Look for an existing LIFEOS gist
      var gistsRes = await fetch('https://api.github.com/gists?per_page=100', {
        headers: { Authorization: 'token ' + token },
      });
      var gists = await gistsRes.json();
      var existing = Array.isArray(gists)
        ? gists.find(function(g) { return g.files && g.files['lifeos-data.json']; })
        : null;

      var gistId;
      var existingDataFound = false;

      if (existing) {
        gistId = existing.id;
        existingDataFound = true;
      } else {
        // 3. Create a new private gist
        var createRes = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: { Authorization: 'token ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: 'LIFEOS — Personal Life OS Backup',
            public: false,
            files: { 'lifeos-data.json': { content: '{}' } },
          }),
        });
        var gist = await createRes.json();
        gistId = gist.id;
      }

      localStorage.setItem(GIST_TOKEN_KEY, token);
      localStorage.setItem(GIST_ID_KEY, gistId);

      // 4. Sync current data immediately
      var data = await window.LIFEOS_DB.loadAll();
      await _syncToGist(data);

      return { status: 'configured', gistId: gistId, existingDataFound: existingDataFound };
    },

    // Force an immediate sync (e.g., from "Sync now" button)
    syncNow: async function() {
      var data = await window.LIFEOS_DB.loadAll();
      await _syncToGist(data);
      await _writeToFile(data);
    },

    disconnectGist: function() {
      localStorage.removeItem(GIST_TOKEN_KEY);
      localStorage.removeItem(GIST_ID_KEY);
      localStorage.removeItem(LAST_SYNC_KEY);
    },

    // ── Backup helpers ────────────────────────────────────────────────────────
    // Download a JSON file via browser download dialog
    downloadBackup: async function() {
      var json = await window.LIFEOS_DB.exportJSON();
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'lifeos-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // Import from a File object (e.g., from <input type="file">)
    importFromFile: async function(file) {
      var text = await file.text();
      return window.LIFEOS_DB.importJSON(text);
    },
  };

  console.log('[LIFEOS] Sync layer ready (FSAA + Gist)');
})();
