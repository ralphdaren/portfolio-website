// localStorage can throw (private mode, blocked site data), so every access is guarded.
export const storage = {
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
