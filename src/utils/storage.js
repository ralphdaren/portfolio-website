(function (Site) {
  // localStorage can throw (private mode, blocked site data), so every access is guarded.
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* not persisted */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* nothing to remove */ }
    },
  };

  Object.assign(Site, { storage });
})(window.Site = window.Site || {});
